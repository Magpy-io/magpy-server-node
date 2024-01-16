import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";
import { getPhotosFromDB } from "../../db/sequelizeDb";
import { getPhotoFromDisk } from "../../modules/diskManager";

import checkUserToken from "../../middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  filterPhotosAndDeleteMissing,
} from "../../modules/functions";
import { GetPhotos } from "../Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetPhotos.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    console.log(
      `number: ${req.body.number}, offset: ${req.body.offset}, type: ${req.body.photoType}`
    );

    const requestParameters: GetPhotos.RequestData = req.body;

    const { number, offset, photoType } = requestParameters;

    console.log(`Getting ${number} photos with offset ${offset} from db.`);
    const { photos, endReached } = await getPhotosFromDB(number, offset);

    console.log(`Got ${photos?.length} photos.`);

    const ret = await filterPhotosAndDeleteMissing(photos);
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted(ret.photosDeleted, req.userId);
    }

    console.log(
      `${ret.photosThatExist?.length} photos exist in disk, ${
        photos?.length - ret.photosThatExist?.length
      } photos were missing.`
    );

    let images64Promises;

    if (photoType == "data") {
      images64Promises = new Array(ret.photosThatExist.length).fill("");
    } else {
      console.log(`Retrieving ${photoType} photos from disk.`);
      images64Promises = ret.photosThatExist.map((photo) => {
        return getPhotoFromDisk(photo, photoType);
      });
    }

    const images64 = await Promise.all(images64Promises);

    const photosWithImage64 = ret.photosThatExist.map((photo, index) => {
      return responseFormatter.createPhotoObject(photo, images64[index]);
    });

    console.log("Photos retrieved from disk if needed.");
    const jsonResponse = {
      endReached: endReached,
      number: photosWithImage64.length,
      photos: photosWithImage64,
    };

    console.log("Sending response data.");
    return sendResponse(res, jsonResponse, warning);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetPhotos.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: GetPhotos.RequestSchema,
};
