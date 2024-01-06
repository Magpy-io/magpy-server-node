import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotosByClientPathFromDB } from "@src/db/sequelizeDb";
import { PhotoTypes, isValidPhotoType } from "@src/types/photoType";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { getPhotoFromDisk } from "@src/modules/diskManager";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  checkAndSaveWarningPhotosDeleted,
  filterPhotosExistAndDeleteMissing,
} from "@src/modules/functions";

// getPhotosByPath : returns array of photos by their paths.
const endpoint = "/getPhotosByPath";
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

    const { paths, photoType }: RequestType = req.body;

    console.log("Getting photos from db with paths from request.");
    const photos = await getPhotosByClientPathFromDB(paths);
    console.log("Received response from db.");
    const ret = await filterPhotosExistAndDeleteMissing(photos);

    const waiting = checkAndSaveWarningPhotosDeleted(
      ret.photosDeleted,
      req.userId
    );

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
      if (!photo) return { path: paths[index], exists: false };

      const photoWithImage64 = responseFormatter.createPhotoObject(
        photo,
        images64[index]
      );
      return { path: paths[index], exists: true, photo: photoWithImage64 };
    });

    const jsonResponse = {
      number: photosResponse.length,
      photos: photosResponse,
    };

    console.log("Sending response data.");
    return responseFormatter.sendResponse(res, jsonResponse, waiting);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "paths", "Array string")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!isValidPhotoType(req.body.photoType)) return true;

  return false;
}

type RequestType = {
  paths: string[];
  photoType: PhotoTypes;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
