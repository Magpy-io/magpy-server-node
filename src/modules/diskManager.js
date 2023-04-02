// IMPORTS
const fs = require("fs").promises;
const path = require("node:path");
const sharp = require("sharp");

const { rootPath } = require(global.__srcdir + "/config/config");

const { createServerImageCroppedName } = require(global.__srcdir +
  "/modules/diskFilesNaming");

async function addPhotoToDisk(data, photoWidth, photoHeight, path) {
  const MAX_PIXELS_IN_IMAGE = 40000;
  const MAX_PIXELS_IN_IMAGE_BIGGER = 200000;

  const factor = Math.sqrt((photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE);
  const newWidth = Math.round(photoWidth / factor);
  const newHeight = Math.round(photoHeight / factor);

  const factor2 = Math.sqrt(
    (photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE_BIGGER
  );
  const newWidth2 = Math.round(photoWidth / factor2);
  const newHeight2 = Math.round(photoHeight / factor2);

  let buff = Buffer.from(data, "base64");
  const data1 = await sharp(buff)
    .resize({ width: newWidth, height: newHeight })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch((err) => {
      console.error(err);
      throw err;
    });
  const data2 = await sharp(buff)
    .resize({ width: newWidth2, height: newHeight2 })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch((err) => {
      console.error(err);
      throw err;
    });
  const file1 = await fs.writeFile(path, data2);
  const file2 = await fs.writeFile(createServerImageCroppedName(path), data1);
  return [file1, file2];
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
