const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

// get photos : returns all photos in server.
const endpoint = "/photo/:id";
const callback = (req, res) => {
  const id = req.params["id"] ?? "";
  console.log(`[GET photo] id: ${id}`);

  databaseFunctions.getPhotoFromDB(id, function (dbPhoto) {
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
      id: dbPhoto.id,
      meta: {
        name: dbPhoto.name,
        fileSize: dbPhoto.fileSize,
        width: dbPhoto.width,
        height: dbPhoto.height,
        date: dbPhoto.date,
        syncDate: dbPhoto.syncDate,
        serverPath: dbPhoto.serverPath,
        clientPath: dbPhoto.clientPath,
      },
      image64: image64,
    };

    responseFormatter.sendResponse(res, true, 200, jsonResponse);
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
