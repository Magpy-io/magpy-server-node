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
    console.log('#assertAuthorizationHeader middleware');

    if (req.tokenError) {
      return responseFormatter.sendFailedMessage(
        res,
        req.tokenError.message,
        req.tokenError.code,
      );
    }
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default combineMiddleware([checkAuthorizationHeader, assertAuthorizationHeader]);
