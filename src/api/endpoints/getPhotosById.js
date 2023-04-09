const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotosById : returns array of photos by their ids.
const endpoint = "/getPhotosById";
const callback = async (req, res) => {
  console.log("[getPhotosById]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`ids len: ${req.body.ids.length}`);

  const ids = req.body.ids;

  try {
    console.log(`Getting ${ids.length} photos from db.`);
    const photos = await databaseFunctions.getPhotosByIdFromDB(ids);
    console.log("Received response from db.");
    console.log("Retrieving cropped photos from disk.");
    const images64Promises = photos.map((photo) => {
      if (!photo) return false;
      return diskManager.getCroppedPhotoFromDisk(photo.serverPath);
    });
    const images64 = await Promise.all(images64Promises);
    console.log("Photos retrieved from disk.");
    const photosResponse = images64.map((image64, index) => {
      if (!image64) return { id: ids[index], exists: false };
      const photoWithImage64 = responseFormatter.createPhotoObject(
        photos[index],
        image64
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

module.exports = { endpoint: endpoint, callback: callback, method: "post" };