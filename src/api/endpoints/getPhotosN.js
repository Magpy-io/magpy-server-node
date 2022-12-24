const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos with pagination params : returns "number" photos starting from "offset".
const endpoint = "/photosGet";
const callback = (req, res) => {
  console.log("[GET photos]");

  console.log("Checking request parameters.");
  if (
    checkReqBodyAttributeMissing(req, "number", "number") ||
    checkReqBodyAttributeMissing(req, "offset", "number")
  ) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const number = req.body.number;
  const offset = req.body.offset;

  console.log(`Getting ${number} photos with offset ${offset} from db.`);
  const photosFromDbPromise = databaseFunctions.getPhotosFromDB(number, offset);

  const endReachedPromise = photosFromDbPromise.then(({ endReached }) => {
    return endReached;
  });

  const photosWithImage64 = photosFromDbPromise.then(({ photos }) => {
    console.log(`Got ${photos?.length} photos.`);
    console.log("Retrieving cropped photos from disk.");
    const photosPromises = photos.map((photo) => {
      return diskManager
        .getCroppedPhotoFromDisk(photo.serverPath)
        .then((image64) => {
          return responseFormatter.createPhotoObject(photo, image64);
        });
    });

    return Promise.all(photosPromises);
  });

  Promise.all([photosWithImage64, endReachedPromise])
    .then(([photos, endReached]) => {
      const jsonResponse = {
        endReached: endReached,
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

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
