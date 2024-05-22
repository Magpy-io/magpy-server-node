import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import * as BackendQueries from '../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../modules/BackendQueries/ExceptionsManager';
import { combineMiddleware } from '../modules/functions';
import { SaveServerCredentials, SaveServerToken, GetServerToken, GetServerCredentials, IsServerClaimedRemote } from '../modules/serverDataManager';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerHasValidCredentials(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('#CheckServerHasValidCredentials middleware');

    if(!IsServerClaimedRemote()){
      req.hasValidCredentials = false;
      next();
      return;
    }

    const serverToken = GetServerToken();
    if (serverToken) {
      console.log('server token found');

      let ret: BackendQueries.GetServerInfo.ResponseType;
      try {
        BackendQueries.TokenManager.SetServerToken(serverToken);
        ret = await BackendQueries.GetServerInfo.Post();
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


    const serverCredentials = GetServerCredentials()

    if (
      !serverCredentials?.serverId ||
      !serverCredentials?.serverKey
    ) {
      throw new Error("Server is claimed but serverId or serverKey is missing.");
    }

      console.log('Server credentials found');

      let ret: BackendQueries.GetServerToken.ResponseType;
      try {
        ret = await BackendQueries.GetServerToken.Post({
          id: serverCredentials.serverId,
          key: serverCredentials.serverKey,
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
        const serverToken = BackendQueries.TokenManager.GetServerToken();

        console.log('saving server token');
        await SaveServerToken(serverToken);

        console.log('server has valid credentials');
        req.hasValidCredentials = true;
        next();
        return;
      }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default checkServerHasValidCredentials;
