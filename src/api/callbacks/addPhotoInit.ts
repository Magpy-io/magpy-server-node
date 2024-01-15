import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import FilesWaiting from "@src/modules/waitingFiles";
import { addServerImagePaths } from "@src/modules/diskFilesNaming";
import Joi from "joi";
import { v4 as uuid } from "uuid";
import { postPhotoPartTimeout } from "@src/config/config";

import checkUserToken from "@src/middleware/checkUserToken";

import { AddPhotoInit } from "@src/api/Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<AddPhotoInit.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const requestPhoto: AddPhotoInit.RequestData = req.body;

    const photo = {
      name: requestPhoto.name,
      fileSize: requestPhoto.fileSize,
      width: requestPhoto.width,
      height: requestPhoto.height,
      date: requestPhoto.date,
      syncDate: "",
      clientPath: requestPhoto.path,
      deviceUniqueId: requestPhoto.deviceUniqueId,
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

export default {
  endpoint: AddPhotoInit.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: AddPhotoInit.RequestSchema,
};
