// IMPORTS
const fs = require("mz/fs");
const path = require("node:path");
const sharp = require("sharp");

const { rootPath } = require(global.__srcdir + "/config/config");

const { createServerImageCroppedName } = require(global.__srcdir +
  "/modules/diskFilesNaming");

function addPhotoToDisk(data, path) {
  let buff = Buffer.from(data, "base64");

  sharp(buff)
    .resize({ width: 150, height: 150 })
    .jpeg({ quality: 70 })
    .toBuffer()
    .then((data) => {
      fs.writeFileSync(path, buff);
      fs.writeFileSync(createServerImageCroppedName(path), data);

      console.log("File written successfully to " + path);
    });
}

function getFullPhotoFromDisk(path) {
  return fs.readFileSync(path, { encoding: "base64" }).toString("base64");
}

function getCroppedPhotoFromDisk(path) {
  return fs
    .readFileSync(createServerImageCroppedName(path), { encoding: "base64" })
    .toString("base64");
}

function clearImagesDisk() {
  fs.readdir(rootPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(rootPath, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

module.exports = {
  addPhotoToDisk,
  getFullPhotoFromDisk,
  clearImagesDisk,
  getCroppedPhotoFromDisk,
};
