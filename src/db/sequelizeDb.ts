import { Sequelize } from "sequelize";
import { v4 as uuid } from "uuid";

import { createFolder } from "@src/modules/diskManager";
import { sqliteDbFile } from "@src/config/config";
import { Photo } from "@src/types/photoType";
import { createImageModel } from "@src/db/Image.model";

let sequelize: Sequelize | null = null;
let Image: any;

async function openAndInitDB() {
  await openDb();
  Image = createImageModel(sequelize as Sequelize);
  await Image.sync();
}

async function openDb() {
  console.log("Opening connection to db");

  if (sequelize) {
    console.log("Db already opened, exiting");
    return;
  }

  if (sqliteDbFile != ":memory:") {
    await createDbFolderIfDoesNotExist(sqliteDbFile);
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

async function createDbFolderIfDoesNotExist(sqliteDbFile: string) {
  const dbFileSplit = sqliteDbFile.split("/");
  dbFileSplit.pop();
  const dirPath = dbFileSplit.join("/") + "/";
  await createFolder(dirPath);
}

async function getPhotoByClientPathFromDB(
  photoPath: string
): Promise<Photo | null> {
  assertDbOpen();
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
  assertDbOpen();

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

    throw new Error("Error adding photo to db");
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function numberPhotosFromDB(): Promise<number> {
  assertDbOpen();
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
  assertDbOpen();
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
  assertDbOpen();
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
  assertDbOpen();
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
  assertDbOpen();
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

async function updatePhotoClientPathById(id: string, path: string) {
  assertDbOpen();
  try {
    await Image.update({ clientPath: path }, { where: { id: id } });
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
