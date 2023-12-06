import { Request, Response } from "express";

import responseFormatter from "@src/api/responseFormatter";
import {
  getPhotoByClientPathFromDB,
  addPhotoToDB,
} from "@src/db/databaseFunctions";
import waitingFiles from "@src/modules/waitingFiles";
import { addPhotoToDisk } from "@src/modules/diskManager";
import { hashString } from "@src/modules/hashing";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { hashLen, postPhotoPartTimeout } from "@src/config/config";

// addPhotoPart : adds a part of a photo to the server
const endpoint = "/addPhotoPart";
const callback = async (req, res) => {
  console.log(`\n[addPhotoPart]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }

  console.log(`id: ${req.body.id}, part number: ${req.body.partNumber}`);

  const partReceived = req.body;

  if (partReceived.partSize != partReceived.photoPart.length) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(
      res,
      "photoPart length and partSize do not match"
    );
    return;
  }

  console.log("Request parameters ok.");

  try {
    if (partReceived.id in waitingFiles.FilesWaiting) {
      console.log(`Photo transfer for id ${partReceived.id} found.`);
      const photoWaiting = waitingFiles.FilesWaiting[partReceived.id];
      photoWaiting.received += partReceived.partSize;
      photoWaiting.dataParts[partReceived.partNumber] = partReceived.photoPart;

      if (photoWaiting.received < photoWaiting.image64Len) {
        console.log("Photo part added.");
        console.log("Reseting timeout.");

        clearTimeout(photoWaiting.timeout);
        photoWaiting.timeout = setTimeout(() => {
          console.log(`Photo transfer for id ${partReceived.id} timed out.`);
          console.log(`Deleting pending transfer for id ${partReceived.id}`);
          delete waitingFiles.FilesWaiting[partReceived.id];
        }, postPhotoPartTimeout);

        console.log("Sending response message.");
        responseFormatter.sendSuccessfulMessage(
          res,
          "Photo part added successfully"
        );
      } else if (photoWaiting.received > photoWaiting.image64Len) {
        console.log(
          `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`
        );

        console.log(`Deleting pending transfer for id ${partReceived.id}`);
        clearTimeout(photoWaiting.timeout);
        delete waitingFiles.FilesWaiting[partReceived.id];

        console.log("Sending response message.");
        return responseFormatter.sendFailedMessage(
          res,
          `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
          "BAD_REQUEST"
        );
      } else {
        console.log("Full image received.");

        console.log("Removing timeout");
        clearTimeout(photoWaiting.timeout);

        if (arePartsValid(photoWaiting.dataParts)) {
          const image64 = joinParts(photoWaiting.dataParts);

          const hash = hashString(image64, hashLen);
          photoWaiting.photo.hash = hash;

          const exists = await getPhotoByClientPathFromDB(
            photoWaiting.photo.path
          );

          if (exists) {
            console.log("Photo exists in server.");

            console.log(`Deleting pending transfer for id ${partReceived.id}`);
            clearTimeout(photoWaiting.timeout);
            delete waitingFiles.FilesWaiting[partReceived.id];

            console.log("Sending response message.");
            responseFormatter.sendFailedMessage(
              res,
              "Photo already added to server.",
              "PHOTO_EXISTS"
            );
          } else {
            const dbPhoto = await addPhotoToDB(
              photoWaiting.photo,
              partReceived.id
            );

            console.log("Photo added successfully to db.");
            console.log("Adding photo to disk.");
            await addPhotoToDisk(
              image64,
              dbPhoto.width,
              dbPhoto.height,
              dbPhoto.serverPath
            );

            console.log("Photo added to disk.");

            console.log(`Deleting pending transfer for id ${partReceived.id}`);
            delete waitingFiles.FilesWaiting[partReceived.id];

            const jsonResponse = {
              photo: responseFormatter.createPhotoObject(dbPhoto, ""),
            };
            console.log("Sending response message.");
            responseFormatter.sendResponse(res, jsonResponse);
          }
        } else {
          console.log(`Deleting pending transfer for id ${partReceived.id}`);
          clearTimeout(photoWaiting.timeout);
          delete waitingFiles.FilesWaiting[partReceived.id];

          console.log("Sending response message.");
          return responseFormatter.sendFailedMessage(
            res,
            `Not all parts were found`,
            "BAD_REQUEST"
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
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "partNumber", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "partSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "photoPart", "string")) return true;
  return false;
}

function arePartsValid(parts) {
  const totalNumberOfParts = Object.keys(parts).length;

  for (let i = 0; i < totalNumberOfParts; i++) {
    if (!(i.toString() in parts)) {
      return false;
    }
  }
  return true;
}

function joinParts(parts) {
  const totalNumberOfParts = Object.keys(parts).length;

  let ret = "";
  for (let i = 0; i < totalNumberOfParts; i++) {
    ret = ret.concat(parts[i]);
  }
  return ret;
}

export default { endpoint: endpoint, callback: callback, method: "post" };
