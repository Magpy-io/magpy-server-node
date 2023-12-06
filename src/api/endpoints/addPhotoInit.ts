import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import waitingFiles from "@src/modules/waitingFiles";
import { getPhotoByClientPathFromDB } from "@src/db/databaseFunctions";
import { createServerImageName } from "@src/modules/diskFilesNaming";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { v4 as uuid } from "uuid";
import { rootPath, postPhotoPartTimeout } from "@src/config/config";

// addPhotoInit : initializes the transfer of a photo to the server
const endpoint = "/addPhotoInit";
const callback = async (req, res) => {
  console.log(`\n[addPhotoInit]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`path: ${req.body.path}`);

  const photo = req.body;

  try {
    console.log(`Searching in db for photo with path: ${photo.path}`);
    const exists = await getPhotoByClientPathFromDB(photo.path);
    if (exists) {
      console.log("Photo exists in server.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate and photoPath.");
      const image64Len = photo.image64Len;
      delete photo.image64Len;
      photo.syncDate = new Date(Date.now()).toJSON();
      photo.serverPath = rootPath + createServerImageName(photo);
      const id = uuid();
      waitingFiles.FilesWaiting[id] = {
        received: 0,
        image64Len: image64Len,
        dataParts: {},
        timeout: setTimeout(() => {
          console.log(`Photo transfer for id ${id} timed out.`);
          console.log(`Deleting pending transfer for id ${id}`);
          delete waitingFiles.FilesWaiting[id];
        }, postPhotoPartTimeout),
        photo: photo,
      };
      console.log("Sending response message.");
      return responseFormatter.sendResponse(res, { id: id });
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "name", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "fileSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "width", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "height", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "date", "Date")) return true;
  if (checkReqBodyAttributeMissing(req, "image64Len", "number")) return true;

  return false;
}

export default { endpoint: endpoint, callback: callback, method: "post" };
