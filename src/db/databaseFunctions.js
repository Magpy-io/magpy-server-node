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

function initDB() {
  let db = new sqlite3.Database(sqliteDbFile);

  return allPromisified
    .bind(db)(sqlQueries.checkTableImagesExistsQuery())
    .then((rows) => {
      if (rows.length != 1) {
        return runPromisified.bind(db)(
          sqlQueries.createTableImagesQuery(hashLen)
        );
      }
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function addPhotoToDB(photo) {
  let db = new sqlite3.Database(sqliteDbFile);
  let id = uuid();
  return runPromisified
    .bind(db)(sqlQueries.insertImageQuery(), [
      id,
      photo.name,
      photo.fileSize,
      photo.width,
      photo.height,
      new Date(photo.date).toISOString(),
      photo.path,
      new Date(photo.syncDate).toISOString(),
      photo.serverFilePath,
      photo.hash,
    ])
    .then(() => {
      return id;
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function numberPhotosFromDB() {
  let db = new sqlite3.Database(sqliteDbFile);
  return allPromisified
    .bind(db)(sqlQueries.selectAllIdsQuery())
    .then((rows) => {
      return rows.length;
    })
    .finally(() => {
      db.close();
    });
}

function getPhotosFromDB(number, offset) {
  const numberPhotosDbPromise = numberPhotosFromDB();

  let db = new sqlite3.Database(sqliteDbFile);
  const photosPromise = allPromisified.bind(db)(
    sqlQueries.selectPhotosOffsetCountQuery(number, offset)
  );

  return Promise.all([photosPromise, numberPhotosDbPromise])
    .then(([rows, nbPhotos]) => {
      return { photos: rows, endReached: nbPhotos <= number + offset };
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getPhotoByIdFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
  return getPromisified
    .bind(db)(sqlQueries.selectPhotoByIdQuery(id))
    .then((row) => {
      return row;
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function deletePhotoByIdFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);
  return runPromisified
    .bind(db)(sqlQueries.deletePhotoByIdQuery(id))
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getNextPhotoFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);

  return getPromisified
    .bind(db)(sqlQueries.selectPhotoByIdQuery(id))
    .then((photo) => {
      if (photo) {
        return allPromisified.bind(db)(
          sqlQueries.selectNextPhotoByDateQuery(photo.date)
        );
      }
    })
    .then((rows) => {
      return {
        idFound: rows instanceof Array,
        photoIdIsLast: rows?.length == 0,
        photoNext: rows ? rows[0] : undefined,
        endReached: rows?.length <= 1,
      };
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getPreviousPhotoFromDB(id) {
  let db = new sqlite3.Database(sqliteDbFile);

  return getPromisified
    .bind(db)(sqlQueries.selectPhotoByIdQuery(id))
    .then((photo) => {
      if (photo) {
        return allPromisified.bind(db)(
          sqlQueries.selectPreviousPhotoByDateQuery(photo.date)
        );
      }
    })
    .then((rows) => {
      return {
        idFound: rows instanceof Array,
        photoIdIsLast: rows?.length == 0,
        photoNext: rows ? rows[0] : undefined,
        endReached: rows?.length <= 1,
      };
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getPhotoByClientPathFromDB(photoPath) {
  let db = new sqlite3.Database(sqliteDbFile);
  return getPromisified
    .bind(db)(sqlQueries.selectByClientPathQuery(photoPath))
    .then((row) => {
      return row;
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getPhotosByIdFromDB(ids) {
  let db = new sqlite3.Database(sqliteDbFile);

  const photosFoundPromise = ids.map((id) => {
    return getPromisified.bind(db)(sqlQueries.selectPhotoByIdQuery(id));
  });

  return Promise.all(photosFoundPromise)
    .then((photosFound) => {
      return photosFound;
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getPhotosByClientPathFromDB(photosPaths) {
  let db = new sqlite3.Database(sqliteDbFile);

  const photosFoundPromise = photosPaths.map((photoPath) => {
    return getPromisified.bind(db)(
      sqlQueries.selectByClientPathQuery(photoPath)
    );
  });

  return Promise.all(photosFoundPromise)
    .then((photosFound) => {
      return photosFound;
    })
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function clearDB() {
  let db = new sqlite3.Database(sqliteDbFile);
  return runPromisified
    .bind(db)(sqlQueries.dropTableImagesQuery())
    .finally(() => {
      db.close();
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
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
};
