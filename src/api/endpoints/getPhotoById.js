const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotoById : returns a photo by id
const endpoint = "/getPhotoById";
const callback = async (req, res) => {
  console.log("[getPhotoById]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "id", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`id: ${req.body.id}`);

  const id = req.body.id;

  try {
    console.log(`Getting photo with id = ${id} from db.`);
    const dbPhoto = await databaseFunctions.getPhotoByIdFromDB(id);
    if (!dbPhoto) {
      console.log("Photo not found in db.");
      console.log("Sending response message.");
      responseFormatter.sendFailedMessage(
        res,
        `Photo with id: ${id} not found`,
        "ID_NOT_FOUND"
      );
    } else {
      console.log("Photo found in db.");
      console.log("Retrieving photo from disk.");
      const image64 = await diskManager.getFullPhotoFromDisk(
        dbPhoto.serverPath
      );
      console.log("Photo retrieved.");
      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(dbPhoto, image64),
      };
      console.log("Sending response data.");
      responseFormatter.sendResponse(res, jsonResponse);
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
