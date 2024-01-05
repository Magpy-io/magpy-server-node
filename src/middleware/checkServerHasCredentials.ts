import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import { GetServerConfigData } from "@src/modules/serverDataManager";

async function checkServerHasCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("\n#CheckServerHasCredentials middleware");
    req.serverData = GetServerConfigData();
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default checkServerHasCredentials;
