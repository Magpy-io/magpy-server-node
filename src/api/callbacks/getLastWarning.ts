import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";

import checkUserToken from "../../middleware/checkUserToken";
import { GetLastWarningForUser } from "../../modules/warningsManager";

import { GetLastWarning } from "../Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetLastWarning.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const userId = req.userId;

    const warning = GetLastWarningForUser(userId);

    const jsonResponse = {
      warning: warning ? warning : null,
    };
    console.log("Warning found, sending response");
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetLastWarning.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: GetLastWarning.RequestSchema,
};
