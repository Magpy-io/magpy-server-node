import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import { UpdateServerDataPost } from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";
import { SaveServerName } from "@src/modules/serverDataManager";

import { UpdateServerName } from "@src/api/Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<UpdateServerName.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    const { name }: UpdateServerName.RequestData = req.body;

    if (!name) {
      console.log("Nothing to update, sending response");
      return sendResponse(res, "Nothing to update");
    }

    if (name.length < 3 || name.length > 70) {
      console.log("Invalid name");
      return responseFormatter.sendFailedMessage(
        res,
        "Name too short or too long",
        "INVALID_NAME"
      );
    }

    if (!/^[a-zA-Z0-9 \-_]+$/.test(name)) {
      console.log("Invalid name");
      return responseFormatter.sendFailedMessage(
        res,
        "Name can only contain alphanumeric characters, whitespaces, -, and _",
        "INVALID_NAME"
      );
    }

    await SaveServerName(name);

    if (req.hasValidCredentials) {
      const ret = await UpdateServerDataPost({ name: name });

      if (!ret.ok) {
        throw new Error("Error saving server name. " + JSON.stringify(ret));
      }
    }
    return sendResponse(res, "Server name changed");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: UpdateServerName.endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
  requestShema: UpdateServerName.RequestSchema,
};
