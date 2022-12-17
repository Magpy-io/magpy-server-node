const helpers = require(global.__srcdir + "/helpers");

// post photo : adds a photo to the server
const endpoint = "/photo";
const callback = (req, res) => {
  console.log(`[POST photo]`);

  if (helpers.isPhotoInDB(req.body)) {
    const msg = "Photo already added to server.";
    console.log(msg);
    helpers.sendFailedResponse(res, msg, 409);
  } else {
    helpers.addPhotoToDB(req.body);
    helpers.addPhotoToDisk(res, req.body);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
