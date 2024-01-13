import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotosByClientPathAndSizeAndDateFromDB } from "@src/db/sequelizeDb";

import Joi from "joi";
import { getPhotoFromDisk } from "@src/modules/diskManager";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  filterPhotosExistAndDeleteMissing,
} from "@src/modules/functions";

import { GetPhotosByPath } from "@src/api/export/exportedTypes";
import { APIPhoto, PhotoTypesArray } from "@src/api/export/exportedTypes/Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetPhotosByPath.ResponseData>();

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

    const {
      photosData,
      photoType,
      deviceUniqueId,
    }: GetPhotosByPath.RequestData = req.body;

    console.log("Getting photos from db with paths from request.");
    const photos = await getPhotosByClientPathAndSizeAndDateFromDB(
      photosData,
      deviceUniqueId
    );
    console.log("Received response from db.");

    const ret = await filterPhotosExistAndDeleteMissing(photos);
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted(ret.photosDeleted, req.userId);
    }

    let images64Promises;
    if (photoType == "data") {
      images64Promises = new Array(ret.photosThatExist.length).fill("");
    } else {
      console.log(`Retrieving ${photoType} photos from disk.`);
      images64Promises = ret.photosThatExist.map((photo) => {
        if (!photo) return "";
        return getPhotoFromDisk(photo, photoType);
      });
    }
    const images64 = await Promise.all(images64Promises);

    console.log("Photos retrieved from disk if needed");

    const photosResponse = ret.photosThatExist.map((photo, index) => {
      if (!photo)
        return { path: photosData[index].path, exists: false } as {
          path: string;
          exists: false;
        };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return {
        path: photosData[index].path,
        exists: true,
        photo: photoWithImage64,
      } as { path: string; exists: true; photo: APIPhoto };
    });

    const jsonResponse = {
      number: photosResponse.length,
      photos: photosResponse,
    };

    console.log("Sending response data.");
    return sendResponse(res, jsonResponse, warning);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  photosData: Joi.array().items(
    Joi.object({
      path: Joi.string(),
      date: Joi.string().isoDate(),
      size: Joi.number().integer(),
    }).options({ presence: "required" })
  ),
  photoType: Joi.string().valid(...PhotoTypesArray),
  deviceUniqueId: Joi.string().uuid({ version: "uuidv4" }),
}).options({ presence: "required" });

export default {
  endpoint: GetPhotosByPath.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
