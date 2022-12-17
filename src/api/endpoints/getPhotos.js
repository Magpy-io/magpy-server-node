const helpers = require(global.__srcdir + "/helpers");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

// get photos : returns all photos in server.
const endpoint = "/photos";
const callback = (req, res) => {
  console.log(`[GET photos]`);

  const dbPhotos = databaseFunctions.getAllPhotosFromDB();
  const photos = diskManager.getPhotosFromDisk(dbPhotos);
  const jsonResponse = {
    number: photos.length,
    photos: photos,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
