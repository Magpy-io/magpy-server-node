import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { addPhotoToDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";

import { addPhotoToDisk } from "@src/modules/diskManager";
import { addServerImagePaths } from "@src/modules/diskFilesNaming";
import { hashFile } from "@src/modules/hashing";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { Photo } from "@src/types/photoType";
import checkUserToken from "@src/middleware/checkUserToken";

// addPhoto : adds a photo to the server
const endpoint = "/addPhoto";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res);
    }
    console.log("Request parameters ok.");

    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const requestPhoto: RequestType = req.body;

    const photo: Photo = {
      id: "",
      name: requestPhoto.name,
      fileSize: requestPhoto.fileSize,
      width: requestPhoto.width,
      height: requestPhoto.height,
      date: requestPhoto.date,
      syncDate: "",
      clientPath: requestPhoto.path,
      serverPath: "",
      serverCompressedPath: "",
      serverThumbnailPath: "",
      hash: "",
    };

    console.log("Photo does not exist in server.");
    console.log("Creating syncDate, photoPath and the photo hash.");
    photo.syncDate = new Date(Date.now()).toJSON();
    await addServerImagePaths(photo);
    photo.hash = hashFile(requestPhoto.image64);
    console.log("Adding photo to db.");
    const dbPhoto = await addPhotoToDB(photo);

    console.log("Photo added successfully to db.");
    try {
      console.log("Adding photo to disk.");
      await addPhotoToDisk(dbPhoto, requestPhoto.image64);
    } catch (err) {
      console.log("Could not add photo to disk, removing photo from db");
      await deletePhotoByIdFromDB(dbPhoto.id);
      throw err;
    }
    console.log("Photo added to disk.");
    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(dbPhoto, ""),
    };
    console.log("Sending response message.");
    return responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
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

type RequestType = {
  name: string;
  fileSize: number;
  width: number;
  height: number;
  path: string;
  date: string;
  image64: string;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
