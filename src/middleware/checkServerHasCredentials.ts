import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import { GetServerData } from "@src/modules/serverDataManager";

async function checkServerHasCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    req.serverData = await GetServerData();
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default checkServerHasCredentials;
