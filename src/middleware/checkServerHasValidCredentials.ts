import { Request, Response, NextFunction } from "express";

import checkServerHasCredentials from "@src/middleware/checkServerHasCredentials";

import responseFormatter from "@src/api/responseFormatter";

import { combineMiddleware } from "@src/modules/functions";

import { getServerInfo, getServerToken } from "@src/modules/backendRequests";

import { SaveServerData } from "@src/modules/serverDataManager";

async function checkServerHasValidCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const serverData = req.serverData;

    if (serverData.serverToken) {
      console.log("server token found");

      let ret: any;
      try {
        ret = await getServerInfo(serverData.serverToken);
      } catch (err) {
        console.error("Error requesting backend server");
        console.error(err);
        responseFormatter.sendErrorBackEndServerUnreachable(res);
        return;
      }

      if (!ret.ok) {
        if (
          ret.errorCode == "AUTHORIZATION_FAILED" ||
          ret.errorCode == "AUTHORIZATION_EXPIRED"
        ) {
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

      let ret: any;
      try {
        ret = await getServerToken(serverData.serverId, serverData.serverKey);
      } catch (err) {
        console.error("Error requesting backend server");
        console.error(err);
        responseFormatter.sendErrorBackEndServerUnreachable(res);
        return;
      }

      if (!ret.ok) {
        if (ret.errorCode == "INVALID_CREDENTIALS") {
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
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([
  checkServerHasCredentials,
  checkServerHasValidCredentials,
]);
