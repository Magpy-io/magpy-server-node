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
    console.log("#CheckServerIsClaimed middleware");
    if (!req.hasValidCredentials) {
      console.log("server is not claimed");
      req.isClaimed = false;
      next();
      return;
    }

    const ret = await getServerInfoPost();

    if (!ret.ok) {
      throw new Error("Error retrieving server info. " + JSON.stringify(ret));
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
