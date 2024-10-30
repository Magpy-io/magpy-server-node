import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import * as BackendQueries from '../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../modules/BackendQueries/ExceptionsManager';
import { combineMiddleware } from '../modules/functions';
import {
  SaveServerCredentials,
  SaveServerToken,
  GetServerToken,
  GetServerCredentials,
  IsServerClaimedRemote,
  ClearServerCredentials,
} from '../modules/serverDataManager';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerHasValidCredentials(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    req.logger?.middleware('checkServerHasValidCredentials');

    if (!IsServerClaimedRemote()) {
      req.logger?.debug('Server not claimed');
      req.hasValidCredentials = false;
      next();
      return;
    }

    const serverToken = GetServerToken();

    if (serverToken) {
      let ret: BackendQueries.GetServerInfo.ResponseType;
      try {
        BackendQueries.TokenManager.SetServerToken(serverToken);
        ret = await BackendQueries.GetServerInfo.Post();
      } catch (err) {
        if (err instanceof ErrorBackendUnreachable) {
          req.logger?.error('Error requesting backend server unreachable');
          responseFormatter.sendErrorBackEndServerUnreachable(req, res);
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
          req.logger?.debug('Invalid server token');
        } else {
          throw new Error('request to get server info failed. ' + JSON.stringify(ret));
        }
      } else {
        req.logger?.debug('Server has valid credentials');
        req.hasValidCredentials = true;
        next();
        return;
      }
    }

    const serverCredentials = GetServerCredentials();

    if (!serverCredentials?.serverId || !serverCredentials?.serverKey) {
      throw new Error('Server is claimed but serverId or serverKey is missing.');
    }

    req.logger?.debug('Server credentials found');

    let ret: BackendQueries.GetServerToken.ResponseType;
    try {
      ret = await BackendQueries.GetServerToken.Post({
        id: serverCredentials.serverId,
        key: serverCredentials.serverKey,
      });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        req.logger?.error('Error requesting backend server unreachable');
        responseFormatter.sendErrorBackEndServerUnreachable(req, res);
      } else {
        throw err;
      }
      return;
    }

    if (!ret.ok) {
      if (ret.errorCode == 'INVALID_CREDENTIALS') {
        req.logger?.debug('Invalid server credentials');
        req.logger?.debug('Deleting credentials');
        await ClearServerCredentials();
        req.hasValidCredentials = false;
        next();
      } else {
        throw new Error('request to verify server credentials failed. ' + JSON.stringify(ret));
      }
    } else {
      req.logger?.debug('server claimed, it has valid credentials');
      const serverToken = BackendQueries.TokenManager.GetServerToken();

      req.logger?.debug('saving server token');
      await SaveServerToken(serverToken);

      req.logger?.debug('server has valid credentials');
      req.hasValidCredentials = true;
      next();
      return;
    }
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}

export default checkServerHasValidCredentials;
