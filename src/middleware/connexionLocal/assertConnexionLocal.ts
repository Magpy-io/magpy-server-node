import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';
import { combineMiddleware } from '../../modules/functions';
import checkConnexionLocal from './checkConnexionLocal';

async function assertConnexionLocal(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    req.logger?.middleware('assertConnexionLocal');

    if (!req.isConnexionLocal) {
      req.logger?.debug('Request not from loopback');
      responseFormatter.sendFailedMessageMiddleware(
        req,
        res,
        'Request must be made using loopback address',
        'REQUEST_NOT_FROM_LOOPBACK',
      );
      return;
    }

    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}

export default combineMiddleware([checkConnexionLocal, assertConnexionLocal]);
