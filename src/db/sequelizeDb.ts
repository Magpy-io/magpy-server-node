import * as path from 'path';
import { Sequelize } from 'sequelize';
import { v4 as uuid } from 'uuid';

import { sqliteDbFile } from '../config/config';
import { createFolder } from '../modules/diskBasicFunctions';
import { filterNull } from '../modules/functions';
import { DeviceDB, createDevicesModel } from './Devices.model';
import { PhotoDB, createImageModel } from './Image.model';
import { MediaIdDB, createMediaIdModel } from './MediaId.model';

let sequelize: Sequelize | null = null;

type modelFunctions<T> = {
  hasMany: (...args: any[]) => void;
  belongsTo: (...args: any[]) => void;
  sync: () => Promise<void>;
  destroy: <S>(options: { where: T extends S ? S : never }) => Promise<void>;
  findOne: <S>(options: {
    where: T extends S ? S : never;
  }) => Promise<{ dataValues: T } | null>;
  findAll: <S>(options: {
    where?: T extends S ? S : never;
    offset?: number;
    limit?: number;
    order?: any[];
    attributes?: string[];
  }) => Promise<Array<{ dataValues: T }>>;
  create: (data: T) => Promise<{ dataValues: T } | null>;
  count: () => Promise<number>;
  update: <S, U>(
    newFields: T extends U ? U : never,
    options: { where: T extends S ? S : never },
  ) => Promise<void>;
};

let ImageModel: modelFunctions<PhotoDB>;
let MediaIdModel: modelFunctions<MediaIdDB>;
let DeviceModel: modelFunctions<DeviceDB>;

async function openAndInitDB() {
  await openDb();
  ImageModel = createImageModel(sequelize!) as unknown as modelFunctions<PhotoDB>;
  MediaIdModel = createMediaIdModel(sequelize!) as unknown as modelFunctions<MediaIdDB>;
  DeviceModel = createDevicesModel(sequelize!) as unknown as modelFunctions<DeviceDB>;

  ImageModel.hasMany(MediaIdModel, {
    onDelete: 'CASCADE',
  });
  MediaIdModel.belongsTo(ImageModel);

  DeviceModel.hasMany(MediaIdModel);
  MediaIdModel.belongsTo(DeviceModel);

  await ImageModel.sync();
  await MediaIdModel.sync();
  await DeviceModel.sync();
}

async function openDb() {
  console.log('Opening connection to db');

  if (sequelize) {
    console.log('Db already opened, exiting');
    return;
  }

  if (sqliteDbFile != ':memory:') {
    const parsed = path.parse(sqliteDbFile);
    await createFolder(parsed.dir);
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteDbFile,
    //logging: (msg) => console.log("Sequelize : " + msg),
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('Connection to DB has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database');
    throw error;
  }
}

async function closeDb() {
  if (!sequelize) {
    return;
  }

  await sequelize.close();
  sequelize = null;
  console.log('Connection to DB closed');
}

async function getDeviceFromDB(deviceUniqueId: string) {
  const device = await DeviceModel.findOne({
    where: { deviceUniqueId: deviceUniqueId },
  });

  return device;
}

async function countDevicesInDB() {
  const count = await DeviceModel.count();

  return count;
}

async function getPhotoByMediaIdAll(
  photoMediaId: string,
  deviceUniqueId: string,
): Promise<Array<Photo>> {
  assertDbOpen();
  try {
    const device = await DeviceModel.findOne({
      where: { deviceUniqueId: deviceUniqueId },
    });

    if (!device) {
      return [];
    }

    // Possibly same mediaId present for multiple photos on the same device
    const mediaIds = await MediaIdModel.findAll({
      where: { mediaId: photoMediaId, deviceId: device.dataValues.id },
    });

    if (mediaIds.length == 0) {
      return [];
    }

    const imagesPromises = mediaIds.map(mediaId => {
      return getPhotoByIdFromDB(mediaId.dataValues.imageId);
    });

    const images = await Promise.all(imagesPromises);

    if (images.some(e => e == null)) {
      console.error(
        'Found some mediaIds where the imageId does not exist in db\nClearning the mediaIds.',
      );

      const deleteMediaIdsWithNoPhoto = images.map((e, index) => {
        if (e == null) {
          return MediaIdModel.destroy({
            where: { id: mediaIds[index].dataValues.id },
          });
        }
      });

      await Promise.all(deleteMediaIdsWithNoPhoto);
    }

    return filterNull(images);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotoByMediaIdFromDB(
  data: {
    mediaId: string;
  },
  deviceUniqueId: string,
): Promise<Photo | null> {
  assertDbOpen();
  try {
    const images = await getPhotoByMediaIdAll(data.mediaId, deviceUniqueId);

    if (images.length > 1) {
      console.error('Got more than one item from database with the same mediaId');
    }

    if (images.length >= 1) {
      return images[0];
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function addPhotoToDB(photo: AddPhotoType): Promise<Photo> {
  assertDbOpen();

  const dbPhoto = {
    ...photo,
    id: uuid(),
    date: new Date(photo.date),
    syncDate: new Date(photo.syncDate),
  };

  try {
    const image = await ImageModel.create(dbPhoto);

    if (!image) {
      throw new Error('Error adding photo to db');
    }

    let device = await getDeviceFromDB(photo.deviceUniqueId);

    if (!device) {
      device = await DeviceModel.create({
        id: uuid(),
        deviceUniqueId: photo.deviceUniqueId,
      });
    }

    if (!device) {
      throw new Error('Error adding device to db');
    }

    const mediaId = await MediaIdModel.create({
      id: uuid(),
      mediaId: photo.mediaId,
      imageId: dbPhoto.id,
      deviceId: device.dataValues.id,
    });

    if (!mediaId) {
      throw new Error('Error adding mediaId to db');
    }

    return {
      ...image.dataValues,
      mediaIds: [{ mediaId: photo.mediaId, deviceUniqueId: photo.deviceUniqueId }],
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function countPhotosInDB(): Promise<number> {
  assertDbOpen();
  try {
    return await ImageModel.count();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosFromDB(
  number: number,
  offset: number,
): Promise<{ photos: Photo[]; endReached: boolean }> {
  assertDbOpen();
  const nbPhotos = await countPhotosInDB();

  try {
    const imagesIds = await ImageModel.findAll({
      offset: offset,
      limit: number,
      order: [['date', 'DESC']],
      attributes: ['id'],
    });

    const imagesPromises = imagesIds.map(imageId => {
      return getPhotoByIdFromDB(imageId.dataValues.id);
    });

    const images = await Promise.all(imagesPromises);

    if (images.some(e => e == null)) {
      console.error(
        'getPhotosFromDB: Got at least one photo from db but when getting the same photo by id was not found',
      );
    }

    return {
      photos: filterNull(images),
      endReached: nbPhotos <= number + offset,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotoByIdFromDB(id: string): Promise<Photo | null> {
  assertDbOpen();
  try {
    const image = await ImageModel.findOne({
      where: { id: id },
    });

    if (!image) {
      return null;
    }

    const mediaIds = await MediaIdModel.findAll({
      where: { imageId: id },
    });

    const devicesPromises = mediaIds.map(async mediaId => {
      const device = await DeviceModel.findOne({
        where: { id: mediaId.dataValues.deviceId },
      });

      if (!device) {
        console.error(
          'Found some mediaIds where the deviceId does not exist in db\nClearning the mediaIds.',
        );

        await MediaIdModel.destroy({
          where: { id: mediaId.dataValues.id },
        });
        return null;
      }

      return {
        deviceUniqueId: device.dataValues.deviceUniqueId,
        mediaId: mediaId.dataValues.mediaId,
      };
    });

    const mediaIdsWithDevices = await Promise.all(devicesPromises);

    return {
      ...image.dataValues,
      mediaIds: filterNull(mediaIdsWithDevices),
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function deletePhotoByIdFromDB(id: string) {
  assertDbOpen();
  try {
    await ImageModel.destroy({
      where: {
        id: id,
      },
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosByMediaIdFromDB(
  photosData: Array<{
    mediaId: string;
  }>,
  deviceUniqueId: string,
): Promise<Array<Photo | null>> {
  assertDbOpen();
  try {
    const photosFoundPromise = photosData.map(photoData => {
      return getPhotoByMediaIdFromDB(photoData, deviceUniqueId);
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function checkPhotoExistsByMediaIdInDB(
  mediaId: string,
  deviceUniqueId: string,
): Promise<boolean> {
  assertDbOpen();
  try {
    const photo = await getPhotoByMediaIdFromDB({ mediaId }, deviceUniqueId);
    return !!photo;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosByIdFromDB(ids: string[]): Promise<Array<Photo | null>> {
  assertDbOpen();
  try {
    const photosFoundPromise = ids.map(id => {
      return getPhotoByIdFromDB(id);
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function updatePhotoMediaIdById(id: string, mediaId: string, deviceUniqueId: string) {
  assertDbOpen();
  try {
    let device = await getDeviceFromDB(deviceUniqueId);

    if (!device) {
      device = await DeviceModel.create({
        id: uuid(),
        deviceUniqueId: deviceUniqueId,
      });
    }

    if (!device) {
      throw new Error('Error adding photo to db');
    }

    const dbMediaId = await MediaIdModel.findOne({
      where: { imageId: id, deviceId: device.dataValues.id },
    });

    if (!dbMediaId) {
      const mediaIdCreated = await MediaIdModel.create({
        id: uuid(),
        mediaId: mediaId,
        imageId: id,
        deviceId: device.dataValues.id,
      });

      if (!mediaIdCreated) {
        throw new Error('updatePhotoMediaIdById: Error adding new mediaId to photo');
      }
    } else {
      await MediaIdModel.update(
        { mediaId: mediaId },
        { where: { id: dbMediaId.dataValues.id } },
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getAllMediaIdsByImageIdFromDB(imageId: string) {
  const mediaIds = (
    await MediaIdModel.findAll({
      where: { imageId: imageId },
    })
  ).map(e => e.dataValues);

  return mediaIds;
}

async function clearDB() {
  assertDbOpen();
  try {
    await (sequelize as Sequelize).drop();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function assertDbOpen() {
  if (sequelize == null) {
    throw new Error('Trying to use DB before opening it, call openDb before any operation');
  }
}

export type Photo = PhotoDB & {
  mediaIds: Array<{ deviceUniqueId: string; mediaId: string }>;
};

export type AddPhotoType = {
  name: string;
  fileSize: number;
  width: number;
  height: number;
  date: string;
  syncDate: string;
  mediaId: string;
  deviceUniqueId: string;
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
  hash: string;
};

export {
  openAndInitDB,
  openDb,
  closeDb,
  clearDB,
  getDeviceFromDB,
  countDevicesInDB,
  countPhotosInDB,
  addPhotoToDB,
  getPhotosFromDB,
  getPhotoByIdFromDB,
  checkPhotoExistsByMediaIdInDB,
  getPhotosByIdFromDB,
  getPhotoByMediaIdFromDB,
  getPhotosByMediaIdFromDB,
  getAllMediaIdsByImageIdFromDB,
  deletePhotoByIdFromDB,
  updatePhotoMediaIdById,
};
