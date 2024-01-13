import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { addPhotoToDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import Joi from "joi";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { addServerImagePaths } from "@src/modules/diskFilesNaming";
import { hashFile } from "@src/modules/hashing";

import checkUserToken from "@src/middleware/checkUserToken";
import { AddPhoto } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<AddPhoto.ResponseData>();

// addPhoto : adds a photo to the server
const endpoint = "/addPhoto";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    const { error } = RequestDataShema.validate(req.body);
    if (error) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res, error.message);
    }
    console.log("Request parameters ok.");

    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const requestPhoto: AddPhoto.RequestData = req.body;

    const photo = {
      name: requestPhoto.name,
      fileSize: requestPhoto.fileSize,
      width: requestPhoto.width,
      height: requestPhoto.height,
      date: requestPhoto.date,
      syncDate: new Date(Date.now()).toJSON(),
      clientPath: requestPhoto.path,
      deviceUniqueId: requestPhoto.deviceUniqueId,
      serverPath: "",
      serverCompressedPath: "",
      serverThumbnailPath: "",
      hash: "",
    };

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
      console.log(dbPhoto);
      await deletePhotoByIdFromDB(dbPhoto.id);
      throw err;
    }
    console.log("Photo added to disk.");
    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(dbPhoto, ""),
    };
    console.log("Sending response message.");
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  name: Joi.string(),
  fileSize: Joi.number().integer(),
  width: Joi.number().integer(),
  height: Joi.number().integer(),
  path: Joi.string(),
  date: Joi.string().isoDate(),
  image64: Joi.string().base64(),
  deviceUniqueId: Joi.string(),
}).options({ presence: "required" });

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
