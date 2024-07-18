import { NextFunction, Request, Response } from 'express';
import { isLoopback } from 'ip';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';
import { combineMiddleware } from '../../modules/functions';
import checkConnexionLocal from './checkConnexionLocal';

async function assertConnexionLocal(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#assertConnexionLocal middleware');

    if (!req.isConnexionLocal) {
      console.log('Request not from loopback');
      responseFormatter.sendFailedMessageMiddleware(
        res,
        'Request must be made using loopback address',
        'REQUEST_NOT_FROM_LOOPBACK',
      );
      return;
    }

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([checkConnexionLocal, assertConnexionLocal]);
