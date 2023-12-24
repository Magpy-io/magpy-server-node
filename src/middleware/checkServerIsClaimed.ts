import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";
import { combineMiddleware } from "@src/modules/functions";
import { getServerInfoPost } from "@src/modules/backendImportedQueries";

async function checkServerIsClaimed(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("\n#CheckServerIsClaimed middleware");
    if (!req.hasValidCredentials) {
      console.log("server is not claimed");
      req.isClaimed = false;
      next();
      return;
    }

    const ret = await getServerInfoPost();

    if (!ret.ok) {
      console.log("Error retrieving server info");
      console.log(ret);
      responseFormatter.sendErrorMessage(res);
      return;
    }

    if (ret.data.server.owner == null) {
      console.log("server is not claimed");
      req.isClaimed = false;
      next();
      return;
    }

    console.log("server is claimed");
    req.isClaimed = true;

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([
  checkServerHasValidCredentials,
  checkServerIsClaimed,
]);
