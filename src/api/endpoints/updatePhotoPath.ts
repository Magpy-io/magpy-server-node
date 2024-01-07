import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { updatePhotoClientPathById } from "@src/db/sequelizeDb";

import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import checkUserToken from "@src/middleware/checkUserToken";
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";

import {
  UpdatePhotoPathRequestData,
  UpdatePhotoPathResponseData,
} from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<UpdatePhotoPathResponseData>();

// updatePhotoPath : updates the path of a photo in db
const endpoint = "/updatePhotoPath";
const callback = async (req: Request, res: Response) => {
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

  const { id, path }: UpdatePhotoPathRequestData = req.body;

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
      await updatePhotoClientPathById(id, path);

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

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;

  return false;
}

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
