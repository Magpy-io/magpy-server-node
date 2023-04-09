const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getExistsPhotoByPath : returns whether or not a photo exists in the server using its path
const endpoint = "/getExistsPhotoByPath";
const callback = async (req, res) => {
  console.log(`[getExistsPhotoByPath]`);

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "path", "string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`path: ${req.body.path}`);

  const path = req.body.path;

  try {
    console.log(`Getting photo with path='${path}' from db.`);
    const photo = await databaseFunctions.getPhotoByClientPathFromDB(path);
    const photoFound = Boolean(photo);
    console.log(`Photo found: ${photoFound}.`);
    const jsonResponse = {
      photo: photo,
      exists: photoFound,
      path: path,
    };
    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
