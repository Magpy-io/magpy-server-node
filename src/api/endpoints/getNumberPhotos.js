const helpers = require(global.__srcdir + "/helpers");

// get number of photos : return the number of photos in the server.
const endpoint = "/numberPhotos";
const callback = (req, res) => {
  console.log(`[GET numberPhotos]`);

  const nb = helpers.numberPhotosFromDB();
  const jsonResponse = {
    number: nb,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
