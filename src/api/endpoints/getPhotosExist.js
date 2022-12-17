const helpers = require(global.__srcdir + "/helpers");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get photos exist : returns whether or not a list of photos exist in the server
const endpoint = "/photosExist";
const callback = (req, res) => {
  console.log(`[GET photosExist]`);

  const hashes = databaseFunctions.findPhotosDB(req.body.photosExistData);

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

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
