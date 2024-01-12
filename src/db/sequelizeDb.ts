import { Sequelize } from "sequelize";
import { v4 as uuid } from "uuid";
import * as path from "path";

import { createFolder } from "@src/modules/diskManager";
import { sqliteDbFile } from "@src/config/config";

import { createImageModel, PhotoDB } from "@src/db/Image.model";
import { createClientPathModel, ClientPathDB } from "@src/db/ClientPath.model";
import { createDevicesModel, DeviceDB } from "@src/db/Devices.model";
import { filterNull } from "@src/modules/functions";

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
    options: { where: T extends S ? S : never }
  ) => Promise<void>;
};

let ImageModel: modelFunctions<PhotoDB>;
let ClientPathModel: modelFunctions<ClientPathDB>;
let DeviceModel: modelFunctions<DeviceDB>;

async function openAndInitDB() {
  await openDb();
  ImageModel = createImageModel(
    sequelize!
  ) as unknown as modelFunctions<PhotoDB>;
  ClientPathModel = createClientPathModel(
    sequelize!
  ) as unknown as modelFunctions<ClientPathDB>;
  DeviceModel = createDevicesModel(
    sequelize!
  ) as unknown as modelFunctions<DeviceDB>;

  ImageModel.hasMany(ClientPathModel, {
    onDelete: "CASCADE",
  });
  ClientPathModel.belongsTo(ImageModel);

  DeviceModel.hasMany(ClientPathModel);
  ClientPathModel.belongsTo(DeviceModel);

  await ImageModel.sync();
  await ClientPathModel.sync();
  await DeviceModel.sync();
}

async function openDb() {
  console.log("Opening connection to db");

  if (sequelize) {
    console.log("Db already opened, exiting");
    return;
  }

  if (sqliteDbFile != ":memory:") {
    const parsed = path.parse(sqliteDbFile);
    await createFolder(parsed.dir);
  }

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: sqliteDbFile,
    //logging: (msg) => console.log("Sequelize : " + msg),
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log("Connection to DB has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database");
    throw error;
  }
}

async function closeDb() {
  if (!sequelize) {
    return;
  }

  await sequelize.close();
  sequelize = null;
  console.log("Connection to DB closed");
}

async function getDeviceFromDB(deviceUniqueId: string) {
  const device = await DeviceModel.findOne({
    where: { deviceUniqueId: deviceUniqueId },
  });

  return device;
}

async function getPhotoByClientPathFromDB(
  photoPath: string,
  deviceUniqueId: string
): Promise<Array<Photo>> {
  assertDbOpen();
  try {
    const device = await DeviceModel.findOne({
      where: { deviceUniqueId: deviceUniqueId },
    });

    if (!device) {
      return [];
    }

    // Possibly same path present for multiple photos on the same device
    const clientPaths = await ClientPathModel.findAll({
      where: { path: photoPath, deviceId: device.dataValues.id },
    });

    if (clientPaths.length == 0) {
      return [];
    }

    const imagesPromises = clientPaths.map((clientPath) => {
      return getPhotoByIdFromDB(clientPath.dataValues.imageId);
    });

    const images = await Promise.all(imagesPromises);

    if (images.some((e) => e == null)) {
      console.error(
        "Found some paths where the imageId does not exist in db\nClearning the paths."
      );

      const deletePathsWithNoPhoto = images.map((e, index) => {
        if (e == null) {
          return ClientPathModel.destroy({
            where: { id: clientPaths[index].dataValues.id },
          });
        }
      });

      await Promise.all(deletePathsWithNoPhoto);
    }

    return filterNull(images);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotoByClientPathAndSizeAndDateFromDB(
  data: {
    path: string;
    size: number;
    date: string;
  },
  deviceUniqueId: string
): Promise<Photo | null> {
  assertDbOpen();
  try {
    const imagesNonFiltered = await getPhotoByClientPathFromDB(
      data.path,
      deviceUniqueId
    );

    const images = imagesNonFiltered.filter((image) => {
      return image.fileSize == data.size && image.date.toJSON() == data.date;
    });

    if (images.length > 1) {
      console.error(
        "Got more than one item from database with the same clientPath, size and date"
      );
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
      throw new Error("Error adding photo to db");
    }

    let device = await getDeviceFromDB(photo.deviceUniqueId);

    if (!device) {
      device = await DeviceModel.create({
        id: uuid(),
        deviceUniqueId: photo.deviceUniqueId,
      });
    }

    if (!device) {
      throw new Error("Error adding device to db");
    }

    const clientPath = await ClientPathModel.create({
      id: uuid(),
      path: photo.clientPath,
      imageId: dbPhoto.id,
      deviceId: device.dataValues.id,
    });

    if (!clientPath) {
      throw new Error("Error adding clientPath to db");
    }

    return {
      ...image.dataValues,
      clientPaths: [
        { path: photo.clientPath, deviceUniqueId: photo.deviceUniqueId },
      ],
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function numberPhotosFromDB(): Promise<number> {
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
  offset: number
): Promise<{ photos: Photo[]; endReached: boolean }> {
  assertDbOpen();
  const nbPhotos = await numberPhotosFromDB();

  try {
    const imagesIds = await ImageModel.findAll({
      offset: offset,
      limit: number,
      order: [["date", "DESC"]],
      attributes: ["id"],
    });

    const imagesPromises = imagesIds.map((imageId) => {
      return getPhotoByIdFromDB(imageId.dataValues.id);
    });

    const images = await Promise.all(imagesPromises);

    if (images.some((e) => e == null)) {
      console.error(
        "getPhotosFromDB: Got at least one photo from db but when getting the same photo by id was not found"
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

    const clientPaths = await ClientPathModel.findAll({
      where: { imageId: id },
    });

    const devicesPromises = clientPaths.map(async (clientPath) => {
      const device = await DeviceModel.findOne({
        where: { id: clientPath.dataValues.deviceId },
      });

      if (!device) {
        console.error(
          "Found some paths where the deviceId does not exist in db\nClearning the paths."
        );

        await ClientPathModel.destroy({
          where: { id: clientPath.dataValues.id },
        });
        return null;
      }

      return {
        deviceUniqueId: device.dataValues.deviceUniqueId,
        path: clientPath.dataValues.path,
      };
    });

    const clientPathsWithDevices = await Promise.all(devicesPromises);

    return {
      ...image.dataValues,
      clientPaths: filterNull(clientPathsWithDevices),
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

async function getPhotosByClientPathFromDB(
  photosPaths: string[],
  deviceUniqueId: string
): Promise<Array<Photo[] | null>> {
  assertDbOpen();
  try {
    const photosFoundPromise = photosPaths.map((photoPath) => {
      return getPhotoByClientPathFromDB(photoPath, deviceUniqueId);
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosByClientPathAndSizeAndDateFromDB(
  photosData: Array<{
    path: string;
    size: number;
    date: string;
  }>,
  deviceUniqueId: string
): Promise<Array<Photo | null>> {
  assertDbOpen();
  try {
    const photosFoundPromise = photosData.map((photoData) => {
      return getPhotoByClientPathAndSizeAndDateFromDB(
        photoData,
        deviceUniqueId
      );
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosByIdFromDB(
  ids: string[]
): Promise<Array<Photo | null>> {
  assertDbOpen();
  try {
    const photosFoundPromise = ids.map((id) => {
      return getPhotoByIdFromDB(id);
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function updatePhotoClientPathById(
  id: string,
  path: string,
  deviceUniqueId: string
) {
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
      throw new Error("Error adding photo to db");
    }

    const clientPath = await ClientPathModel.findOne({
      where: { imageId: id, deviceId: device.dataValues.id },
    });

    if (!clientPath) {
      const clientPathCreated = await ClientPathModel.create({
        id: uuid(),
        path: path,
        imageId: id,
        deviceId: device.dataValues.id,
      });

      if (!clientPathCreated) {
        throw new Error(
          "updatePhotoClientPathById: Error adding new clientPath to photo"
        );
      }
    } else {
      await ClientPathModel.update(
        { path: path },
        { where: { id: clientPath.dataValues.id } }
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
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
    throw new Error(
      "Trying to use DB before opening it, call openDb before any operation"
    );
  }
}

export type Photo = PhotoDB & {
  clientPaths: Array<{ deviceUniqueId: string; path: string }>;
};

export type AddPhotoType = {
  name: string;
  fileSize: number;
  width: number;
  height: number;
  date: string;
  syncDate: string;
  clientPath: string;
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
  getPhotoByClientPathFromDB,
  addPhotoToDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getPhotoByIdFromDB,
  deletePhotoByIdFromDB,
  getPhotosByClientPathFromDB,
  getPhotosByIdFromDB,
  updatePhotoClientPathById,
  getPhotosByClientPathAndSizeAndDateFromDB,
};
