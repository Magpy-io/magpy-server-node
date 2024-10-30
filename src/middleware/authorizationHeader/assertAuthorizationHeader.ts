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
  try {
    req.logger?.middleware('assertAuthorizationHeader');

    if (req.tokenError) {
      req.logger?.debug('Error invalid token');
      return responseFormatter.sendFailedMessageMiddleware(
        res,
        req.tokenError.message,
        req.tokenError.code,
      );
    }

    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default combineMiddleware([checkAuthorizationHeader, assertAuthorizationHeader]);
