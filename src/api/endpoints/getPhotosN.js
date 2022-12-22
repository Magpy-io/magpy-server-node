const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const diskManager = require(global.__srcdir + "/modules/diskManager");

// get photos with pagination params : returns "number" photos starting from "offset".
const endpoint = "/photos/:number/:offset";
const callback = (req, res) => {
  const number = Number(req.params["number"]) ?? 10;
  const offset = Number(req.params["offset"]) ?? 0;
  console.log(`[GET photos] number: ${number} offset: ${offset}`);

  databaseFunctions.getPhotosFromDB(
    number,
    offset,
    function (dbPhotos, endReached) {
      const photos = dbPhotos.map((dbPhoto) => {
        const image64 = diskManager.getCroppedPhotoFromDisk(dbPhoto.serverPath);

        return responseFormatter.createPhotoObject(dbPhoto, image64);
      });

      const jsonResponse = {
        endReached: endReached,
        number: photos.length,
        photos: photos,
      };

      responseFormatter.sendResponse(res, true, 200, jsonResponse);
    }
  );
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
