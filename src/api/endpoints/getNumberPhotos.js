const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get number of photos : return the number of photos in the server.
const endpoint = "/numberPhotos";
const callback = (req, res) => {
  console.log(`[GET numberPhotos]`);

  console.log("Getting number of photos in db.");
  databaseFunctions
    .numberPhotosFromDB()
    .then((nb) => {
      console.log(`Number of photos found in db: ${nb}.`);
      const jsonResponse = {
        number: nb,
      };
      console.log("Sending response data.");
      responseFormatter.sendResponse(res, jsonResponse);
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
