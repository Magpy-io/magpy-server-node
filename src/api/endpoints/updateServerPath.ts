import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkConnexionLocal from "@src/middleware/checkConnexionLocal";

import { SaveStorageFolderPath } from "@src/modules/serverDataManager";
import { folderValid } from "@src/modules/diskManager";

// updateServerPath : sets server name
const endpoint = "/updateServerPath";
const callback = async (req: Request, res: Response) => {
  try {
    const { path } = req.body;

    if (!path) {
      console.log("Nothing to update, sending response");
      responseFormatter.sendSuccessfulMessage(res, "Nothing to update");
      return;
    }

    if (!(await folderValid(path))) {
      console.log("invalid path");
      responseFormatter.sendFailedMessage(
        res,
        "Cannot reach given path",
        "PATH_ACCESS_DENIED"
      );
      return;
    }

    await SaveStorageFolderPath(path);

    responseFormatter.sendSuccessfulMessage(res, "Server path changed");
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal],
};
