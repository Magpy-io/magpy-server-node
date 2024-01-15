import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotoByIdFromDB } from "@src/db/sequelizeDb";
import { getPhotoFromDisk } from "@src/modules/diskManager";

import Joi from "joi";
import { getNumberOfParts, getPartN } from "@src/modules/stringHelper";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";

import { GetPhotoPartById } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetPhotoPartById.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    const requestParameters: GetPhotoPartById.RequestData = req.body;

    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const { id, part } = requestParameters;

    console.log("Checking photo exists");

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: id,
    });
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted([ret.deleted], req.userId);
    }

    if (!ret.exists) {
      console.log("Photo not found in db.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        `Photo with id: ${id} not found`,
        "ID_NOT_FOUND",
        warning
      );
    } else {
      console.log("Photo found in db.");
      console.log(`Getting photo with id = ${id} from db.`);
      const dbPhoto = await getPhotoByIdFromDB(id);

      if (!dbPhoto) {
        throw new Error(
          "getPhotoPartById: photo exists but cannot retrieve from db"
        );
      }

      console.log("Retrieving photo from disk.");
      const image64 = await getPhotoFromDisk(dbPhoto, "original");
      console.log("Photo retrieved.");
      console.log("Sending response data.");

      const totalNbOfParts = getNumberOfParts(image64);

      if (0 <= part && part < totalNbOfParts) {
        const ImagePart = getPartN(image64, part);
        const jsonResponse = {
          photo: responseFormatter.createPhotoObject(dbPhoto, ImagePart),
          part: part,
          totalNbOfParts: totalNbOfParts,
        };
        return sendResponse(res, jsonResponse);
      } else {
        console.log(
          `Part number ${part} must be between 0 and ${
            totalNbOfParts - 1
          } included`
        );
        console.log("Sending response message.");
        return responseFormatter.sendFailedMessage(
          res,
          `Part number ${part} must be between 0 and ${
            totalNbOfParts - 1
          } included`,
          "INVALID_PART_NUMBER"
        );
      }
    }
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  part: Joi.number().integer(),
}).options({ presence: "required" });

export default {
  endpoint: GetPhotoPartById.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
