import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import { UpdateServerDataPost } from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";
import { SaveServerName } from "@src/modules/serverDataManager";

// updateServerName : sets server name
const endpoint = "/updateServerName";
const callback = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      console.log("Nothing to update, sending response");
      responseFormatter.sendSuccessfulMessage(res, "Nothing to update");
      return;
    }

    if (name.length < 3 || name.length > 70) {
      console.log("invalid name");
      responseFormatter.sendFailedMessage(res);
      return;
    }

    await SaveServerName(name);

    if (req.hasValidCredentials) {
      const ret = await UpdateServerDataPost({ name: name });

      if (!ret.ok) {
        console.log("Error saving server name");
        console.log(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }
    }
    responseFormatter.sendSuccessfulMessage(res, "Server name changed");
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
};
