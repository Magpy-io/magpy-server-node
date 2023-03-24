const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// update photo path : updates the path of a photo in db
const endpoint = "/photoUpdatePath";
const callback = (req, res) => {
  console.log(`[UPDATE photo path]`);
  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`Searching in db for photo with id: ${req.body.id}`);
  databaseFunctions
    .getPhotoByIdFromDB(req.body.id)
    .then((exists) => {
      if (!exists) {
        console.log("Photo does not exist in server.");
        console.log("Sending response message.");
        return responseFormatter.sendFailedMessage(
          res,
          `Photo with id ${req.body.id} not found in server`,
          "ID_NOT_FOUND"
        );
      } else {
        console.log("Photo found");
        console.log("Updating path in db");

        return databaseFunctions
          .updatePhotoClientPathById(req.body.id, req.body.path)
          .then(() => {
            console.log("Photo updated successfully.");
            console.log("Sending response message.");
            responseFormatter.sendSuccessfulMessage(
              res,
              `Photo with id ${req.body.id} successfully updated with new path`
            );
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
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
