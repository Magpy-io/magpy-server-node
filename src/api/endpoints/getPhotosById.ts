import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotosByIdFromDB } from "@src/db/sequelizeDb";
import { PhotoTypes, isValidPhotoType } from "@src/types/photoType";
import {
  getOriginalPhotoFromDisk,
  getThumbnailPhotoFromDisk,
  getCompressedPhotoFromDisk,
} from "@src/modules/diskManager";

import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import checkUserToken from "@src/middleware/checkUserToken";
import { filterPhotosExistAndDeleteMissing } from "@src/modules/functions";

// getPhotosById : returns array of photos by their ids.
const endpoint = "/getPhotosById";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(res);
    }
    console.log("Request parameters ok.");

    console.log(`ids len: ${req.body.ids.length}, type: ${req.body.photoType}`);

    const { ids, photoType }: RequestType = req.body;

    console.log(`Getting ${ids.length} photos from db.`);
    const photos = await getPhotosByIdFromDB(ids);
    console.log("Received response from db.");

    const photosThatExist = await filterPhotosExistAndDeleteMissing(photos);

    let images64Promises;
    if (photoType == "data") {
      images64Promises = photosThatExist.map((photo) => "");
    } else if (photoType == "thumbnail") {
      console.log("Retrieving thumbnail photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        if (!photo) return "";
        return getThumbnailPhotoFromDisk(photo);
      });
    } else if (photoType == "compressed") {
      console.log("Retrieving compressed photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        if (!photo) return "";
        return getCompressedPhotoFromDisk(photo);
      });
    } else {
      // Photo Type "original"
      console.log("Retrieving original photos from disk.");
      images64Promises = photosThatExist.map((photo) => {
        if (!photo) return "";
        return getOriginalPhotoFromDisk(photo);
      });
    }
    const images64 = await Promise.all(images64Promises);

    console.log("Photos retrieved from disk if needed");

    const photosResponse = photosThatExist.map((photo, index) => {
      if (!photo) return { id: ids[index], exists: false };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return { id: ids[index], exists: true, photo: photoWithImage64 };
    });

    const jsonResponse = {
      number: photosResponse.length,
      photos: photosResponse,
    };

    console.log("Sending response data.");
    return responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!isValidPhotoType(req.body.photoType)) return true;

  return false;
}

type RequestType = {
  ids: string[];
  photoType: PhotoTypes;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
