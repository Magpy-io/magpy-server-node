import * as path from 'path';
import { Sequelize } from 'sequelize';
import { v4 as uuid } from 'uuid';

import { sqliteDbFile } from '../config/config';
import { createFolder } from '../modules/diskBasicFunctions';
import { filterNull } from '../modules/functions';
import { PhotoDB, createImageModel } from './Image.model';
import { MediaIdDB, createMediaIdModel } from './MediaId.model';
import { Logger } from '../modules/Logger';
import { migrateDb } from './migrateDb';

let sequelize: Sequelize | null = null;

type modelFunctions<T> = {
  hasMany: (...args: any[]) => void;
  belongsTo: (...args: any[]) => void;
  sync: () => Promise<void>;
  destroy: <S>(options: { where: T extends S ? S : never }) => Promise<void>;
  findOne: <S>(options: {
    where: T extends S ? S : never;
    include?: any;
  }) => Promise<{ dataValues: T } | null>;
  findAll: <S>(options: {
    where?: T extends S ? S : never;
    offset?: number;
    limit?: number;
    order?: any[];
    attributes?: string[];
    include?: any;
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

async function openAndInitDB() {
  await openDb();
  ImageModel = createImageModel(sequelize!) as unknown as modelFunctions<PhotoDB>;
  MediaIdModel = createMediaIdModel(sequelize!) as unknown as modelFunctions<MediaIdDB>;

  await migrateDb(sequelize!);
}

async function openDb() {
  Logger.info('Opening connection to db');
  if (sequelize) {
    Logger.info('Db already opened, exiting');
    return;
  }

  if (sqliteDbFile != ':memory:') {
    const parsed = path.parse(sqliteDbFile);
    await createFolder(parsed.dir);
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteDbFile,
    //logging: (msg) => Logger.debug("Sequelize : " + msg),
    logging: false,
  });

  try {
    await sequelize.authenticate();
    Logger.info('Connection to DB has been established successfully.');
  } catch (error) {
    Logger.error('Failed to connect to the database', error);
    throw error;
  }
}

async function closeDb() {
  if (!sequelize) {
    return;
  }

  await sequelize.close();
  sequelize = null;
  Logger.info('Connection to DB closed');
}

async function getPhotoByMediaIdAll(
  photoMediaId: string,
  deviceUniqueId: string,
): Promise<Array<Photo>> {
  assertDbOpen();

  // Possibly same mediaId present for multiple photos on the same device
  const mediaIds = await MediaIdModel.findAll({
    where: { mediaId: photoMediaId, deviceUniqueId },
  });

  if (mediaIds.length == 0) {
    return [];
  }

  const imagesPromises = mediaIds.map(mediaId => {
    return getPhotoByIdFromDB(mediaId.dataValues.imageId);
  });

  const images = await Promise.all(imagesPromises);

  if (images.some(e => e == null)) {
    Logger.warn(
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
}

async function getPhotoByMediaIdFromDB(
  data: {
    mediaId: string;
  },
  deviceUniqueId: string,
): Promise<Photo | null> {
  assertDbOpen();

  const images = await getPhotoByMediaIdAll(data.mediaId, deviceUniqueId);

  if (images.length > 1) {
    Logger.warn('Got more than one item from database with the same mediaId');
  }

  if (images.length >= 1) {
    return images[0];
  } else {
    return null;
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

  const image = await ImageModel.create(dbPhoto);

  if (!image) {
    throw new Error('Error adding photo to db');
  }

  const mediaId = await MediaIdModel.create({
    id: uuid(),
    mediaId: photo.mediaId,
    imageId: dbPhoto.id,
    deviceUniqueId: photo.deviceUniqueId,
  });

  if (!mediaId) {
    throw new Error('Error adding mediaId to db');
  }

  return {
    ...image.dataValues,
    mediaIds: [{ mediaId: photo.mediaId, deviceUniqueId: photo.deviceUniqueId }],
  };
}

async function countPhotosInDB(): Promise<number> {
  assertDbOpen();

  return await ImageModel.count();
}

async function getPhotosFromDB(
  number: number,
  offset: number,
): Promise<{ photos: Photo[]; endReached: boolean }> {
  assertDbOpen();
  const nbPhotos = await countPhotosInDB();

  const images = await ImageModel.findAll({
    offset: offset,
    limit: number,
    order: [['date', 'DESC']],
    include: MediaIdModel,
  });

  const parsedImages = images.map(({ dataValues }) => {
    const mediaIdsObjects = (dataValues as any as { mediaIds: MediaIdDB[] }).mediaIds;
    const mediaIds = mediaIdsObjects.map(mediaId => {
      return { deviceUniqueId: mediaId.deviceUniqueId, mediaId: mediaId.mediaId };
    });
    return { ...dataValues, mediaIds };
  });

  return {
    photos: parsedImages,
    endReached: nbPhotos <= number + offset,
  };
}

async function getPhotoByIdFromDB(id: string): Promise<Photo | null> {
  assertDbOpen();

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
    return {
      deviceUniqueId: mediaId.dataValues.deviceUniqueId,
      mediaId: mediaId.dataValues.mediaId,
    };
  });

  const mediaIdsWithDevices = await Promise.all(devicesPromises);

  return {
    ...image.dataValues,
    mediaIds: filterNull(mediaIdsWithDevices),
  };
}

async function deletePhotoByIdFromDB(id: string) {
  assertDbOpen();

  await ImageModel.destroy({
    where: {
      id: id,
    },
  });
}

async function getPhotosByMediaIdFromDB(
  photosData: Array<{
    mediaId: string;
  }>,
  deviceUniqueId: string,
): Promise<Array<Photo | null>> {
  assertDbOpen();

  const photosFoundPromise = photosData.map(photoData => {
    return getPhotoByMediaIdFromDB(photoData, deviceUniqueId);
  });
  return await Promise.all(photosFoundPromise);
}

async function checkPhotoExistsByMediaIdInDB(
  mediaId: string,
  deviceUniqueId: string,
): Promise<boolean> {
  assertDbOpen();

  const photo = await getPhotoByMediaIdFromDB({ mediaId }, deviceUniqueId);
  return !!photo;
}

async function getPhotosByIdFromDB(ids: string[]): Promise<Array<Photo | null>> {
  assertDbOpen();

  const photosFoundPromise = ids.map(id => {
    return getPhotoByIdFromDB(id);
  });
  return await Promise.all(photosFoundPromise);
}

async function updatePhotoMediaIdById(id: string, mediaId: string, deviceUniqueId: string) {
  assertDbOpen();

  const dbMediaId = await MediaIdModel.findOne({
    where: { imageId: id, deviceUniqueId },
  });

  if (!dbMediaId) {
    const mediaIdCreated = await MediaIdModel.create({
      id: uuid(),
      mediaId: mediaId,
      imageId: id,
      deviceUniqueId,
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
  await (sequelize as Sequelize).drop();
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
