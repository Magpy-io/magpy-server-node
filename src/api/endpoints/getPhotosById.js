const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const consts = require(global.__srcdir + "/modules/consts");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotosById : returns array of photos by their ids.
const endpoint = "/getPhotosById";
const callback = async (req, res) => {
  console.log("\n[getPhotosById]");

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`ids len: ${req.body.ids.length}, type: ${req.body.photoType}`);

  const ids = req.body.ids;
  const photoType = req.body.photoType;

  try {
    console.log(`Getting ${ids.length} photos from db.`);
    const photos = await databaseFunctions.getPhotosByIdFromDB(ids);
    console.log("Received response from db.");

    let images64Promises;
    if (photoType == consts.PHOTO_TYPE_DATA) {
      images64Promises = photos.map((photo) => "");
    } else if (photoType == consts.PHOTO_TYPE_THUMBNAIL) {
      console.log("Retrieving thumbnail photos from disk.");
      images64Promises = photos.map((photo) => {
        if (!photo) return false;
        return diskManager.getThumbnailPhotoFromDisk(photo.serverPath);
      });
    } else if (photoType == consts.PHOTO_TYPE_COMPRESSED) {
      console.log("Retrieving compressed photos from disk.");
      images64Promises = photos.map((photo) => {
        if (!photo) return false;
        return diskManager.getCompressedPhotoFromDisk(photo.serverPath);
      });
    } else {
      //PHOTO_TYPE_ORIGINAL
      console.log("Retrieving original photos from disk.");
      images64Promises = photos.map((photo) => {
        if (!photo) return false;
        return diskManager.getOriginalPhotoFromDisk(photo.serverPath);
      });
    }
    const images64 = await Promise.all(images64Promises);

    console.log("Photos retrieved from disk if needed");

    const photosResponse = photos.map((photo, index) => {
      if (!photo) return { id: ids[index], exists: false };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return { id: ids[index], exists: true, photo: photoWithImage64 };
    });

    const jsonResponse = {
      number: photosResponse.length,
      photos: photosResponse,
    };

    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!consts.PHOTO_TYPES.includes(req.body.photoType)) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
