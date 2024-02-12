import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { GetServerConfigData } from '../modules/serverDataManager';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerHasCredentials(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
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
