const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos with pagination params : returns "number" photos starting from "offset".
const endpoint = "/photosGetId";
const callback = (req, res) => {
  console.log("[GET photos by Id]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const ids = req.body.ids;

  console.log(`Getting ${ids.length} photos from db.`);

  databaseFunctions
    .getPhotosByIdFromDB(ids)
    .then((photos) => {
      console.log("Received response from db.");
      console.log("Retrieving cropped photos from disk.");
      const photosPromises = photos.map((photo) => {
        if (!photo) return photo;
        return diskManager
          .getCroppedPhotoFromDisk(photo.serverPath)
          .then((image64) => {
            return responseFormatter.createPhotoObject(photo, image64);
          });
      });

      return Promise.all(photosPromises);
    })
    .then((photos) => {
      console.log("Photos retrieved from disk.");
      photos = photos.map((photo) => {
        return {
          photo: photo,
          exists: Boolean(photo),
        };
      });
      const jsonResponse = {
        number: photos.length,
        photos: photos,
      };

      console.log("Sending response data.");
      responseFormatter.sendResponse(res, jsonResponse);
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
