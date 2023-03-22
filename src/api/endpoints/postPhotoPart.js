const responseFormatter = require(global.__srcdir + "/api/responseFormatter");

const { rootPath, hashLen } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const { hashString } = require(global.__srcdir + "/modules/hashing");
const diskManager = require(global.__srcdir + "/modules/diskManager");
const diskFilesNaming = require(global.__srcdir + "/modules/diskFilesNaming");

const waitingFiles = require(global.__srcdir + "/modules/waitingFiles");

const { checkReqBodyAttributeMissing } = require(global.__srcdir +
  "/modules/checkAttibutesMissing");

// add photo : adds a part of a photo to the server
const endpoint = "/photoAddPart";
const callback = (req, res) => {
  console.log(`[POST photo part]`);
  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }

  if (req.body.partSize != req.body.photoPart.length) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(
      res,
      "photoPart length and partSize do not match"
    );
    return;
  }

  console.log("Request parameters ok.");

  if (req.body.id in waitingFiles.FilesWaiting) {
    console.log(`Searching in db for photo with id: ${req.body.id}`);
    databaseFunctions
      .getPhotoByIdFromDB(req.body.id)
      .then((dbPhoto) => {
        if (dbPhoto) {
          console.log("Photo exists in server.");
          console.log(`Photo transfer for id ${req.body.id} found.`);
          const photo = waitingFiles.FilesWaiting[req.body.id];
          photo.current += req.body.partSize;
          photo.dataParts[req.body.partNumber] = req.body.photoPart;

          if (photo.current < photo.image64Len) {
            console.log("Photo part added.");
            console.log("Reseting timeout.");

            clearTimeout(photo.timeout);
            photo.timeout = setTimeout(() => {
              console.log(`Photo transfer for id ${req.body.id} timed out.`);
              console.log(`Deleting pending transfer for id ${req.body.id}`);
              delete waitingFiles.FilesWaiting[req.body.id];

              console.log(
                `Deleting photo with id ${req.body.id} from database`
              );
              databaseFunctions
                .deletePhotoByIdFromDB(req.body.id)
                .catch((err) => {
                  console.log(err);
                });
            }, 10000);

            console.log("Sending response message.");
            return responseFormatter.sendSuccessfulMessage(
              res,
              "Photo part added successfully"
            );
          } else if (photo.current > photo.image64Len) {
            console.log(
              `Transfered data (${photo.current}) exceeds initial image size (${photo.image64Len}).`
            );

            console.log(`Deleting pending transfer for id ${req.body.id}`);
            clearTimeout(photo.timeout);
            delete waitingFiles.FilesWaiting[req.body.id];

            console.log(`Deleting photo with id ${req.body.id} from database`);
            return databaseFunctions
              .deletePhotoByIdFromDB(req.body.id)
              .then(() => {
                console.log("Sending response message.");
                return responseFormatter.sendFailedMessage(
                  res,
                  `Transfered data (${photo.current}) exceeds initial image size (${photo.image64Len}).`,
                  "BAD_REQUEST"
                );
              });
          } else {
            console.log("Full image received.");
            console.log("Adding photo to disk.");

            console.log("Removing timeout");
            clearTimeout(photo.timeout);

            if (arePartsValid(photo.dataParts)) {
              const image64 = joinParts(photo.dataParts);

              return diskManager
                .addPhotoToDisk(
                  image64,
                  dbPhoto.width,
                  dbPhoto.height,
                  photo.serverFilePath
                )
                .then(() => {
                  console.log("Photo added to disk.");
                  console.log("Calculating hash and adding it to db.");
                  const hash = hashString(image64, hashLen);
                  return databaseFunctions.updatePhotoHashById(
                    req.body.id,
                    hash
                  );
                })
                .then(() => {
                  const jsonResponse = {
                    photo: responseFormatter.createPhotoObject(dbPhoto, ""),
                  };

                  console.log(
                    `Deleting pending transfer for id ${req.body.id}`
                  );
                  delete waitingFiles.FilesWaiting[req.body.id];

                  console.log("Sending response message.");
                  return responseFormatter.sendResponse(res, jsonResponse);
                });
            } else {
              console.log(`Deleting pending transfer for id ${req.body.id}`);
              clearTimeout(photo.timeout);
              delete waitingFiles.FilesWaiting[req.body.id];

              console.log(
                `Deleting photo with id ${req.body.id} from database`
              );
              return databaseFunctions
                .deletePhotoByIdFromDB(req.body.id)
                .then(() => {
                  console.log("Sending response message.");
                  return responseFormatter.sendFailedMessage(
                    res,
                    `Not all parts were found`,
                    "BAD_REQUEST"
                  );
                });
            }
          }
        } else {
          console.log("Photo does not exist in server.");
          console.log("Sending response message.");
          return responseFormatter.sendFailedMessage(
            res,
            `Photo with id: ${req.body.id} not found`,
            "ID_NOT_FOUND"
          );
        }
      })
      .catch((err) => {
        console.error(err);
        responseFormatter.sendErrorMessage(res);
      });
  } else {
    console.log(`No photo transfer for id ${req.body.id} was found.`);
    console.log("Sending response message.");
    return responseFormatter.sendFailedMessage(
      res,
      `No photo transfer for id ${req.body.id} was found.`,
      "PHOTO_TRANSFER_NOT_FOUND"
    );
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "partNumber", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "partSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "photoPart", "string")) return true;
  return false;
}

function arePartsValid(parts) {
  const totalNumberOfParts = Object.keys(parts).length;

  for (let i = 0; i < totalNumberOfParts; i++) {
    if (!(i.toString() in parts)) {
      return false;
    }
  }
  return true;
}

function joinParts(parts) {
  const totalNumberOfParts = Object.keys(parts).length;

  let ret = "";
  for (let i = 0; i < totalNumberOfParts; i++) {
    ret = ret.concat(parts[i]);
  }
  return ret;
}

module.exports = { endpoint: endpoint, callback: callback, method: "post" };
