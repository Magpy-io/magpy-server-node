import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { ExtendedRequest } from '../../api/endpointsLoader';

const checkAuthorizationHeader = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('#checkAuthorizationHeader middleware');
    const bearerHeader = req.headers['x-authorization'];

    if (!bearerHeader || typeof bearerHeader != 'string') {
      console.log('Error : No authorization header');
      req.tokenError = { message: 'Invalid authorization', code: 'AUTHORIZATION_MISSING' };
      next();
      return;
    }
    const [prefix, token] = bearerHeader.split(' ');

    if (!prefix || prefix != 'Bearer' || !token) {
      console.log('Error : authorization header wrong format');
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
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default checkAuthorizationHeader;
