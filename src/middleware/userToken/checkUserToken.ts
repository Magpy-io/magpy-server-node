import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../../api/responseFormatter';
import { combineMiddleware } from '../../modules/functions';
import { verifyUserToken } from '../../modules/tokenManagement';
import checkAuthorizationHeader from '../authorizationHeader/checkAuthorizationHeader';
import { ExtendedRequest } from '../../api/endpointsLoader';
import { GetServerSigningKey, IsServerClaimedAny } from '../../modules/serverDataManager';

async function checkUserToken(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#checkUserToken middleware');

    if (req.tokenError) {
      req.userIdError = req.tokenError;
      next();
      return;
    }

    const token = req.token;

    if (!token) {
      throw new Error('Token undefined in checkUserToken');
    }

    if (!IsServerClaimedAny()) {
      console.log('server is not claimed');
      req.userIdError = { message: 'Server not claimed', code: 'SERVER_NOT_CLAIMED' };
      next();
      return;
    }

    const serverSigningKey = GetServerSigningKey();

    if (!serverSigningKey) {
      console.log('User token verification failed because to server signing key was found.');
      req.userIdError = {
        message: 'User token verification failed',
        code: 'AUTHORIZATION_FAILED',
      };
      next();
      return;
    }

    const ret = verifyUserToken(token, serverSigningKey);

    if (!ret.ok) {
      if (ret.error == 'TOKEN_EXPIRED_ERROR') {
        console.log('User Token expired');
        console.log(ret);
        req.userIdError = {
          message: 'User token expired',
          code: 'AUTHORIZATION_EXPIRED',
        };
        next();
        return;
      } else {
        console.log('Invalid user Token');
        console.log(ret);
        req.userIdError = {
          message: 'User token verification failed',
          code: 'AUTHORIZATION_FAILED',
        };
        next();
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

export default combineMiddleware([checkAuthorizationHeader, checkUserToken]);
