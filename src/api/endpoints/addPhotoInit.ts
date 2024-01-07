import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import FilesWaiting from "@src/modules/waitingFiles";
import { addServerImagePaths } from "@src/modules/diskFilesNaming";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { v4 as uuid } from "uuid";
import { postPhotoPartTimeout } from "@src/config/config";
import { Photo } from "@src/types/photoType";
import checkUserToken from "@src/middleware/checkUserToken";

import {
  AddPhotoInitRequestData,
  AddPhotoInitResponseData,
} from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<AddPhotoInitResponseData>();

// addPhotoInit : initializes the transfer of a photo to the server
const endpoint = "/addPhotoInit";
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

    const requestPhoto: AddPhotoInitRequestData = req.body;

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
    console.log("Creating syncDate and photoPath.");
    const image64Len = requestPhoto.image64Len;
    photo.syncDate = new Date(Date.now()).toJSON();
    await addServerImagePaths(photo);
    const id = uuid();

    FilesWaiting.set(id, {
      received: 0,
      image64Len: image64Len,
      dataParts: new Map<number, string>(),
      timeout: setTimeout(() => {
        console.log(`Photo transfer for id ${id} timed out.`);
        console.log(`Deleting pending transfer for id ${id}`);
        FilesWaiting.delete(id);
      }, postPhotoPartTimeout),
      photo: photo,
    });
    console.log("Sending response message.");
    return sendResponse(res, { id: id });
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
  if (checkReqBodyAttributeMissing(req, "image64Len", "number")) return true;

  return false;
}

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
