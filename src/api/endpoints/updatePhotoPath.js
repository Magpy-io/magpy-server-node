const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// updatePhotoPath : updates the path of a photo in db
const endpoint = "/updatePhotoPath";
const callback = async (req, res) => {
  console.log(`[updatePhotoPath]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`id: ${req.body.id}, newPath: ${req.body.path}`);

  const id = req.body.id;
  const path = req.body.path;

  try {
    console.log(`Searching in db for photo with id: ${id}`);
    const exists = await databaseFunctions.getPhotoByIdFromDB(id);
    if (!exists) {
      console.log("Photo does not exist in server.");
      console.log("Sending response message.");
      responseFormatter.sendFailedMessage(
        res,
        `Photo with id ${id} not found in server`,
        "ID_NOT_FOUND"
      );
    } else {
      console.log("Photo found");
      console.log("Updating path in db");
      await databaseFunctions.updatePhotoClientPathById(id, path);

      console.log("Photo updated successfully.");
      console.log("Sending response message.");
      responseFormatter.sendSuccessfulMessage(
        res,
        `Photo with id ${id} successfully updated with new path`
      );
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;

  return false;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
