import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import Joi from "joi";
import checkUserToken from "@src/middleware/checkUserToken";
import { GetLastWarningForUser } from "@src/modules/warningsManager";

import { GetLastWarning } from "@src/api/types";

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

const RequestDataShema = Joi.object({}).options({ presence: "required" });
export default {
  endpoint: GetLastWarning.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
