import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import Joi from "joi";
import checkUserToken from "@src/middleware/checkUserToken";
import { GetLastWarningForUser } from "@src/modules/warningsManager";

import { GetLastWarningResponseData } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetLastWarningResponseData>();

// getLastWarning : returns last generated warning for this user
const endpoint = "/getLastWarning";
const callback = async (req: Request, res: Response) => {
  try {
    const { error } = RequestDataShema.validate(req.body);
    if (error) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res, error.message);
    }

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
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
