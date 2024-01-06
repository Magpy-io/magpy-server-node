import { Request, Response, NextFunction } from "express";

import checkServerHasCredentials from "@src/middleware/checkServerHasCredentials";

import responseFormatter from "@src/api/responseFormatter";

import { combineMiddleware } from "@src/modules/functions";

import {
  getServerInfoPost,
  getServerTokenPost,
  SetServerToken,
  GetServerToken,
  GetServerTokenResponseType,
  GetServerInfoResponseType,
  ErrorBackendUnreachable,
} from "@src/modules/backendImportedQueries";

import { SaveServerCredentials } from "@src/modules/serverDataManager";

async function checkServerHasValidCredentials(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("#CheckServerHasValidCredentials middleware");
    const serverData = req.serverData;

    if (serverData?.serverToken) {
      console.log("server token found");

      let ret: GetServerInfoResponseType;
      try {
        SetServerToken(serverData.serverToken);
        ret = await getServerInfoPost();
      } catch (err) {
        if (err instanceof ErrorBackendUnreachable) {
          console.log("Error requesting backend server");
          responseFormatter.sendErrorBackEndServerUnreachable(res);
        } else {
          console.error(err);
          responseFormatter.sendErrorMessage(res);
        }
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
        console.log("server has valid credentials");
        req.hasValidCredentials = true;
        next();
        return;
      }
    }

    if (serverData?.serverId && serverData?.serverKey) {
      console.log("server credentials found");

      let ret: GetServerTokenResponseType;
      try {
        ret = await getServerTokenPost({
          id: serverData.serverId,
          key: serverData.serverKey,
        });
      } catch (err) {
        if (err instanceof ErrorBackendUnreachable) {
          console.log("Error requesting backend server");
          responseFormatter.sendErrorBackEndServerUnreachable(res);
        } else {
          console.error(err);
          responseFormatter.sendErrorMessage(res);
        }
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
        const serverToken = GetServerToken();

        console.log("saving server token");
        await SaveServerCredentials({
          serverToken: serverToken,
        });

        console.log("server has valid credentials");
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
