import { Request, Response } from "express";

import responseFormatter from "@src/api/responseFormatter";
import { addPhotoToDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import FilesWaiting, { FilesWaitingType } from "@src/modules/waitingFiles";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { hashFile } from "@src/modules/hashing";
import Joi from "joi";
import { postPhotoPartTimeout } from "@src/config/config";
import checkUserToken from "@src/middleware/checkUserToken";
import { AddPhotoPart } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<AddPhotoPart.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const partReceived: AddPhotoPart.RequestData = req.body;

    if (partReceived.partSize != partReceived.photoPart.length) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(
        res,
        "photoPart length and partSize do not match",
        "BAD_REQUEST"
      );
    }

    if (!FilesWaiting.has(partReceived.id)) {
      console.log(`No photo transfer for id ${partReceived.id} was found.`);
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        `No photo transfer for id ${partReceived.id} was found.`,
        "PHOTO_TRANSFER_NOT_FOUND"
      );
    }

    console.log(`Photo transfer for id ${partReceived.id} found.`);

    const photoWaiting = FilesWaiting.get(partReceived.id)!;
    photoWaiting.received += partReceived.partSize;
    photoWaiting.dataParts.set(partReceived.partNumber, partReceived.photoPart);

    if (photoWaiting.received < photoWaiting.image64Len) {
      console.log("Photo part added.");
      console.log("Reseting timeout.");

      clearTimeout(photoWaiting.timeout);
      photoWaiting.timeout = setTimeout(() => {
        console.log(`Photo transfer for id ${partReceived.id} timed out.`);
        console.log(`Deleting pending transfer for id ${partReceived.id}`);
        FilesWaiting.delete(partReceived.id);
      }, postPhotoPartTimeout);

      console.log("Sending response message.");
      return sendResponse(res, {
        lenReceived: photoWaiting.received,
        lenWaiting: photoWaiting.image64Len,
        done: false,
      });
    }

    if (photoWaiting.received > photoWaiting.image64Len) {
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
    }
    console.log("Full image received.");

    console.log("Removing timeout");
    clearTimeout(photoWaiting.timeout);

    if (!arePartsValid(photoWaiting.dataParts)) {
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

    const image64 = joinParts(photoWaiting.dataParts);

    const hash = hashFile(image64);
    photoWaiting.photo.hash = hash;

    console.log(`Deleting pending transfer for id ${partReceived.id}`);
    FilesWaiting.delete(partReceived.id);

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
      done: true,
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
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  partNumber: Joi.number().integer(),
  partSize: Joi.number().integer(),
  photoPart: Joi.string(),
}).options({ presence: "required" });

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
  endpoint: AddPhotoPart.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
