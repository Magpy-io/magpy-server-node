const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// delete photos : deletes photos from server by id
const endpoint = "/photosDelete";
const callback = async (req, res) => {
  console.log("[delete photos by id]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    await responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  try {
    const removedIds = [];
    for (const id of req.body.ids) {
      const dbPhoto = await databaseFunctions.getPhotoByIdFromDB(id);
      if (dbPhoto) {
        await databaseFunctions.deletePhotoByIdFromDB(id);
        await diskManager.removePhotoFromDisk(dbPhoto.serverPath);
        removedIds.push(id);
      }
    }

    console.log("Photos removed from db.");
    console.log("Sending response message.");
    responseFormatter.sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    await responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
