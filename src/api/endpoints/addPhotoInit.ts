import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import FilesWaiting from "@src/modules/waitingFiles";
import { getPhotoByClientPathFromDB } from "@src/db/sequelizeDb";
import { createServerImageName } from "@src/modules/diskFilesNaming";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { v4 as uuid } from "uuid";
import { postPhotoPartTimeout } from "@src/config/config";
import { Photo } from "@src/types/photoType";
import checkUserToken from "@src/middleware/checkUserToken";
import { checkPhotoExistsAndDeleteMissing } from "@src/modules/functions";

// addPhotoInit : initializes the transfer of a photo to the server
const endpoint = "/addPhotoInit";
const callback = async (req: Request, res: Response) => {
  console.log(`\n[addPhotoInit]`);
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      responseFormatter.sendFailedMessage(res);
      return;
    }
    console.log("Request parameters ok.");

    console.log(`path: ${req.body.path}`);

    const requestPhoto: RequestType = req.body;

    const photo: Photo = {
      id: "",
      name: requestPhoto.name,
      fileSize: requestPhoto.fileSize,
      width: requestPhoto.width,
      height: requestPhoto.height,
      date: requestPhoto.date,
      syncDate: "",
      clientPath: requestPhoto.path,
      serverPath: "",
      hash: "",
    };

    console.log(`Searching in db for photo with path: ${requestPhoto.path}`);

    const exists = await checkPhotoExistsAndDeleteMissing({
      clientPath: requestPhoto.path,
    });
    if (exists) {
      console.log("Photo exists in server.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        "Photo already added to server.",
        "PHOTO_EXISTS"
      );
    } else {
      console.log("Photo does not exist in server.");
      console.log("Creating syncDate and photoPath.");
      const image64Len = requestPhoto.image64Len;

      photo.syncDate = new Date(Date.now()).toJSON();

      photo.serverPath = await createServerImageName(photo);
      const id = uuid();

      FilesWaiting.set(id, {
        received: 0,
        image64Len: image64Len,
        dataParts: new Map<number, string>(),
        timeout: setTimeout(() => {
          console.log(`Photo transfer for id ${id} timed out.`);
          console.log(`Deleting pending transfer for id ${id}`);
          FilesWaiting.delete(id);
        }, postPhotoPartTimeout),
        photo: photo,
      });
      console.log("Sending response message.");
      return responseFormatter.sendResponse(res, { id: id });
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "name", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "fileSize", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "width", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "height", "number")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "date", "Date")) return true;
  if (checkReqBodyAttributeMissing(req, "image64Len", "number")) return true;

  return false;
}

type RequestType = {
  name: string;
  fileSize: number;
  width: number;
  height: number;
  path: string;
  date: string;
  image64Len: number;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
