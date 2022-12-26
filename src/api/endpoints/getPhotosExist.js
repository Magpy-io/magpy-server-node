const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photos exist : returns whether or not a list of photos exist in the server
const endpoint = "/photosExist";
const callback = (req, res) => {
  console.log(`[GET photosExist]`);

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "paths", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log("Getting photos from db with paths from request.");
  databaseFunctions
    .getPhotosByClientPathFromDB(req.body.paths)
    .then((photosFound) => {
      console.log("Received response from db.");
      const photosExist = photosFound.map((photo, index) => {
        return {
          photo: photo,
          exists: Boolean(photo),
          path: req.body.paths[index],
        };
      });

      const jsonResponse = {
        photosExist: photosExist,
      };
      console.log("Sending response data.");
      responseFormatter.sendResponse(res, jsonResponse);
    })
    .catch((err) => {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    });
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
