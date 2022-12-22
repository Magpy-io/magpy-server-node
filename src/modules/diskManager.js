// IMPORTS
const fs = require("mz/fs");
const path = require("node:path");

const { rootPath } = require(global.__srcdir + "/config/config");

function splitImageName(fullName) {
  const nameSplited = fullName.split(".");
  const format = nameSplited.pop();
  const name = nameSplited.join();
  return { name: name, format: format };
}

function createServerImageName(photo) {
  const { name, format } = splitImageName(photo.name);
  const date = photo.syncDate;
  const serverFileName = `Ants_${name}_${date}.${format}`;
  return serverFileName;
}

function addPhotoToDisk(data) {
  let buff = Buffer.from(data.image64, "base64");
  fs.writeFileSync(data.serverFilePath, buff);
}

function getPhotosFromDisk(path) {
  return fs.readFileSync(path, { encoding: "base64" }).toString("base64");
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
  getPhotosFromDisk,
  createServerImageName,
  clearImagesDisk,
};
