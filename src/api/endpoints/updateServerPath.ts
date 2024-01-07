import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkConnexionLocal from "@src/middleware/checkConnexionLocal";

import { SaveStorageFolderPath } from "@src/modules/serverDataManager";
import { folderHasRights, pathExists } from "@src/modules/diskManager";

import { isAbsolutePath } from "@src/modules/functions";

import { UpdateServerPathRequestData } from "@src/api/export/exportedTypes";

// updateServerPath : sets server name
const endpoint = "/updateServerPath";
const callback = async (req: Request, res: Response) => {
  try {
    const { path }: UpdateServerPathRequestData = req.body;

    if (!path) {
      console.log("Nothing to update, sending response");
      return responseFormatter.sendSuccessfulMessage(res, "Nothing to update");
    }

    if (!isAbsolutePath(path)) {
      console.log("Invalid path, not an absolute path");
      return responseFormatter.sendFailedMessage(
        res,
        "Invalid path",
        "BAD_REQUEST"
      );
    }

    if (!(await pathExists(path))) {
      console.log("Invalid path, could not access the folder");
      return responseFormatter.sendFailedMessage(
        res,
        "Cannot reach the given path",
        "PATH_FOLDER_DOES_NOT_EXIST"
      );
    }

    if (!(await folderHasRights(path))) {
      console.log("Invalid path, could not access the folder");
      return responseFormatter.sendFailedMessage(
        res,
        "Cannot access the given path",
        "PATH_ACCESS_DENIED"
      );
    }

    await SaveStorageFolderPath(path);

    return responseFormatter.sendSuccessfulMessage(res, "Server path changed");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal],
};
