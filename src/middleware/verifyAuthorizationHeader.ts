import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { ExtendedRequest } from '../api/endpointsLoader';

const verifyAuthorizationHeader = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('#VerifyAuthorizationHeader middleware');
    const bearerHeader = req.headers['x-authorization'];

    if (!bearerHeader || typeof bearerHeader != 'string') {
      console.log('Error : No authorization header');
      responseFormatter.sendFailedMessage(
        res,
        'Invalid authorization',
        'AUTHORIZATION_MISSING',
      );
      return;
    }
    const [prefix, token] = bearerHeader.split(' ');

    if (!prefix || prefix != 'Bearer' || !token) {
      console.log('Error : authorization header wrong format');
      responseFormatter.sendFailedMessage(
        res,
        'Invalid authorization',
        'AUTHORIZATION_WRONG_FORMAT',
      );
      return;
    }

    req.token = token;

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default verifyAuthorizationHeader;
