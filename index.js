// IMPORTS
const helpers = require("./helpers");
const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const { exists } = require("mz/fs");

// CONFIG
const host = config.host;
const port = config.port;
const rootPath = config.photosDirPath;

// Create app
const app = express();

// Use bodyParser to automatically parse request bodies to json
app.use(bodyParser.json({ limit: "50mb" }));

// Listen to requests
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

// ---------------------------------------------------------------------------- GET requests

// GET /numberPhotos : return the number of photos in the server.
app.get("/numberPhotos", (req, res) => {
  console.log(`[GET numberPhotos]`);
  const nb = helpers.numberPhotosFromDB();
  helpers.sendResponse(res, true, 200, {
    number: nb,
  });
});

// GET /photos with pagination params : returns number photos starting from offset.
app.get("/photos/:number/:offset", (req, res) => {
  const number = req.params["number"] ?? 10;
  const offset = req.params["offset"] ?? 0;

  console.log(`[GET photos] number:${number} offset:${offset}`);
  const { dbPhotos, endReached } = helpers.getPhotosFromDB(number, offset);
  const photos = helpers.getPhotosFromDisk(dbPhotos);
  const jsonResponse = {
    endReached: endReached,
    photos: photos,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
});

// GET /photos : returns all photos in server.
app.get("/photos", (req, res) => {
  console.log(`[GET photos]`);
  const dbPhotos = helpers.getAllPhotosFromDB();
  const photos = helpers.getPhotosFromDisk(dbPhotos);
  const jsonResponse = {
    number: photos.length,
    photos: photos,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
});

// GET /photoExists : returns whether or not a photo exists in the server
app.get("/photoExists", (req, res) => {
  console.log(`[GET photoExists]`);

  const hash = helpers.findPhoto(req.body.fileSize, req.body.name);

  const jsonResponse = {
    name: req.body.name,
    fileSize: req.body.fileSize,
    exists: Boolean(hash),
    hash: hash ?? "",
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
});

// GET /photosExist : returns whether or not a list of photos exist in the server
app.get("/photosExist", (req, res) => {
  console.log(`[GET photosExist]`);

  const hashes = helpers.findPhotos(req.body.photosExistData);

  const photosExist = hashes.map((hash, index) => {
    return {
      name: req.body.photosExistData[index].name,
      fileSize: req.body.photosExistData[index].fileSize,
      exists: Boolean(hash),
      hash: hash ?? "",
    };
  });

  const jsonResponse = {
    photosExist: photosExist,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
});

// ---------------------------------------------------------------------------- POST requests

/* POST /photo : adds a photo to the server
  Request body is a json that looks like: 
  {
    "name": "name",
    "fileSize": 1000,
    "width": 1000,
    "height": 1000,
    "date": "2022-12-11T17:27:58.396Z",
    "base64": image64 data
  } */

app.post("/photo", (req, res) => {
  console.log(`[POST photo]`);

  if (helpers.isPhotoInDB(req.body)) {
    const msg = "Photo already added to server.";
    console.log(msg);
    helpers.sendFailedResponse(res, msg, 409);
  } else {
    const serverFilePath = rootPath + helpers.serverImageName(req.body.name);
    helpers.addPhotoToDB(req.body, serverFilePath);
    helpers.addPhotoToDisk(res, req.body.image64, serverFilePath);
  }
});
