// IMPORTS
const fs = require("mz/fs");
const { v4: uuid } = require("uuid");
const sqlite3 = require("sqlite3").verbose();

const { sqliteDbFile, hashLen } = require(global.__srcdir + "/config/config");
const sqlQueries = require(global.__srcdir + "/db/sqlQueries");

function initDB() {
  let db = new sqlite3.Database(sqliteDbFile);

  db.all(sqlQueries.checkTableImagesExistsQuery(), function (err, rows) {
    if (err) console.log(err);
    if (rows.length != 1) {
      db.run(sqlQueries.createTableImagesQuery(hashLen), function (err) {
        if (err) console.log(err);
      });
    }
  });
  db.close();
}

function addPhotoToDB(photo) {
  let db = new sqlite3.Database(sqliteDbFile);

  db.run(
    sqlQueries.insertImageQuery(),
    [
      uuid(),
      photo.name,
      photo.fileSize,
      photo.width,
      photo.height,
      photo.date,
      photo.path,
      photo.syncDate,
      photo.serverFilePath,
      photo.hash,
    ],
    function (err) {
      if (err) console.log(err);
    }
  );

  db.close();
}

function isPhotoInDB(photo, callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  db.get(
    sqlQueries.selectByNameAndSizeQuery(photo.name, photo.fileSize),
    function (err, row) {
      if (err) console.log(err);
      callback(Boolean(row));
    }
  );
  db.close();
}

function numberPhotosFromDB(callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  db.all(sqlQueries.selectAllIdsQuery(), function (err, rows) {
    if (err) console.log(err);
    callback(rows.length);
  });
  db.close();
}

function getPhotosFromDB(number, offset, callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  db.all(
    sqlQueries.selectPhotosOffsetCountQuery(number, offset),
    function (err, rows) {
      if (err) console.log(err);
      numberPhotosFromDB(function (nbPhotos) {
        callback(rows, nbPhotos <= number + offset);
      });
    }
  );
  db.close();
}

function getPhotoFromDB(id, callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  db.get(sqlQueries.selectPhotoByIdQuery(id), function (err, row) {
    if (err) console.log(err);
    callback(row);
  });
  db.close();
}

function findPhotoDB(fileSize, photoName, callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  db.get(
    sqlQueries.selectByNameAndSizeQuery(photoName, fileSize),
    function (err, row) {
      if (err) console.log(err);
      if (!row) {
        callback();
      } else {
        callback(row.hash);
      }
    }
  );
  db.close();
}

function findPhotosDB(photosExistsData, callback) {
  let db = new sqlite3.Database(sqliteDbFile);
  const photosExist = [];
  db.serialize(() => {
    photosExistsData.forEach((photoData, index) => {
      db.get(
        sqlQueries.selectByNameAndSizeQuery(photoData.name, photoData.fileSize),
        function (err, row) {
          if (err) console.log(err);
          if (!row) {
            photosExist.push(undefined);
          } else {
            photosExist.push(row.hash);
          }
          if (index == photosExistsData.length - 1) {
            callback(photosExist);
          }
        }
      );
    });
  });
  db.close();
}

function clearDB() {
  let db = new sqlite3.Database(sqliteDbFile);
  db.run(sqlQueries.dropTableImagesQuery(), function (err) {
    if (err) console.log(err);
  });
  db.close();
}

module.exports = {
  addPhotoToDB,
  isPhotoInDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getPhotoFromDB,
  findPhotoDB,
  findPhotosDB,
  clearDB,
  initDB,
};
