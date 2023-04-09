const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const consts = require(global.__srcdir + "/modules/consts");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotosByPath : returns array of photos by their paths.
const endpoint = "/getPhotosByPath";
const callback = async (req, res) => {
  console.log(`[getPhotosByPath]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(
    `paths len: ${req.body.paths.length}, type: ${req.body.photoType}`
  );

  const paths = req.body.paths;
  const photoType = req.body.photoType;

  try {
    console.log("Getting photos from db with paths from request.");
    const photos = await databaseFunctions.getPhotosByClientPathFromDB(paths);
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
      if (!photo) return { path: paths[index], exists: false };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return { path: paths[index], exists: true, photo: photoWithImage64 };
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
  if (checkReqBodyAttributeMissing(req, "paths", "Array string")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!consts.PHOTO_TYPES.includes(req.body.photoType)) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
