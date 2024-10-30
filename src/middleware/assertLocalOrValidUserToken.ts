import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { combineMiddleware } from '../modules/functions';
import { ExtendedRequest } from '../api/endpointsLoader';
import checkUserToken from './userToken/checkUserToken';
import checkConnexionLocal from './connexionLocal/checkConnexionLocal';

async function assertLocalOrValidUserToken(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    req.logger?.middleware('assertLocalOrValidUserToken');
    if (!req.isConnexionLocal && !req.userId) {
      req.logger?.debug('Request not from loopback and no valid token');
      return responseFormatter.sendFailedMessageMiddleware(
        req,
        res,
        'Request must be made using loopback address or with a valid token',
        'AUTHORIZATION_FAILED',
      );
    }

    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}

export default combineMiddleware([
  checkUserToken,
  checkConnexionLocal,
  assertLocalOrValidUserToken,
]);
