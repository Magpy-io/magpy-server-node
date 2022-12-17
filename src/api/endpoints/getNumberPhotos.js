const helpers = require(global.__srcdir + "/helpers");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get number of photos : return the number of photos in the server.
const endpoint = "/numberPhotos";
const callback = (req, res) => {
  console.log(`[GET numberPhotos]`);

  const nb = databaseFunctions.numberPhotosFromDB();
  const jsonResponse = {
    number: nb,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
