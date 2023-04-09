const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotoNextById : returns photo chronologically after photo with id 'id'
const endpoint = "/getPhotoNextById";
const callback = async (req, res) => {
  console.log("[getPhotoNextById]");

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
    console.log(`Getting photo after photo with id=${id} from db.`);
    const { idFound, photoIdIsLast, photoNext, endReached } =
      await databaseFunctions.getNextPhotoFromDB(id);
    if (!idFound) {
      console.log(`Photo with id=${id} not found in db.`);
      console.log("Sending response message");
      responseFormatter.sendFailedMessage(
        res,
        `Photo with id: ${id} not found`,
        "ID_NOT_FOUND"
      );
    } else if (photoIdIsLast) {
      console.log(`Photo with id=${id} is last in db.`);
      console.log("Sending response message");
      responseFormatter.sendFailedMessage(
        res,
        `Photo with id: ${id} is last photo`,
        "PHOTO_IS_LAST"
      );
    } else {
      console.log("Photo found.");
      console.log("Retrieving photo from disk.");
      const image64 = await diskManager.getFullPhotoFromDisk(
        photoNext.serverPath
      );
      console.log("Photo retrieved.");
      const jsonResponse = {
        endReached: endReached,
        photo: responseFormatter.createPhotoObject(photoNext, image64),
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
