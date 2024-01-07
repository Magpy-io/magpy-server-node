import { Request, Response } from "express";

import responseFormatter from "@src/api/responseFormatter";
import { addPhotoToDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import FilesWaiting, { FilesWaitingType } from "@src/modules/waitingFiles";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { hashFile } from "@src/modules/hashing";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { postPhotoPartTimeout } from "@src/config/config";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";

// addPhotoPart : adds a part of a photo to the server
const endpoint = "/addPhotoPart";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res);
    }

    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const partReceived: RequestType = req.body;

    if (partReceived.partSize != partReceived.photoPart.length) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(
        res,
        "photoPart length and partSize do not match",
        "BAD_REQUEST"
      );
    }

    console.log("Request parameters ok.");

    if (FilesWaiting.has(partReceived.id)) {
      console.log(`Photo transfer for id ${partReceived.id} found.`);
      const photoWaiting = FilesWaiting.get(
        partReceived.id
      ) as FilesWaitingType;
      photoWaiting.received += partReceived.partSize;
      photoWaiting.dataParts.set(
        partReceived.partNumber,
        partReceived.photoPart
      );

      if (photoWaiting.received < photoWaiting.image64Len) {
        console.log("Photo part added.");
        console.log("Reseting timeout.");

        clearTimeout(photoWaiting.timeout);
        photoWaiting.timeout = setTimeout(() => {
          console.log(`Photo transfer for id ${partReceived.id} timed out.`);
          console.log(`Deleting pending transfer for id ${partReceived.id}`);
          FilesWaiting.delete(partReceived.id);
        }, postPhotoPartTimeout);

        const jsonResponse = {
          lenReceived: photoWaiting.received,
          lenWaiting: photoWaiting.image64Len,
          photo: responseFormatter.createPhotoObject(photoWaiting.photo, ""),
        };
        console.log("Sending response message.");
        return responseFormatter.sendResponse(res, jsonResponse);
      } else if (photoWaiting.received > photoWaiting.image64Len) {
        console.log(
          `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`
        );

        console.log(`Deleting pending transfer for id ${partReceived.id}`);
        clearTimeout(photoWaiting.timeout);
        FilesWaiting.delete(partReceived.id);

        console.log("Sending response message.");
        return responseFormatter.sendFailedMessage(
          res,
          `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
          "PHOTO_SIZE_EXCEEDED"
        );
      } else {
        console.log("Full image received.");

        console.log("Removing timeout");
        clearTimeout(photoWaiting.timeout);

        if (arePartsValid(photoWaiting.dataParts)) {
          const image64 = joinParts(photoWaiting.dataParts);

          const hash = hashFile(image64);
          photoWaiting.photo.hash = hash;

          console.log(`Deleting pending transfer for id ${partReceived.id}`);
          FilesWaiting.delete(partReceived.id);

          photoWaiting.photo.id = partReceived.id;
          const dbPhoto = await addPhotoToDB(photoWaiting.photo);

          console.log("Photo added successfully to db.");

          try {
            console.log("Adding photo to disk.");
            await addPhotoToDisk(dbPhoto, image64);
          } catch (err) {
            console.log("Could not add photo to disk, removing photo from db");
            await deletePhotoByIdFromDB(dbPhoto.id);
            throw err;
          }

          console.log("Photo added to disk.");

          const jsonResponse = {
            lenReceived: photoWaiting.received,
            lenWaiting: photoWaiting.image64Len,
            photo: responseFormatter.createPhotoObject(dbPhoto, ""),
          };
          console.log("Sending response message.");
          return responseFormatter.sendResponse(res, jsonResponse);
        } else {
          console.log(`Deleting pending transfer for id ${partReceived.id}`);
          clearTimeout(photoWaiting.timeout);
          FilesWaiting.delete(partReceived.id);

          console.log("Sending response message.");
          return responseFormatter.sendFailedMessage(
            res,
            `Not all parts were found`,
            "MISSING_PARTS"
          );
        }
      }
    } else {
      console.log(`No photo transfer for id ${partReceived.id} was found.`);
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        `No photo transfer for id ${partReceived.id} was found.`,
        "PHOTO_TRANSFER_NOT_FOUND"
      );
    }
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "partNumber", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "partSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "photoPart", "string")) return true;
  return false;
}

type RequestType = {
  id: string;
  partNumber: number;
  partSize: number;
  photoPart: string;
};

function arePartsValid(parts: Map<number, string>) {
  const totalNumberOfParts = parts.size;

  for (let i = 0; i < totalNumberOfParts; i++) {
    if (!parts.has(i)) {
      return false;
    }
  }
  return true;
}

function joinParts(parts: Map<number, string>) {
  const totalNumberOfParts = parts.size;

  let ret = "";
  for (let i = 0; i < totalNumberOfParts; i++) {
    ret = ret.concat(parts.get(i) as string);
  }
  return ret;
}

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
