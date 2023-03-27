const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// delete photos : deletes photos from server
const endpoint = "/photosDelete";
const callback = (req, res) => {
  console.log("[delete photos]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const promises = req.body.ids.map((id) => {
    return databaseFunctions
      .getPhotoByIdFromDB(id)
      .then((dbPhoto) => {
        if (!dbPhoto) {
          return false;
        } else {
          return databaseFunctions
            .deletePhotoByIdFromDB(id)
            .catch((err) => console.log(err))
            .then(() => dbPhoto);
        }
      })
      .then((dbPhoto) => {
        if (dbPhoto === false) {
          return false;
        }
        return diskManager
          .removePhotoFromDisk(dbPhoto.serverPath)
          .then(() => true)
          .catch((err) => console.log(err));
      });
  });

  Promise.all(promises)
    .then((results) => {
      const removedIds = req.body.ids.filter((value, index) => results[index]);
      console.log("Photos removed from db.");
      console.log("Sending response message.");
      responseFormatter.sendResponse(res, { deletedIds: removedIds });
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });

  // const id = req.body.id;

  // console.log(`Getting photo with id = ${id} from db to get it's path.`);
  // databaseFunctions
  //   .getPhotoByIdFromDB(id)
  //   .then((dbPhoto) => {
  //     if (!dbPhoto) {
  //       console.log("Photo not found in db.");
  //       console.log("Sending response message.");
  //       responseFormatter.sendFailedMessage(
  //         res,
  //         `Photo with id: ${id} not found`,
  //         "ID_NOT_FOUND"
  //       );
  //     } else {
  //       console.log("Photo found in db.");
  //       console.log("Removing photo from disk.");
  //       return diskManager
  //         .removePhotoFromDisk(dbPhoto.serverPath)
  //         .then(() => {
  //           console.log("Photo removed from disk.");
  //           console.log("Removing photo from db.");
  //           return databaseFunctions.deletePhotoByIdFromDB(id);
  //         })
  //         .then(() => {
  //           console.log("Photo removed from db.");
  //           console.log("Sending response message.");
  //           responseFormatter.sendSuccessfulMessage(
  //             res,
  //             "Photo removed from server."
  //           );
  //         });
  //     }
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //     responseFormatter.sendErrorMessage(res);
  //   });
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
