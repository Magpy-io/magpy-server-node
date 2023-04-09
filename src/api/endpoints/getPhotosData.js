const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getPhotosData : returns "number" photo's data starting from "offset".
const endpoint = "/getPhotosData";
const callback = async (req, res) => {
  console.log("[getPhotosData]");

  console.log("Checking request parameters.");
  if (
    checkReqBodyAttributeMissing(req, "number", "number") ||
    checkReqBodyAttributeMissing(req, "offset", "number")
  ) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`number: ${req.body.number}, offset: ${req.body.offset}`);

  const number = req.body.number;
  const offset = req.body.offset;

  try {
    console.log(`Getting ${number} photos with offset ${offset} from db.`);
    const { photos, endReached } = await databaseFunctions.getPhotosFromDB(
      number,
      offset
    );
    console.log(`Got ${photos?.length} photos.`);
    const jsonResponse = {
      endReached: endReached,
      number: photos.length,
      photos: photos,
    };

    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
