const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

const { getNumberOfParts, getPartN } = require(global.__srcdir +
  "/modules/stringHelper");

// getPhotoPartById : returns a part of a photo by id.
const endpoint = "/getPhotoPartById";
const callback = async (req, res) => {
  console.log("[getPhotoPartById]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "id", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const id = req.body.id;
  let partNumber = 0;
  if (!checkReqBodyAttributeMissing(req, "part", "number")) {
    partNumber = req.body.part;
  }

  console.log(`id: ${req.body.id}, partNumber: ${partNumber}`);

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
      console.log("Sending response data.");

      const totalNbOfParts = getNumberOfParts(image64);

      if (partNumber < totalNbOfParts) {
        const part = getPartN(image64, partNumber);
        const jsonResponse = {
          photo: responseFormatter.createPhotoObject(dbPhoto, part),
          part: partNumber,
          totalNbOfParts: totalNbOfParts,
        };
        responseFormatter.sendResponse(res, jsonResponse);
      } else {
        console.log(
          `Part number ${partNumber} exceeds maximum number of parts ${totalNbOfParts}`
        );
        console.log("Sending response message.");
        responseFormatter.sendFailedMessage(
          res,
          `Part number ${partNumber} exceeds maximum number of parts ${totalNbOfParts}`,
          "INVALID_PART_NUMBER"
        );
      }
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
