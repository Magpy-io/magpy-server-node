const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

// get photos : returns all photos in server.
const endpoint = "/photos";
const callback = (req, res) => {
  console.log(`[GET photos]`);

  databaseFunctions.getAllPhotosFromDB(function (dbPhotos) {
    const photos = diskManager.getPhotosFromDisk(dbPhotos);
    const jsonResponse = {
      number: photos.length,
      photos: photos,
    };

    responseFormatter.sendResponse(res, true, 200, jsonResponse);
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
