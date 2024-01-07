import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { addPhotoToDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { addServerImagePaths } from "@src/modules/diskFilesNaming";
import { hashString } from "@src/modules/hashing";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { hashLen } from "@src/config/config";
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

    console.log(`Searching in db for photo with path: ${requestPhoto.path}`);
    const ret = await checkPhotoExistsAndDeleteMissing({
      clientPath: requestPhoto.path,
    });
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted([ret.deleted], req.userId);
    }

    if (ret.exists) {
      console.log("Photo exists in server.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate, photoPath and the photo hash.");
      photo.syncDate = new Date(Date.now()).toJSON();
      await addServerImagePaths(photo);
      photo.hash = hashString(requestPhoto.image64, hashLen);
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
      return responseFormatter.sendResponse(res, jsonResponse, warning);
    }
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
