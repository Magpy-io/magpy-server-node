import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { PhotoTypes, isValidPhotoType } from "@src/types/photoType";
import { getPhotosFromDB } from "@src/db/sequelizeDb";
import {
  getThumbnailPhotoFromDisk,
  getCompressedPhotoFromDisk,
  getOriginalPhotoFromDisk,
} from "@src/modules/diskManager";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import checkUserToken from "@src/middleware/checkUserToken";
import { filterPhotosAndDeleteMissing } from "@src/modules/functions";

// getPhotos : returns "number" photos starting from "offset".
const endpoint = "/getPhotos";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(res);
    }
    console.log("Request parameters ok.");

    console.log(
      `number: ${req.body.number}, offset: ${req.body.offset}, type: ${req.body.photoType}`
    );

    const requestParameters: RequestType = req.body;

    const { number, offset, photoType } = requestParameters;

    console.log(`Getting ${number} photos with offset ${offset} from db.`);
    const { photos, endReached } = await getPhotosFromDB(number, offset);

    console.log(`Got ${photos?.length} photos.`);

    const photosThatExist = await filterPhotosAndDeleteMissing(photos);
    console.log(
      `${photosThatExist?.length} photos exist in disk, ${
        photos?.length - photosThatExist?.length
      } photos were missing.`
    );

    let images64Promises;

    if (photoType == "data") {
      images64Promises = photosThatExist.map((photo) => "");
    } else if (photoType == "thumbnail") {
      console.log("Retrieving thumbnail photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        return getThumbnailPhotoFromDisk(photo.serverPath);
      });
    } else if (photoType == "compressed") {
      console.log("Retrieving compressed photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        return getCompressedPhotoFromDisk(photo.serverPath);
      });
    } else {
      // Photo Type "original"
      console.log("Retrieving original photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        return getOriginalPhotoFromDisk(photo.serverPath);
      });
    }

    const images64 = await Promise.all(images64Promises);

    const photosWithImage64 = photosThatExist.map((photo, index) => {
      return responseFormatter.createPhotoObject(photo, images64[index]);
    });

    console.log("Photos retrieved from disk if needed.");
    const jsonResponse = {
      endReached: endReached,
      number: photosWithImage64.length,
      photos: photosWithImage64,
    };

    console.log("Sending response data.");
    return responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "number", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "offset", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!isValidPhotoType(req.body.photoType)) return true;

  return false;
}

type RequestType = {
  number: number;
  offset: number;
  photoType: PhotoTypes;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
