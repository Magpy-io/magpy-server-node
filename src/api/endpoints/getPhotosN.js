const helpers = require(global.__srcdir + "/helpers");

// get photos with pagination params : returns "number" photos starting from "offset".
const endpoint = "/photos/:number/:offset";
const callback = (req, res) => {
  console.log(`[GET photos] number:${number} offset:${offset}`);

  const number = req.params["number"] ?? 10;
  const offset = req.params["offset"] ?? 0;
  const { dbPhotos, endReached } = helpers.getPhotosFromDB(number, offset);
  const photos = helpers.getPhotosFromDisk(dbPhotos);
  const jsonResponse = {
    endReached: endReached,
    photos: photos,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
