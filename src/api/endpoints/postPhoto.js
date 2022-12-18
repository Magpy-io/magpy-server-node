const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");

// post photo : adds a photo to the server
const endpoint = "/photo";
const callback = (req, res) => {
  console.log(`[POST photo]`);
  databaseFunctions.isPhotoInDB(req.body, function (exists) {
    if (exists) {
      const msg = "Photo already added to server.";
      console.log(msg);
      responseFormatter.sendFailedResponse(res, msg, 409);
    } else {
      let photo = req.body;
      photo.syncDate = new Date(Date.now()).toJSON();
      photo.serverFilePath =
        rootPath + diskManager.createServerImageName(photo);
      photo.hash = hashString(photo.image64, hashLen);
      databaseFunctions.addPhotoToDB(photo);
      diskManager.addPhotoToDisk(photo);
      const message = "File written successfully";
      responseFormatter.sendSuccessfulResponse(res, message);
      console.log(message);
    }
  });
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
