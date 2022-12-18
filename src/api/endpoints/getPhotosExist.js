const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get photos exist : returns whether or not a list of photos exist in the server
const endpoint = "/photosExist";
const callback = (req, res) => {
  console.log(`[GET photosExist]`);

  databaseFunctions.findPhotosDB(req.body.photosExistData, function (hashes) {
    const photosExist = hashes.map((hash, index) => {
      return {
        name: req.body.photosExistData[index].name,
        fileSize: req.body.photosExistData[index].fileSize,
        exists: Boolean(hash),
        hash: hash ?? "",
      };
    });

    const jsonResponse = {
      photosExist: photosExist,
    };

    responseFormatter.sendResponse(res, true, 200, jsonResponse);
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
