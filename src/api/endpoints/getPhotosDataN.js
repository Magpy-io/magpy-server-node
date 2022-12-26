const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos data with pagination params : returns "number" photo's data starting from "offset".
const endpoint = "/photosDataGetNb";
const callback = (req, res) => {
  console.log("[GET photos data]");

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

  const number = req.body.number;
  const offset = req.body.offset;

  console.log(`Getting ${number} photos with offset ${offset} from db.`);

  databaseFunctions
    .getPhotosFromDB(number, offset)
    .then(({ photos, endReached }) => {
      console.log(`Got ${photos?.length} photos.`);
      const jsonResponse = {
        endReached: endReached,
        number: photos.length,
        photos: photos,
      };

      console.log("Sending response data.");
      responseFormatter.sendResponse(res, jsonResponse);
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
