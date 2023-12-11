// IMPORTS
import { v4 as uuid } from "uuid";
import { verbose } from "sqlite3";
const sqlite3 = verbose();
import util from "util";
import { sqliteDbFile, hashLen } from "@src/config/config";
import { createFolder } from "@src/modules/diskManager";
import sqlQueries from "@src/db/sqlQueries";
import { Photo } from "@src/types/photoType";

let moduleInited = false;

let runPromisified: any;
let getPromisified: any;
let allPromisified: any;

async function initModule() {
  let db = await openDb(sqliteDbFile);
  runPromisified = util.promisify(db.run);
  getPromisified = util.promisify(db.get);
  allPromisified = util.promisify(db.all);
  db.close();

  moduleInited = true;
}

async function initDB() {
  if (!moduleInited) {
    await initModule();
  }

  let db = await openDb(sqliteDbFile);

  try {
    const rows = await allPromisified.bind(db)(
      sqlQueries.checkTableImagesExistsQuery()
    );
    if (rows.length != 1) {
      return runPromisified.bind(db)(
        sqlQueries.createTableImagesQuery(hashLen)
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function addPhotoToDB(photo: Photo): Promise<Photo> {
  let db = await openDb(sqliteDbFile);

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
    await runPromisified.bind(db)(sqlQueries.insertImageQuery(), [
      dbPhoto.id,
      dbPhoto.name,
      dbPhoto.fileSize,
      dbPhoto.width,
      dbPhoto.height,
      dbPhoto.date,
      dbPhoto.clientPath,
      dbPhoto.syncDate,
      dbPhoto.serverPath,
      dbPhoto.hash,
    ]);
    return dbPhoto;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function numberPhotosFromDB(): Promise<number> {
  let db = await openDb(sqliteDbFile);
  try {
    const rows = await allPromisified.bind(db)(sqlQueries.selectAllIdsQuery());
    return rows.length;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPhotosFromDB(
  number: number,
  offset: number
): Promise<{ photos: Photo[]; endReached: boolean }> {
  const nbPhotos = await numberPhotosFromDB();

  let db = await openDb(sqliteDbFile);

  try {
    const rows = await allPromisified.bind(db)(
      sqlQueries.selectPhotosOffsetCountQuery(number, offset)
    );
    return { photos: rows, endReached: nbPhotos <= number + offset };
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPhotoByIdFromDB(id: string): Promise<Photo | undefined> {
  let db = await openDb(sqliteDbFile);
  try {
    return await getPromisified.bind(db)(sqlQueries.selectPhotoByIdQuery(id));
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function deletePhotoByIdFromDB(id: string) {
  let db = await openDb(sqliteDbFile);
  try {
    return runPromisified.bind(db)(sqlQueries.deletePhotoByIdQuery(id));
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getNextPhotoFromDB(id: string): Promise<{
  idFound: boolean;
  photoIdIsLast: boolean;
  photoNext: Photo | undefined;
  endReached: boolean;
}> {
  let db = await openDb(sqliteDbFile);
  try {
    const photo = await getPromisified.bind(db)(
      sqlQueries.selectPhotoByIdQuery(id)
    );
    let rows;
    if (photo) {
      rows = await allPromisified.bind(db)(
        sqlQueries.selectNextPhotoByDateQuery(photo.date)
      );
    }
    return {
      idFound: rows !== undefined,
      photoIdIsLast: rows?.length == 0,
      photoNext: rows ? rows[0] : undefined,
      endReached: rows?.length <= 1,
    };
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPreviousPhotoFromDB(id: string): Promise<{
  idFound: boolean;
  photoIdIsLast: boolean;
  photoNext: Photo | undefined;
  endReached: boolean;
}> {
  let db = await openDb(sqliteDbFile);
  try {
    const photo = await getPromisified.bind(db)(
      sqlQueries.selectPhotoByIdQuery(id)
    );
    let rows;
    if (photo) {
      rows = await allPromisified.bind(db)(
        sqlQueries.selectPreviousPhotoByDateQuery(photo.date)
      );
    }
    return {
      idFound: rows !== undefined,
      photoIdIsLast: rows?.length == 0,
      photoNext: rows ? rows[0] : undefined,
      endReached: rows?.length <= 1,
    };
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPhotoByClientPathFromDB(
  photoPath: string
): Promise<Photo | undefined> {
  let db = await openDb(sqliteDbFile);
  try {
    return await getPromisified.bind(db)(
      sqlQueries.selectByClientPathQuery(photoPath)
    );
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPhotosByIdFromDB(
  ids: string[]
): Promise<Array<Photo | undefined>> {
  let db = await openDb(sqliteDbFile);
  try {
    const photosFoundPromise = ids.map((id) => {
      return getPromisified.bind(db)(sqlQueries.selectPhotoByIdQuery(id));
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getPhotosByClientPathFromDB(
  photosPaths: string[]
): Promise<Array<Photo | undefined>> {
  let db = await openDb(sqliteDbFile);
  try {
    const photosFoundPromise = photosPaths.map((photoPath) => {
      return getPromisified.bind(db)(
        sqlQueries.selectByClientPathQuery(photoPath)
      );
    });
    return await Promise.all(photosFoundPromise);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function updatePhotoHashById(id: string, hash: string) {
  let db = await openDb(sqliteDbFile);
  try {
    return await getPromisified.bind(db)(
      sqlQueries.updatePhotoHashByIdQuery(id, hash)
    );
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function updatePhotoClientPathById(id: string, path: string) {
  let db = await openDb(sqliteDbFile);
  try {
    return await getPromisified.bind(db)(
      sqlQueries.updatePhotoClientPathByIdQuery(id, path)
    );
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function clearDB() {
  let db = await openDb(sqliteDbFile);
  try {
    return await runPromisified.bind(db)(sqlQueries.dropTableImagesQuery());
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function openDb(sqliteDbFile: string) {
  const dbFileSplit = sqliteDbFile.split("/");
  dbFileSplit.pop();
  const dirPath = dbFileSplit.join("/") + "/";
  await createFolder(dirPath);
  return new sqlite3.Database(sqliteDbFile);
}

export {
  addPhotoToDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getPhotoByIdFromDB,
  deletePhotoByIdFromDB,
  getNextPhotoFromDB,
  getPreviousPhotoFromDB,
  getPhotoByClientPathFromDB,
  getPhotosByClientPathFromDB,
  clearDB,
  initDB,
  getPhotosByIdFromDB,
  updatePhotoHashById,
  updatePhotoClientPathById,
};
