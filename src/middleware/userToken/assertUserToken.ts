import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { combineMiddleware } from '../../modules/functions';
import { ExtendedRequest } from '../../api/endpointsLoader';
import checkUserToken from './checkUserToken';

async function assertUserToken(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#assertUserToken middleware');

    if (req.userIdError) {
      return responseFormatter.sendFailedMessage(
        res,
        req.userIdError.message,
        req.userIdError.code,
      );
    }
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([checkUserToken, assertUserToken]);
