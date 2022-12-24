const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get Previous photo : returns photo chronologically after photo with id 'id'
const endpoint = "/photoNext";
const callback = (req, res) => {
  console.log("[GET photoNext]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "id", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const id = req.body.id;

  console.log(`Getting photo after photo with id=${id} from db.`);
  databaseFunctions
    .getNextPhotoFromDB(id)
    .then(({ idFound, photoIdIsLast, photoNext, endReached }) => {
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
        diskManager
          .getFullPhotoFromDisk(photoNext.serverPath)
          .then((image64) => {
            console.log("Photo retrieved.");
            const jsonResponse = {
              endReached: endReached,
              photo: responseFormatter.createPhotoObject(photoNext, image64),
            };
            console.log("Sending response data.");
            responseFormatter.sendResponse(res, jsonResponse);
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

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
