import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkUserToken from "@src/middleware/checkUserToken";

import { WhoAmI } from "@src/api/Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<WhoAmI.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new Error("UserId is not defined.");
    }

    const userId = req.userId;
    const jsonResponse = {
      user: { id: userId },
    };
    console.log("Token verified, sending confirmation");
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: WhoAmI.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: WhoAmI.RequestSchema,
};
