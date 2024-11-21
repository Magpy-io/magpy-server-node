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
    where?: any;
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

  ImageModel.hasMany(MediaIdModel, {
    foreignKey: 'imageId',
  });
  MediaIdModel.belongsTo(ImageModel, { foreignKey: 'imageId' });

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

async function getPhotoByMediaIdFromDB(
  mediaId: string,
  deviceUniqueId: string,
): Promise<Photo | null> {
  assertDbOpen();

  const mediaIdEntry = await MediaIdModel.findOne({
    where: { mediaId, deviceUniqueId },
  });

  if (!mediaIdEntry) {
    return null;
  }

  const image = await getPhotoByIdFromDB(mediaIdEntry.dataValues.imageId);

  if (!image) {
    Logger.warn(
      'Found a mediaId where the imageId does not exist in db\nClearning the mediaId.',
    );

    await MediaIdModel.destroy({
      where: { id: mediaIdEntry.dataValues.id },
    });
  }

  return image;
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
    const mediaIdsObjects = (
      dataValues as unknown as { mediaIds: { dataValues: MediaIdDB }[] }
    ).mediaIds;
    const mediaIds = mediaIdsObjects.map(mediaId => {
      return {
        deviceUniqueId: mediaId.dataValues.deviceUniqueId,
        mediaId: mediaId.dataValues.mediaId,
      };
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
    include: MediaIdModel,
  });

  if (!image) {
    return null;
  }

  const mediaIds = (
    image.dataValues as unknown as { mediaIds: { dataValues: MediaIdDB }[] }
  ).mediaIds.map(mediaId => {
    return {
      deviceUniqueId: mediaId.dataValues.deviceUniqueId,
      mediaId: mediaId.dataValues.mediaId,
    };
  });
  const parsedImage: Photo = { ...image.dataValues, mediaIds };

  return parsedImage;
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
  mediaIdsN: string[],
  deviceUniqueId: string,
): Promise<Array<Photo | null>> {
  assertDbOpen();
  const mediaIdEntriesK = await MediaIdModel.findAll({
    where: { mediaId: mediaIdsN, deviceUniqueId },
  });

  const mediaIdEntriesMapK: Map<string, number> = new Map(
    mediaIdEntriesK.map(({ dataValues }, i) => [dataValues.mediaId, i]),
  );

  const photosIdsK = mediaIdEntriesK.map(({ dataValues }) => {
    return dataValues.imageId;
  });

  const imagesK = await getPhotosByIdFromDB(photosIdsK);

  for (let i = 0; i < imagesK.length; i++) {
    const image = imagesK[i];
    if (image == null) {
      Logger.warn(
        'Found a mediaId where the imageId does not exist in db\nClearning the mediaId.',
      );

      await MediaIdModel.destroy({
        where: { id: mediaIdEntriesK[i].dataValues.id },
      });
    }
  }

  return mediaIdsN.map(mediaId => {
    const mediaIdEntryIndex = mediaIdEntriesMapK.get(mediaId);

    if (mediaIdEntryIndex == null) {
      return null;
    }

    return imagesK[mediaIdEntryIndex];
  });
}

async function getPhotosByIdFromDB(ids: string[]): Promise<Array<Photo | null>> {
  assertDbOpen();

  const images = await ImageModel.findAll({
    where: { id: ids },
    include: MediaIdModel,
  });

  const photosFoundIds: Map<string, PhotoDB> = new Map(
    images.map(({ dataValues }, i) => [dataValues.id, dataValues]),
  );

  const imagesAll = ids.map(id => {
    return photosFoundIds.get(id) ?? null;
  });

  const parsedImages: Array<Photo | null> = imagesAll.map(imageDb => {
    if (!imageDb) {
      return null;
    }

    const mediaIdsObjects = (imageDb as unknown as { mediaIds: { dataValues: MediaIdDB }[] })
      .mediaIds;
    const mediaIds = mediaIdsObjects.map(mediaId => {
      return {
        deviceUniqueId: mediaId.dataValues.deviceUniqueId,
        mediaId: mediaId.dataValues.mediaId,
      };
    });
    return { ...imageDb, mediaIds };
  });

  return parsedImages;
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

async function addMediaIdToImage({
  imageId,
  mediaId,
  deviceUniqueId,
}: {
  imageId: string;
  mediaId: string;
  deviceUniqueId: string;
}) {
  const mediaIdCreated = await MediaIdModel.create({
    id: uuid(),
    mediaId,
    imageId,
    deviceUniqueId,
  });

  if (!mediaIdCreated) {
    throw new Error('addMediaIdToImage: Error adding new mediaId to photo');
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
  getPhotosByIdFromDB,
  getPhotoByMediaIdFromDB,
  getPhotosByMediaIdFromDB,
  addMediaIdToImage,
  getAllMediaIdsByImageIdFromDB,
  deletePhotoByIdFromDB,
  updatePhotoMediaIdById,
};
