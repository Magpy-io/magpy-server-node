import { Sequelize, DataTypes, Model } from "sequelize";
import { v4 as uuid } from "uuid";

import { createFolder } from "@src/modules/diskManager";
import { sqliteDbFile, hashLen } from "@src/config/config";
import { Photo } from "@src/types/photoType";

let sequelize: Sequelize = null;
let Image: any;

function createModel() {
  return sequelize.define(
    "Image",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      width: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      clientPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      serverPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      syncDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      hash: {
        type: DataTypes.STRING(hashLen),
        allowNull: false,
      },
    },
    {
      indexes: [{ fields: ["date"] }, { fields: ["clientPath"] }],
    }
  );
}

async function openAndInitDB() {
  await openDb();
  Image = createModel();
  await Image.sync();
}

async function openDb() {
  console.log("Opening connection to db");

  if (sequelize) {
    console.log("Db already opened, exiting");
    return;
  }

  await createDbFolderIfDoesNotExist(sqliteDbFile);

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: sqliteDbFile,
    logging: (msg) => console.log("Sequelize : " + msg),
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

async function createDbFolderIfDoesNotExist(sqliteDbFile: string) {
  const dbFileSplit = sqliteDbFile.split("/");
  dbFileSplit.pop();
  const dirPath = dbFileSplit.join("/") + "/";
  await createFolder(dirPath);
}

async function getPhotoByClientPathFromDB(
  photoPath: string
): Promise<Photo | null> {
  try {
    const image: any = await Image.findOne({
      where: { clientPath: photoPath },
    });

    return image;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function addPhotoToDB(photo: Photo): Promise<Photo> {
  if (!photo.id) {
    photo.id = uuid();
  }

  const dbPhoto: Photo = {
    id: photo.id,
    name: photo.name,
    fileSize: photo.fileSize,
    width: photo.width,
    height: photo.height,
    date: new Date(photo.date).toISOString(),
    clientPath: photo.clientPath,
    syncDate: new Date(photo.syncDate).toISOString(),
    serverPath: photo.serverPath,
    hash: photo.hash,
  };

  try {
    const image: any = await Image.create(dbPhoto);

    if (image) {
      return image;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function numberPhotosFromDB(): Promise<number> {
  try {
    return await Image.count();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotosFromDB(
  number: number,
  offset: number
): Promise<{ photos: Photo[]; endReached: boolean }> {
  const nbPhotos = await numberPhotosFromDB();

  try {
    const images = await Image.findAll({
      offset: offset,
      limit: number,
      order: [["date", "DESC"]],
    });
    return { photos: images, endReached: nbPhotos <= number + offset };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getPhotoByIdFromDB(id: string): Promise<Photo | null> {
  try {
    const image: any = await Image.findOne({
      where: { id: id },
    });

    return image;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function deletePhotoByIdFromDB(id: string) {
  try {
    await Image.destroy({
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
  photosPaths: string[]
): Promise<Array<Photo | null>> {
  try {
    const photosFoundPromise = photosPaths.map((photoPath) => {
      return getPhotoByClientPathFromDB(photoPath);
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

async function updatePhotoClientPathById(id: string, path: string) {
  try {
    await Image.update({ clientPath: path }, { where: { id: id } });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function clearDB() {
  try {
    await sequelize.drop();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export {
  openAndInitDB,
  openDb,
  closeDb,
  clearDB,
  getPhotoByClientPathFromDB,
  addPhotoToDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getPhotoByIdFromDB,
  deletePhotoByIdFromDB,
  getPhotosByClientPathFromDB,
  getPhotosByIdFromDB,
  updatePhotoClientPathById,
};
