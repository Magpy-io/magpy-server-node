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

async function removePhotoFromDisk(path) {
  try {
    await fs.unlink(path);
    await fs.unlink(createServerImageCroppedName(path));
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getFullPhotoFromDisk(path) {
  try {
    const result = await fs.readFile(path, { encoding: "base64" });
    return result.toString("base64");
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getCroppedPhotoFromDisk(path) {
  try {
    const result = await fs.readFile(createServerImageCroppedName(path), {
      encoding: "base64",
    });
    return result.toString("base64");
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function clearImagesDisk() {
  try {
    const files = await fs.readdir(rootPath);
    const filesUnlinkedPromises = files.map((file) => {
      return fs.unlink(path.join(rootPath, file));
    });
    await Promise.all(filesUnlinkedPromises);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  addPhotoToDisk,
  getFullPhotoFromDisk,
  getCroppedPhotoFromDisk,
  clearImagesDisk,
  removePhotoFromDisk,
};
