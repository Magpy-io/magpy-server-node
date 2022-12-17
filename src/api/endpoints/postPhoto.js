const helpers = require(global.__srcdir + "/helpers");

const { rootPath } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const hashing = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");

// post photo : adds a photo to the server
const endpoint = "/photo";
const callback = (req, res) => {
  console.log(`[POST photo]`);

  if (databaseFunctions.isPhotoInDB(req.body)) {
    const msg = "Photo already added to server.";
    console.log(msg);
    helpers.sendFailedResponse(res, msg, 409);
  } else {
    let photo = req.body;
    photo.syncDate = new Date(Date.now()).toJSON();
    photo.serverFilePath = rootPath + diskManager.createServerImageName(photo);
    photo.hash = hashing.hashString(photo.image64);
    databaseFunctions.addPhotoToDB(photo);
    diskManager.addPhotoToDisk(photo);
    const message = "File written successfully";
    helpers.sendSuccessfulResponse(res, message);
    console.log(message);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
