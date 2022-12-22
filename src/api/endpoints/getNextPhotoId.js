const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

// get photos : returns all photos in server.
const endpoint = "/photoNext/:id";
const callback = (req, res) => {
  const id = req.params["id"] ?? "";
  console.log(`[GET photoNext] id: ${id}`);

  databaseFunctions.getNextPhotoFromDB(id, function (dbPhoto, isLast) {
    if (!dbPhoto) {
      responseFormatter.sendFailedResponse(
        res,
        `Photo with id: ${id} not found`,
        404
      );
      return;
    }

    const image64 = diskManager.getFullPhotoFromDisk(dbPhoto.serverPath);
    const jsonResponse = {
      endReached: isLast,
      photo: responseFormatter.createPhotoObject(dbPhoto, image64),
    };

    responseFormatter.sendResponse(res, true, 200, jsonResponse);
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
