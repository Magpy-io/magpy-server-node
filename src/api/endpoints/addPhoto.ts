const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// addPhoto : adds a photo to the server
const endpoint = "/addPhoto";
const callback = async (req, res) => {
  console.log(`\n[addPhoto]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`path: ${req.body.path}`);

  const photo = req.body;

  try {
    console.log(`Searching in db for photo with path: ${photo.path}`);
    const exists = await databaseFunctions.getPhotoByClientPathFromDB(
      photo.path
    );
    if (exists) {
      console.log("Photo exists in server.");
      console.log("Sending response message.");
      responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate, photoPath and the photo hash.");
      photo.syncDate = new Date(Date.now()).toJSON();
      photo.serverPath =
        rootPath + diskFilesNaming.createServerImageName(photo);
      photo.hash = hashString(photo.image64, hashLen);
      console.log("Adding photo to db.");
      const dbPhoto = await databaseFunctions.addPhotoToDB(photo);

      console.log("Photo added successfully to db.");
      console.log("Adding photo to disk.");
      await diskManager.addPhotoToDisk(
        photo.image64,
        photo.width,
        photo.height,
        photo.serverPath
      );
      console.log("Photo added to disk.");

      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(dbPhoto, ""),
      };
      console.log("Sending response message.");
      responseFormatter.sendResponse(res, jsonResponse);
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "name", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "fileSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "width", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "height", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "date", "Date")) return true;
  if (checkReqBodyAttributeMissing(req, "image64", "string")) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
