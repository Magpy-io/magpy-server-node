const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotos : returns "number" photos starting from "offset".
const endpoint = "/getPhotos";
const callback = async (req, res) => {
  console.log("[getPhotos]");

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

  console.log(`number: ${req.body.number}, offset: ${req.body.offset}`);

  const number = req.body.number;
  const offset = req.body.offset;

  try {
    console.log(`Getting ${number} photos with offset ${offset} from db.`);
    const { photos, endReached } = await databaseFunctions.getPhotosFromDB(
      number,
      offset
    );

    console.log(`Got ${photos?.length} photos.`);
    console.log("Retrieving cropped photos from disk.");

    const images64Promises = photos.map((photo) => {
      return diskManager.getCroppedPhotoFromDisk(photo.serverPath);
    });

    const images64 = await Promise.all(images64Promises);

    const photosWithImage64 = photos.map((photo, index) => {
      return responseFormatter.createPhotoObject(photo, images64[index]);
    });

    console.log("Photos retrieved from disk.");
    const jsonResponse = {
      endReached: endReached,
      number: photosWithImage64.length,
      photos: photosWithImage64,
    };

    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
