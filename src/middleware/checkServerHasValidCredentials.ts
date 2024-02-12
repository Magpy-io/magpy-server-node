import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { GetServerInfo, GetServerToken, TokenManager } from '../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../modules/BackendQueries/ExceptionsManager';
import { combineMiddleware } from '../modules/functions';
import { SaveServerCredentials } from '../modules/serverDataManager';
import checkServerHasCredentials from './checkServerHasCredentials';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerHasValidCredentials(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('#CheckServerHasValidCredentials middleware');
    const serverData = req.serverData;

    if (serverData?.serverToken) {
      console.log('server token found');

      let ret: GetServerInfo.ResponseType;
      try {
        TokenManager.SetServerToken(serverData.serverToken);
        ret = await GetServerInfo.Post();
      } catch (err) {
        if (err instanceof ErrorBackendUnreachable) {
          console.log('Error requesting backend server');
          responseFormatter.sendErrorBackEndServerUnreachable(res);
        } else {
          throw err;
        }
        return;
      }

      if (!ret.ok) {
        if (
          ret.errorCode == 'AUTHORIZATION_FAILED' ||
          ret.errorCode == 'AUTHORIZATION_EXPIRED'
        ) {
          console.log('Invalid server token');
        } else {
          throw new Error('request to get server info failed. ' + JSON.stringify(ret));
        }
      } else {
        console.log('server has valid credentials');
        req.hasValidCredentials = true;
        next();
        return;
      }
    }

    if (serverData?.serverId && serverData?.serverKey) {
      console.log('server credentials found');

      let ret: GetServerToken.ResponseType;
      try {
        ret = await GetServerToken.Post({
          id: serverData.serverId,
          key: serverData.serverKey,
        });
      } catch (err) {
        if (err instanceof ErrorBackendUnreachable) {
          console.log('Error requesting backend server');
          responseFormatter.sendErrorBackEndServerUnreachable(res);
        } else {
          throw err;
        }
        return;
      }

      if (!ret.ok) {
        if (ret.errorCode == 'INVALID_CREDENTIALS') {
          console.log('invalid server credentials');
        } else {
          throw new Error(
            'request to verify server credentials failed. ' + JSON.stringify(ret),
          );
        }
      } else {
        console.log('server claimed, it has valid credentials');
        const serverToken = TokenManager.GetServerToken();

        console.log('saving server token');
        await SaveServerCredentials({
          serverToken: serverToken,
        });

        console.log('server has valid credentials');
        req.hasValidCredentials = true;
        next();
        return;
      }
    }

    req.hasValidCredentials = false;
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([checkServerHasCredentials, checkServerHasValidCredentials]);
