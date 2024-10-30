import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';

const checkAuthorizationHeader = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.logger?.middleware('checkAuthorizationHeader');

    const bearerHeader = req.headers['x-authorization'];

    if (!bearerHeader || typeof bearerHeader != 'string') {
      req.logger?.debug('No authorization header');
      req.tokenError = { message: 'Invalid authorization', code: 'AUTHORIZATION_MISSING' };
      next();
      return;
    }
    const [prefix, token] = bearerHeader.split(' ');

    if (!prefix || prefix != 'Bearer' || !token) {
      req.logger?.debug('Authorization header wrong format');
      req.tokenError = {
        message: 'Invalid authorization',
        code: 'AUTHORIZATION_WRONG_FORMAT',
      };
      next();
      return;
    }

    req.token = token;
    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default checkAuthorizationHeader;
