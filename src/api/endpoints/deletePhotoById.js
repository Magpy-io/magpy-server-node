const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos : returns all photos in server.
const endpoint = "/photoDelete";
const callback = (req, res) => {
  console.log("[DELETE photo]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "id", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const id = req.body.id;

  console.log(`Getting photo with id = ${id} from db to get it's path.`);
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
        console.log("Removing photo from disk.");
        diskManager
          .removePhotoFromDisk(dbPhoto.serverPath)
          .then(() => {
            console.log("Photo removed from disk.");
            console.log("Removing photo from db.");
            return databaseFunctions.deletePhotoByIdFromDB(id);
          })
          .then(() => {
            console.log("Photo removed from db.");
            console.log("Sending response message.");
            responseFormatter.sendSuccessfulMessage(
              res,
              "Photo removed from server."
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

module.exports = { endpoint: endpoint, callback: callback, method: "delete" };
