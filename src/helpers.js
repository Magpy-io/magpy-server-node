// IMPORTS
const { v4: uuidv4 } = require("uuid");
const fs = require("mz/fs");

const { DBFile, rootPath } = require(global.__srcdir + "/config/config");

function sendResponse(res, ok, status, data) {
  let jsonResponse = {
    ok: ok,
    data: data,
  };

  res.status(status).json(jsonResponse);
}

function sendSuccessfulResponse(res, msg, status = 200) {
  let jsonResponse = {
    ok: true,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

function sendFailedResponse(res, msg, status = 500) {
  let jsonResponse = {
    ok: false,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

function splitImageName(name) {
  return { name: name.split(".")[0], format: name.split(".")[1] };
}

function serverImageName(imageName) {
  const { name, format } = splitImageName(imageName);
  const date = new Date(Date.now()).toJSON();
  const serverFileName = `Ants_${name}_${date}.${format}`;
  return serverFileName;
}

function addPhotoToDisk(res, data) {
  const filePath = rootPath + serverImageName(data.name);
  let buff = Buffer.from(data.image64, "base64");
  fs.writeFile(filePath, buff, (err) => {
    if (err) {
      sendFailedResponse(res, err);
      console.log(err);
    } else {
      const message = "File written successfully";
      sendSuccessfulResponse(res, message);
      console.log(message);
    }
  });
}

function addPhotoToDB(photo) {
  const filePath = rootPath + serverImageName(photo.name);
  fs.readFile(DBFile, "utf8", function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      newEntry = {
        id: uuidv4(),
        name: photo.name,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        date: photo.date,
        clientPath: photo.path,
        syncDate: new Date(Date.now()).toJSON(),
        serverPath: filePath,
        hash: hashString(photo.image64),
      };
      obj = JSON.parse(data); //now its an object
      obj.photos.push(newEntry); //add some data
      json = JSON.stringify(obj); //convert it back to json
      fs.writeFile(DBFile, json, "utf8"); // write it back
    }
  });
}

function areEqual(p, photo) {
  if (p.name === photo.name && p.date === photo.date) {
    return true;
  }
  return false;
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

function charToBase64(s) {
  let n = s.charCodeAt(0);

  if (n == 43) {
    return 62;
  } else if (n == 47) {
    return 63;
  } else if (n < 58) {
    return n - 48 + 52;
  } else if (n < 91) {
    return n - 65;
  } else {
    return n - 97 + 26;
  }
}

function base64ToChar(n) {
  let c = 0;
  if (n < 26) {
    c = n + 65;
  } else if (n < 52) {
    c = n - 26 + 97;
  } else if (n < 62) {
    c = n - 52 + 48;
  } else if (n == 62) {
    c = 43;
  } else {
    c = 47;
  }
  return String.fromCharCode(c);
}

function hashString(s, hashLen = 32) {
  let n = s.length;
  if (n % hashLen !== 0) {
    let paddingLen = hashLen - (n % hashLen);
    let padding = new Array(paddingLen + 1).join("A");
    s = s + padding;
  }
  let nbRows = s.length / hashLen;
  ret = "";
  for (let i = 0; i < hashLen; i++) {
    let c = 0;

    for (let j = 0; j < nbRows; j++) {
      c = c + charToBase64(s[j * hashLen + i]);
    }
    c = c % 64;
    ret = ret + base64ToChar(c);
  }
  return ret;
}

function findPhoto(fileSize, photoName) {
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

function findPhotos(photosExistsData) {
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

module.exports = {
  sendResponse,
  sendSuccessfulResponse,
  sendFailedResponse,
  splitImageName,
  serverImageName,
  addPhotoToDisk,
  addPhotoToDB,
  isPhotoInDB,
  numberPhotosFromDB,
  getPhotosFromDB,
  getPhotosFromDisk,
  getAllPhotosFromDB,
  hashString,
  findPhoto,
  findPhotos,
};
