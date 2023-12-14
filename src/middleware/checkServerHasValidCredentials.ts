import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import { getServerInfo, getServerToken } from "@src/modules/backendRequests";

import { GetServerData, SaveServerData } from "@src/modules/serverDataManager";

async function checkServerHasValidCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const serverData = await GetServerData();

  if (serverData.serverToken) {
    console.log("server token found");
    const ret = await getServerInfo(serverData.serverToken);

    if (!ret.ok) {
      if (ret.errorCode == "AUTHORIZATION_FAILED") {
        console.log("Invalid server token");
      } else {
        console.error("request to get server info failed");
        console.error(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }
    } else {
      console.log("server is claimed");
      req.hasValidCredentials = true;
      next();
      return;
    }
  }

  if (serverData.serverId && serverData.serverKey) {
    console.log("server credentials found");
    const ret = await getServerToken(serverData.serverId, serverData.serverKey);

    if (!ret.ok) {
      if (
        ret.errorCode == "INVALID_CREDENTIALS" ||
        ret.errorCode == "INVALID_ID_FORMAT"
      ) {
        console.log("invalid server credentials");
      } else {
        console.error("request to verify server credentials failed");
        console.error(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }
    } else {
      console.log("server claimed, it has valid credentials");
      const serverToken = ret.token;

      console.log("saving server token");
      await SaveServerData({
        serverId: serverData.serverId,
        serverKey: serverData.serverKey,
        serverToken: serverToken,
      });
      req.hasValidCredentials = true;
      next();
      return;
    }
  }

  req.hasValidCredentials = false;
  next();
}

export default checkServerHasValidCredentials;
