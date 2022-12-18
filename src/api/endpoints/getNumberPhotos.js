const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get number of photos : return the number of photos in the server.
const endpoint = "/numberPhotos";
const callback = (req, res) => {
  console.log(`[GET numberPhotos]`);

  databaseFunctions.numberPhotosFromDB(function (nb) {
    const jsonResponse = {
      number: nb,
    };

    responseFormatter.sendResponse(res, true, 200, jsonResponse);
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
