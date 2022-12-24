// IMPORTS
const fs = require("fs").promises;
const path = require("node:path");
const sharp = require("sharp");

const { rootPath } = require(global.__srcdir + "/config/config");

const { createServerImageCroppedName } = require(global.__srcdir +
  "/modules/diskFilesNaming");

function addPhotoToDisk(data, path) {
  let buff = Buffer.from(data, "base64");

  return sharp(buff)
    .resize({ width: 150, height: 150 })
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
};
