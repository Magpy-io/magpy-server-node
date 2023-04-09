const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// deletePhotosById: deletes photos from server by id
const endpoint = "/deletePhotosById";
const callback = async (req, res) => {
  console.log("\n[deletePhotosById]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`ids len: ${req.body.ids.length}`);

  const ids = req.body.ids;

  try {
    const removedIds = [];
    for (const id of ids) {
      const dbPhoto = await databaseFunctions.getPhotoByIdFromDB(id);
      if (dbPhoto) {
        await databaseFunctions.deletePhotoByIdFromDB(id);
        await diskManager.removePhotoFromDisk(dbPhoto.serverPath);
        removedIds.push(id);
      }
    }

    console.log("Photos removed from db and disk.");
    console.log("Sending response message.");
    responseFormatter.sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
