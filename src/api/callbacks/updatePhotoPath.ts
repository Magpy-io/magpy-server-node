import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";
import { updatePhotoClientPathById } from "../../db/sequelizeDb";

import checkUserToken from "../../middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "../../modules/functions";

import { UpdatePhotoPath } from "../Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<UpdatePhotoPath.ResponseData>();

const callback = async (
  req: Request,
  res: Response,
  body: UpdatePhotoPath.RequestData
) => {
  if (!req.userId) {
    throw new Error("UserId is not defined.");
  }

  const { id, path, deviceUniqueId } = body;

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

export default {
  endpoint: UpdatePhotoPath.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: UpdatePhotoPath.RequestSchema,
};
