import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { GetServerInfo } from '../modules/BackendQueries';
import { combineMiddleware } from '../modules/functions';
import checkServerHasValidCredentials from './checkServerHasValidCredentials';
import { ExtendedRequest } from '../api/endpointsLoader';

async function checkServerIsClaimedRemote(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    console.log('#CheckServerIsClaimed middleware');
    if (!req.hasValidCredentials) {
      console.log('server is not claimed');
      req.isClaimed = false;
      next();
      return;
    }

    const ret = await GetServerInfo.Post();

    if (!ret.ok) {
      throw new Error('Error retrieving server info. ' + JSON.stringify(ret));
    }

    if (ret.data.server.owner == null) {
      console.log('server is not claimed');
      req.isClaimed = false;
      next();
      return;
    }

    console.log('server is claimed');
    req.isClaimed = true;

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([checkServerHasValidCredentials, checkServerIsClaimedRemote]);
