const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen, postPhotoPartTimeout } = require(global.__srcdir +
  "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const waitingFiles = require(global.__srcdir + "/modules/waitingFiles");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

const { v4: uuid } = require("uuid");

// addPhotoInit : initializes the transfer of a photo to the server
const endpoint = "/addPhotoInit";
const callback = async (req, res) => {
  console.log(`\n[addPhotoInit]`);

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
      return responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate and photoPath.");
      const image64Len = photo.image64Len;
      delete photo.image64Len;
      photo.syncDate = new Date(Date.now()).toJSON();
      photo.serverPath =
        rootPath + diskFilesNaming.createServerImageName(photo);
      const id = uuid();
      waitingFiles.FilesWaiting[id] = {
        received: 0,
        image64Len: image64Len,
        dataParts: {},
        timeout: setTimeout(() => {
          console.log(`Photo transfer for id ${id} timed out.`);
          console.log(`Deleting pending transfer for id ${id}`);
          delete waitingFiles.FilesWaiting[id];
        }, postPhotoPartTimeout),
        photo: photo,
      };
      console.log("Sending response message.");
      return responseFormatter.sendResponse(res, { id: id });
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
  if (checkReqBodyAttributeMissing(req, "image64Len", "number")) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
