import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import consts from "@src/modules/consts";
import { getPhotosFromDB } from "@src/db/databaseFunctions";
import {
  getThumbnailPhotoFromDisk,
  getCompressedPhotoFromDisk,
  getOriginalPhotoFromDisk,
} from "@src/modules/diskManager";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";

// getPhotos : returns "number" photos starting from "offset".
const endpoint = "/getPhotos";
const callback = async (req, res) => {
  console.log("\n[getPhotos]");

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(
    `number: ${req.body.number}, offset: ${req.body.offset}, type: ${req.body.photoType}`
  );

  const number = req.body.number;
  const offset = req.body.offset;
  const photoType = req.body.photoType;

  try {
    console.log(`Getting ${number} photos with offset ${offset} from db.`);
    const { photos, endReached } = await getPhotosFromDB(number, offset);

    console.log(`Got ${photos?.length} photos.`);

    let images64Promises;

    if (photoType == consts.PHOTO_TYPE_DATA) {
      images64Promises = photos.map((photo) => "");
    } else if (photoType == consts.PHOTO_TYPE_THUMBNAIL) {
      console.log("Retrieving thumbnail photos from disk.");
      images64Promises = photos.map((photo) => {
        return getThumbnailPhotoFromDisk(photo.serverPath);
      });
    } else if (photoType == consts.PHOTO_TYPE_COMPRESSED) {
      console.log("Retrieving compressed photos from disk.");
      images64Promises = photos.map((photo) => {
        return getCompressedPhotoFromDisk(photo.serverPath);
      });
    } else {
      //PHOTO_TYPE_ORIGINAL
      console.log("Retrieving original photos from disk.");
      images64Promises = photos.map((photo) => {
        return getOriginalPhotoFromDisk(photo.serverPath);
      });
    }

    const images64 = await Promise.all(images64Promises);

    const photosWithImage64 = photos.map((photo, index) => {
      return responseFormatter.createPhotoObject(photo, images64[index]);
    });

    console.log("Photos retrieved from disk if needed.");
    const jsonResponse = {
      endReached: endReached,
      number: photosWithImage64.length,
      photos: photosWithImage64,
    };

    console.log("Sending response data.");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "number", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "offset", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "photoType", "string")) return true;
  if (!consts.PHOTO_TYPES.includes(req.body.photoType)) return true;

  return false;
}

export default { endpoint: endpoint, callback: callback, method: "post" };
