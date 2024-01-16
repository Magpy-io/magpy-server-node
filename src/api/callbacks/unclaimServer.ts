import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";

import { ClearServerCredentials } from "../../modules/serverDataManager";
import {
  DeleteServerPost,
  DeleteServerResponseType,
} from "../../modules/backendImportedQueries";
import checkConnexionLocal from "../../middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "../../middleware/checkServerHasValidCredentials";

import { UnclaimServer } from "../Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<UnclaimServer.ResponseData>();

const callback = async (
  req: Request,
  res: Response,
  body: UnclaimServer.RequestData
) => {
  try {
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

export default {
  endpoint: UnclaimServer.endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
  requestShema: UnclaimServer.RequestSchema,
};
