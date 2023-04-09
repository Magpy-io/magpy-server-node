const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// getNumberPhotos : return the number of photos in the server.
const endpoint = "/getNumberPhotos";
const callback = async (req, res) => {
  console.log(`[getNumberPhotos]`);

  try {
    console.log("Getting number of photos in db.");
    const nb = await databaseFunctions.numberPhotosFromDB();
    console.log(`Number of photos found in db: ${nb}.`);
    const jsonResponse = {
      number: nb,
    };
    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
