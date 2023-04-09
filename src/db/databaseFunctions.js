// IMPORTS
const { v4: uuid } = require("uuid");
const sqlite3 = require("sqlite3").verbose();
const util = require("util");
const { sqliteDbFile, hashLen } = require(global.__srcdir + "/config/config");
const sqlQueries = require(global.__srcdir + "/db/sqlQueries");

let db = new sqlite3.Database(sqliteDbFile);
const runPromisified = util.promisify(db.run);
const getPromisified = util.promisify(db.get);
const allPromisified = util.promisify(db.all);
db.close();

async function initDB() {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function addPhotoToDB(photo, id_p = "") {
  let db = new sqlite3.Database(sqliteDbFile);

  let id = id_p;

  if (!id) {
    id = uuid();
  }

  const dbPhoto = {
    id: id,
    name: photo.name,
    fileSize: photo.fileSize,
    width: photo.width,
    height: photo.height,
    date: new Date(photo.date).toISOString(),
    clientPath: photo.path,
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

async function numberPhotosFromDB() {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function getPhotosFromDB(number, offset) {
  const nbPhotos = await numberPhotosFromDB();

  let db = new sqlite3.Database(sqliteDbFile);

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

async function getPhotoByIdFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
  try {
    return await getPromisified.bind(db)(sqlQueries.selectPhotoByIdQuery(id));
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function deletePhotoByIdFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
  try {
    return runPromisified.bind(db)(sqlQueries.deletePhotoByIdQuery(id));
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

async function getNextPhotoFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function getPreviousPhotoFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function getPhotoByClientPathFromDB(photoPath) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function getPhotosByIdFromDB(ids) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function getPhotosByClientPathFromDB(photosPaths) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function updatePhotoHashById(id, hash) {
  let db = new sqlite3.Database(sqliteDbFile);
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

async function updatePhotoClientPathById(id, path) {
  let db = new sqlite3.Database(sqliteDbFile);
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
  let db = new sqlite3.Database(sqliteDbFile);
  try {
    return await runPromisified.bind(db)(sqlQueries.dropTableImagesQuery());
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    db.close();
  }
}

module.exports = {
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
