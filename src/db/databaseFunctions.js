// IMPORTS
const { v4: uuidv4 } = require("uuid");
const fs = require("mz/fs");

const { DBFile } = require(global.__srcdir + "/config/config");
//const helpers = require(global.__srcdir + "/db/helpersDb");

function addPhotoToDB(photo) {
  fs.readFile(DBFile, "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    newEntry = {
      id: uuidv4(),
      name: photo.name,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      date: photo.date,
      clientPath: photo.path,
      syncDate: photo.syncDate,
      serverPath: photo.serverFilePath,
      hash: photo.hash,
    };
    obj = JSON.parse(data); //now its an object
    obj.photos.push(newEntry); //add some data
    json = JSON.stringify(obj); //convert it back to json
    fs.writeFile(DBFile, json, "utf8"); // write it back
  });
}

function areEqual(p, photo) {
  return p.name === photo.name && p.fileSize === photo.fileSize;
}

function isPhotoInDB(photo) {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);
  isInDB = obj.photos.some((p) => areEqual(p, photo));

  return isInDB;
}

function numberPhotosFromDB() {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);
  return obj.photos.length;
}

function getPhotosFromDB(number, offset) {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);

  return {
    dbPhotos: obj.photos.slice(offset, number + offset),
    endReached: obj.photos.length <= number + offset,
  };
}

function getAllPhotosFromDB() {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);

  return obj.photos;
}

function findPhotoDB(fileSize, photoName) {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);

  photoFound = obj.photos.find(
    (e) => e.fileSize == fileSize && e.name == photoName
  );

  if (!photoFound) {
    return;
  }
  return photoFound.hash;
}

function findPhotosDB(photosExistsData) {
  data = fs.readFileSync(DBFile, "utf8");
  obj = JSON.parse(data);

  photosFound = obj.photos.filter((photo) =>
    photosExistsData.some(
      (photoData) =>
        photoData.fileSize == photo.fileSize && photoData.name == photo.name
    )
  );

  return photosExistsData.map((photoData) => {
    let photoFound = photosFound.find(
      (photo) =>
        photo.name == photoData.name && photo.fileSize == photoData.fileSize
    );
    if (!photoFound) {
      return;
    }
    return photoFound.hash;
  });
}

function clearDB() {
  const obj = {
    photos: [],
  };
  const str = JSON.stringify(obj);
  fs.writeFile(DBFile, str, "utf8");
}

module.exports = {
  addPhotoToDB,
  isPhotoInDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getAllPhotosFromDB,
  findPhotoDB,
  findPhotosDB,
  clearDB,
};
