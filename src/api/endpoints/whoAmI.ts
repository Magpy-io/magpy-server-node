import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkUserToken from "@src/middleware/checkUserToken";

import Joi from "joi";

import { WhoAmIResponseData } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<WhoAmIResponseData>();

// whoAmI : checks user token is valid
const endpoint = "/whoami";
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

const RequestDataShema = Joi.object({}).options({ presence: "required" });

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
