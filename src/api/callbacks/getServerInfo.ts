import { Request, Response } from 'express';

import assertConnexionLocal from '../../middleware/connexionLocal/assertConnexionLocal';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { GetServerInfo as BackendGetServerInfo } from '../../modules/BackendQueries';
import {
  GetStorageFolderPath,
  GetServerName,
  IsServerClaimedRemote,
  IsServerClaimedLocal,
  GetServerLocalClaimInfo,
} from '../../modules/serverDataManager';
import { GetServerInfo } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<GetServerInfo.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetServerInfo.RequestData,
) => {
  try {
    const storageFolderPath = GetStorageFolderPath();
    const serverName = GetServerName();

    const responseJson: GetServerInfo.ResponseData = {
      storagePath: storageFolderPath,
      serverName: serverName,
      owner: null,
      ownerLocal: null,
    };

    if (req.hasValidCredentials) {
      const ret = await BackendGetServerInfo.Post();

      if (!ret.ok) {
        throw new Error('Error retrieving server info. ' + JSON.stringify(ret));
      }

      if (ret.data.server.owner != null) {
        const owner = ret.data.server.owner;
        responseJson.owner = {
          name: owner.name,
          email: owner.email,
        };
      }
    }

    if (IsServerClaimedLocal()) {
      const serverLocalClaimInfo = GetServerLocalClaimInfo();

      if (!serverLocalClaimInfo) {
        throw new Error('Server is claimed locally but serverLocalClaimInfo is null.');
      }

      responseJson.ownerLocal = { name: serverLocalClaimInfo.username };
    }

    return sendResponse(res, responseJson);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetServerInfo.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertConnexionLocal, checkServerHasValidCredentials],
  requestShema: GetServerInfo.RequestSchema,
} as EndpointType;
