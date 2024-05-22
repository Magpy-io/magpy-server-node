import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { combineMiddleware } from '../modules/functions';
import { verifyUserToken } from '../modules/tokenManagement';
import verifyAuthorizationHeader from './verifyAuthorizationHeader';
import { ExtendedRequest } from '../api/endpointsLoader';
import {
  GetServerCredentials,
  GetServerSigningKey,
  IsServerClaimedRemote,
} from '../modules/serverDataManager';

async function checkUserToken(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#VerifyServerToken middleware');

    const token = req.token;

    if (!token) {
      throw new Error('Token undefined in checkUserToken');
    }

    if (!IsServerClaimedRemote()) {
      console.log('server is not claimed');
      return responseFormatter.sendFailedMessage(
        res,
        'Server not claimed',
        'SERVER_NOT_CLAIMED',
      );
    }

    const serverSigningKey = GetServerSigningKey();

    if (!serverSigningKey) {
      console.log('User token verification failed because to server signing key was found.');
      return responseFormatter.sendFailedMessage(
        res,
        'User token verification failed',
        'AUTHORIZATION_FAILED',
      );
    }

    const ret = verifyUserToken(token, serverSigningKey);

    if (!ret.ok) {
      if (ret.error == 'TOKEN_EXPIRED_ERROR') {
        console.log('User Token expired');
        console.log(ret);
        responseFormatter.sendFailedMessage(
          res,
          'User token expired',
          'AUTHORIZATION_EXPIRED',
        );
        return;
      } else {
        console.log('Invalid user Token');
        console.log(ret);
        responseFormatter.sendFailedMessage(
          res,
          'User token verification failed',
          'AUTHORIZATION_FAILED',
        );
        return;
      }
    }

    req.userId = ret.data.id;
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([verifyAuthorizationHeader, checkUserToken]);
