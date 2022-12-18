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

function getPhotosFromDisk(dbPhotos) {
  return dbPhotos.map((dbPhoto) => {
    let data = fs.readFileSync(dbPhoto.serverPath, { encoding: "base64" });
    let json = {
      meta: {
        name: dbPhoto.name,
        fileSize: dbPhoto.fileSize,
        width: dbPhoto.width,
        height: dbPhoto.height,
        date: dbPhoto.date,
        syncDate: dbPhoto.syncDate,
        serverPath: dbPhoto.serverPath,
      },
      image64: `${data.toString("base64")}`,
    };
    return json;
  });
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
