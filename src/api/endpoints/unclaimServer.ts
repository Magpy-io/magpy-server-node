import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkUserToken from "@src/middleware/checkUserToken";
import { ClearServerCredentials } from "@src/modules/serverDataManager";
import {
  DeleteServerPost,
  ErrorBackendUnreachable,
  DeleteServerResponseType,
} from "@src/modules/backendImportedQueries";

// unclaimServer : removes server's credentials
const endpoint = "/unclaimServer";
const callback = async (req: Request, res: Response) => {
  console.log(`\n[unclaimServer]`);

  try {
    const userId = req.userId;
    console.log("Token verified, sending confirmation");

    await ClearServerCredentials();

    let ret: DeleteServerResponseType;
    try {
      ret = await DeleteServerPost();
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.log("Error requesting backend server");
        responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        console.error(err);
        responseFormatter.sendErrorMessage(res);
      }
      return;
    }

    if (!ret.ok) {
      console.error("error deleting server from backend");
      console.error(ret);
      responseFormatter.sendErrorMessage(res);
      return;
    }

    console.log("Server deleted from backend");

    responseFormatter.sendSuccessfulMessage(res, "Server unclaimed");
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
