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
    console.log('#assertLocalOrValidUserToken middleware');

    if (!req.isConnexionLocal && !req.userId) {
      console.log('Request not from loopback and no valid token');
      return responseFormatter.sendFailedMessage(
        res,
        'Request must be made using loopback address or with a valid token',
        'AUTHORIZATION_FAILED',
      );
    }

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([
  checkUserToken,
  checkConnexionLocal,
  assertLocalOrValidUserToken,
]);
