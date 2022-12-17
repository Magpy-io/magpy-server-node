const helpers = require(global.__srcdir + "/helpers");

// get photos : returns all photos in server.
const endpoint = "/photos";
const callback = (req, res) => {
  console.log(`[GET photos]`);

  const dbPhotos = helpers.getAllPhotosFromDB();
  const photos = helpers.getPhotosFromDisk(dbPhotos);
  const jsonResponse = {
    number: photos.length,
    photos: photos,
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
