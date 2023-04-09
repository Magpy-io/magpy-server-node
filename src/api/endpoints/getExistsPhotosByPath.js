const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// getExistsPhotosByPath : returns whether or not a list of photos exist in the server using their parth
const endpoint = "/getExistsPhotosByPath";
const callback = async (req, res) => {
  console.log(`[getExistsPhotosByPath]`);

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "paths", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`paths len: ${req.body.paths.length}`);

  const paths = req.body.paths;
  try {
    console.log("Getting photos from db with paths from request.");
    const photosFound = await databaseFunctions.getPhotosByClientPathFromDB(
      paths
    );
    console.log("Received response from db.");
    const photosExist = photosFound.map((photo, index) => {
      return {
        photo: photo,
        exists: Boolean(photo),
        path: paths[index],
      };
    });

    const jsonResponse = {
      photosExist: photosExist,
    };
    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
