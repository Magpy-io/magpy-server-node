import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import { ClearServerCredentials } from "@src/modules/serverDataManager";
import {
  DeleteServerPost,
  DeleteServerResponseType,
} from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";

// unclaimServer : removes server's credentials
const endpoint = "/unclaimServer";
const callback = async (req: Request, res: Response) => {
  try {
    if (req.hasValidCredentials) {
      let ret: DeleteServerResponseType | undefined;
      try {
        ret = await DeleteServerPost();
      } catch (err) {
        console.log("error deleting server from backend");
        console.log(err);
      }

      if (!ret?.ok) {
        console.log("error deleting server from backend");
        console.log(ret);
      } else {
        console.log("Server deleted from backend");
      }
    }

    await ClearServerCredentials();

    return responseFormatter.sendSuccessfulMessage(res, "Server unclaimed");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
};
