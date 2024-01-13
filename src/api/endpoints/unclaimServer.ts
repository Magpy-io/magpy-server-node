import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import Joi from "joi";
import { ClearServerCredentials } from "@src/modules/serverDataManager";
import {
  DeleteServerPost,
  DeleteServerResponseType,
} from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";

import { UnclaimServer } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<UnclaimServer.ResponseData>();

// unclaimServer : removes server's credentials
const endpoint = "/unclaimServer";
const callback = async (req: Request, res: Response) => {
  try {
    const { error } = RequestDataShema.validate(req.body);
    if (error) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res, error.message);
    }

    if (req.hasValidCredentials) {
      let ret: DeleteServerResponseType | undefined;
      try {
        ret = await DeleteServerPost();
      } catch (err) {
        console.error("error deleting server from backend");
        console.error(err);
      }

      if (!ret?.ok) {
        console.error("error deleting server from backend");
        console.error(ret);
      } else {
        console.log("Server deleted from backend");
      }
    }

    await ClearServerCredentials();

    return sendResponse(res, "Server unclaimed");
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
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
};
