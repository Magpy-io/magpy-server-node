import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import {
  addPhotoToDB,
  getPhotoByClientPathFromDB,
} from "@src/db/databaseFunctions";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { createServerImageName } from "@src/modules/diskFilesNaming";
import { hashString } from "@src/modules/hashing";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { rootPath, hashLen } from "@src/config/config";

// addPhoto : adds a photo to the server
const endpoint = "/addPhoto";
const callback = async (req: Request, res: Response) => {
  console.log(`\n[addPhoto]`);

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
      responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate, photoPath and the photo hash.");
      photo.syncDate = new Date(Date.now()).toJSON();
      photo.serverPath = rootPath + createServerImageName(photo);
      photo.hash = hashString(photo.image64, hashLen);
      console.log("Adding photo to db.");
      const dbPhoto = await addPhotoToDB(photo);

      console.log("Photo added successfully to db.");
      console.log("Adding photo to disk.");
      await addPhotoToDisk(
        photo.image64,
        photo.width,
        photo.height,
        photo.serverPath
      );
      console.log("Photo added to disk.");

      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(dbPhoto, ""),
      };
      console.log("Sending response message.");
      responseFormatter.sendResponse(res, jsonResponse);
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "name", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "fileSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "width", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "height", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "date", "Date")) return true;
  if (checkReqBodyAttributeMissing(req, "image64", "string")) return true;

  return false;
}

export default { endpoint: endpoint, callback: callback, method: "post" };
