const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const waitingFiles = require(global.__srcdir + "/modules/waitingFiles");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// add photo : initializes the transfer of a photo to the server
const endpoint = "/photoAddInit";
const callback = (req, res) => {
  console.log(`[POST photo init]`);
  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`Searching in db for photo with path: ${req.body.path}`);
  databaseFunctions
    .getPhotoByClientPathFromDB(req.body.path)
    .then((exists) => {
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
        const photo = req.body;
        const image64Len = photo.image64Len;
        delete photo.image64Len;
        photo.syncDate = new Date(Date.now()).toJSON();
        photo.serverFilePath =
          rootPath + diskFilesNaming.createServerImageName(photo);
        photo.hash = "";
        console.log("Adding photo to db.");
        let id = "";
        return databaseFunctions
          .addPhotoToDB(photo)
          .then((id_db) => {
            id = id_db;
            console.log("Photo added successfully to db.");
            waitingFiles.FilesWaiting[id] = {
              current: 0,
              serverFilePath: photo.serverFilePath,
              image64Len: image64Len,
              dataParts: {},
              timeout: setTimeout(() => {
                console.log(`Photo transfer for id ${id} timed out.`);
                console.log(`Deleting pending transfer for id ${id}`);
                delete waitingFiles.FilesWaiting[id];

                console.log(`Deleting photo with id ${id} from database`);
                databaseFunctions.deletePhotoByIdFromDB(id).catch((err) => {
                  console.log(err);
                });
              }, 10000),
            };
          })
          .then(() => {
            return databaseFunctions.getPhotoByIdFromDB(id);
          })
          .then((dbPhoto) => {
            const jsonResponse = {
              photo: responseFormatter.createPhotoObject(dbPhoto, ""),
            };
            console.log("Photo added to disk.");
            console.log("Sending response message.");
            return responseFormatter.sendResponse(res, jsonResponse);
          })
          .catch((err) => {
            console.error(err);
            responseFormatter.sendErrorMessage(res);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });
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
