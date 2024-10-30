import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { GetServerInfo } from '../modules/BackendQueries';
import { combineMiddleware } from '../modules/functions';
import checkServerHasValidCredentials from './checkServerHasValidCredentials';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerIsClaimedRemote(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    req.logger?.middleware('checkServerIsClaimedRemote');

    if (!req.hasValidCredentials) {
      req.logger?.debug('server is not claimed');
      req.isClaimedRemote = false;
      next();
      return;
    }

    const ret = await GetServerInfo.Post();

    if (!ret.ok) {
      throw new Error('Error retrieving server info. ' + JSON.stringify(ret));
    }

    if (ret.data.server.owner == null) {
      req.logger?.debug('server is not claimed');
      req.isClaimedRemote = false;
      next();
      return;
    }

    req.logger?.debug('server is claimed');
    req.isClaimedRemote = true;

    next();
  } catch (err) {
    req.logger?.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}

export default combineMiddleware([checkServerHasValidCredentials, checkServerIsClaimedRemote]);
