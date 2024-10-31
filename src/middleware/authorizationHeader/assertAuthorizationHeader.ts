import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';
import { combineMiddleware } from '../../modules/functions';
import checkAuthorizationHeader from './checkAuthorizationHeader';

const assertAuthorizationHeader = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  req.logger?.middleware('assertAuthorizationHeader');

  if (req.tokenError) {
    req.logger?.debug('Error invalid token');
    return responseFormatter.sendFailedMessageMiddleware(
      req,
      res,
      req.tokenError.message,
      req.tokenError.code,
    );
  }

  next();
};

export default combineMiddleware([checkAuthorizationHeader, assertAuthorizationHeader]);
