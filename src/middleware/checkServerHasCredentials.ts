import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { GetServerConfigData } from '../modules/serverDataManager';

async function checkServerHasCredentials(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('#CheckServerHasCredentials middleware');
    req.serverData = GetServerConfigData();
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default checkServerHasCredentials;
