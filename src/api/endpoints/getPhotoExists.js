const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// get photo exists : returns whether or not a photo exists in the server
const endpoint = "/photoExists";
const callback = (req, res) => {
  console.log(`[GET photoExists]`);

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "path", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`Getting photo with path='${req.body.path}' from db.`);
  databaseFunctions
    .getPhotoByClientPathFromDB(req.body.path)
    .then((photo) => {
      console.log(`Photo found: ${Boolean(photo)}.`);
      const jsonResponse = {
        photo: photo,
        exists: Boolean(photo),
        path: req.body.path,
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
