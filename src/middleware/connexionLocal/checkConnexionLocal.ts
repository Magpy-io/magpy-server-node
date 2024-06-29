import { NextFunction, Request, Response } from 'express';
import { isLoopback } from 'ip';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';

async function checkConnexionLocal(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#CheckConnexionLocal middleware');

    if (!req.ip) {
      console.log('Could not get ip from request');
      return responseFormatter.sendFailedMessage(
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

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default checkConnexionLocal;
