import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotosByIdFromDB } from "@src/db/sequelizeDb";

import { getPhotoFromDisk } from "@src/modules/diskManager";
import Joi from "joi";

import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  filterPhotosExistAndDeleteMissing,
} from "@src/modules/functions";

import { APIPhoto, PhotoTypesArray } from "@src/api/export/exportedTypes/Types";
import { GetPhotosById } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetPhotosById.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const { ids, photoType }: GetPhotosById.RequestData = req.body;

    console.log(`Getting ${ids.length} photos from db.`);
    const photos = await getPhotosByIdFromDB(ids);
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
        return { id: ids[index], exists: false } as {
          id: string;
          exists: false;
        };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return { id: ids[index], exists: true, photo: photoWithImage64 } as {
        id: string;
        exists: true;
        photo: APIPhoto;
      };
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
  ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })),
  photoType: Joi.string().valid(...PhotoTypesArray),
}).options({ presence: "required" });

export default {
  endpoint: GetPhotosById.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
