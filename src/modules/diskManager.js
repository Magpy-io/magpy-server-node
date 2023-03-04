// IMPORTS
const fs = require("fs").promises;
const path = require("node:path");
const sharp = require("sharp");

const { rootPath } = require(global.__srcdir + "/config/config");

const { createServerImageCroppedName } = require(global.__srcdir +
  "/modules/diskFilesNaming");

function addPhotoToDisk(data, photoWidth, photoHeight, path) {
  const MAX_PIXELS_IN_IMAGE = 40000;

  const factor = Math.sqrt((photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE);
  const newWidth = Math.round(photoWidth / factor);
  const newHeight = Math.round(photoHeight / factor);

  let buff = Buffer.from(data, "base64");
  return sharp(buff)
    .resize({ width: newWidth, height: newHeight })
    .jpeg({ quality: 70 })
    .toBuffer()
    .then((data) => {
      const file1 = fs.writeFile(path, buff);
      const file2 = fs.writeFile(createServerImageCroppedName(path), data);
      return Promise.all([file1, file2]);
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function removePhotoFromDisk(path) {
  const removeFullPhotoPromise = fs.unlink(path);
  const removeCroppedPhotoPromise = fs.unlink(
    createServerImageCroppedName(path)
  );

  return Promise.all([removeFullPhotoPromise, removeCroppedPhotoPromise]).catch(
    (err) => {
      console.error(err);
      throw err;
    }
  );
}

function getFullPhotoFromDisk(path) {
  return fs
    .readFile(path, { encoding: "base64" })
    .then((result) => {
      return result.toString("base64");
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function getCroppedPhotoFromDisk(path) {
  return fs
    .readFile(createServerImageCroppedName(path), { encoding: "base64" })
    .then((result) => {
      return result.toString("base64");
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

function clearImagesDisk() {
  return fs
    .readdir(rootPath)
    .then((files) => {
      return files.map((file) => {
        return fs.unlink(path.join(rootPath, file));
      });
    })
    .then((filesUnlinkPromises) => {
      return Promise.all(filesUnlinkPromises);
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

module.exports = {
  addPhotoToDisk,
  getFullPhotoFromDisk,
  getCroppedPhotoFromDisk,
  clearImagesDisk,
  removePhotoFromDisk,
};
