import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { combineMiddleware } from '../../modules/functions';
import { ExtendedRequest } from '../../api/endpointsLoader';
import checkUserToken from './checkUserToken';

async function assertUserToken(req: ExtendedRequest, res: Response, next: NextFunction) {
  req.logger?.middleware('assertUserToken');

  if (req.userIdError) {
    req.logger?.debug('Error userId: ' + JSON.stringify(req.userIdError));
    return responseFormatter.sendFailedMessageMiddleware(
      req,
      res,
      req.userIdError.message,
      req.userIdError.code,
    );
  }
  next();
}

export default combineMiddleware([checkUserToken, assertUserToken]);
