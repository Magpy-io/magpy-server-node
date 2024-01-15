import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { updatePhotoClientPathById } from "@src/db/sequelizeDb";

import Joi from "joi";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";

import { UpdatePhotoPath } from "@src/api/types";

const sendResponse =
  responseFormatter.getCustomSendResponse<UpdatePhotoPath.ResponseData>();

const callback = async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new Error("UserId is not defined.");
  }

  const { id, path, deviceUniqueId }: UpdatePhotoPath.RequestData = req.body;

  try {
    console.log(`Searching in db for photo with id: ${id}`);

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: id,
    });

    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted([ret.deleted], req.userId);
    }

    if (!ret.exists) {
      console.log("Photo does not exist in server.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        `Photo with id ${id} not found in server`,
        "ID_NOT_FOUND",
        warning
      );
    } else {
      console.log("Photo found");

      console.log("Photo path does not exist in db");
      console.log("Updating path in db");
      await updatePhotoClientPathById(id, path, deviceUniqueId);

      console.log("Photo updated successfully.");
      console.log("Sending response message.");
      return sendResponse(
        res,
        `Photo with id ${id} successfully updated with new path`
      );
    }
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }),
  path: Joi.string(),
  deviceUniqueId: Joi.string().uuid({ version: "uuidv4" }),
}).options({ presence: "required" });

export default {
  endpoint: UpdatePhotoPath.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
