const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos : returns all photos in server.
const endpoint = "/photoGetId";
const callback = (req, res) => {
  console.log("[GET photo]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "id", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const id = req.body.id;

  console.log(`Getting photo with id = ${id} from db.`);
  databaseFunctions
    .getPhotoByIdFromDB(id)
    .then((dbPhoto) => {
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
        diskManager
          .getFullPhotoFromDisk(dbPhoto.serverPath)
          .then((image64) => {
            console.log("Photo retrieved.");
            const jsonResponse = {
              photo: responseFormatter.createPhotoObject(dbPhoto, image64),
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

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
