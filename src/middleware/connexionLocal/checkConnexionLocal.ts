import { NextFunction, Request, Response } from 'express';
import { isLoopback } from 'ip';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';

async function checkConnexionLocal(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    req.logger?.middleware('CheckConnexionLocal');

    if (!req.ip) {
      req.logger?.warn('Could not get ip from request');
      return responseFormatter.sendFailedMessageMiddleware(
        req,
        res,
        'Request must be made using loopback address',
        'COULD_NOT_GET_REQUEST_ADDRESS',
      );
    }

    if (!isLoopback(req.ip)) {
      req.isConnexionLocal = false;
    } else {
      req.isConnexionLocal = true;
    }

    req.logger?.debug(req.isConnexionLocal ? 'Request from local' : 'Request not from local');

    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}

export default checkConnexionLocal;
