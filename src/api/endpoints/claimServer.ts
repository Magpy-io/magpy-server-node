import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import Joi from "joi";
import {
  registerServerPost,
  getServerTokenPost,
  GetServerTokenResponseType,
  RegisterServerResponseType,
  GetServerToken,
  SetUserToken,
  ErrorBackendUnreachable,
} from "@src/modules/backendImportedQueries";
import { randomBytes } from "crypto";
import { getMyIp } from "@src/modules/getMyIp";

import {
  GetServerName,
  SaveServerCredentials,
} from "@src/modules/serverDataManager";

import { ClaimServer } from "@src/api/export/exportedTypes";

import checkServerIsClaimed from "@src/middleware/checkServerIsClaimed";

const sendResponse =
  responseFormatter.getCustomSendResponse<ClaimServer.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    const requestParameters: ClaimServer.RequestData = req.body;

    const myIp = await getMyIp();

    const { userToken } = requestParameters;

    if (req.isClaimed) {
      console.log("server already claimed, it has valid token");
      return responseFormatter.sendFailedMessage(
        res,
        "Server already claimed",
        "SERVER_ALREADY_CLAIMED"
      );
    }

    console.log("server not claimed");

    const keyGenerated = randomBytes(32).toString("hex");

    let ret: RegisterServerResponseType;
    try {
      SetUserToken(userToken);
      ret = await registerServerPost({
        name: GetServerName(),
        ipAddress: myIp,
        serverKey: keyGenerated,
      });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
      }
    }

    if (!ret.ok) {
      if (ret.errorCode == "AUTHORIZATION_FAILED") {
        console.log("user token authorization error");
        return responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_BACKEND_FAILED"
        );
      } else if (ret.errorCode == "AUTHORIZATION_EXPIRED") {
        console.log("user token expired");
        return responseFormatter.sendFailedMessage(
          res,
          "User token expired",
          "AUTHORIZATION_BACKEND_EXPIRED"
        );
      } else {
        throw new Error(
          "request to verify user token failed. " + JSON.stringify(ret)
        );
      }
    }

    const id = ret.data.server._id;
    console.log("server registered, got id: " + id);

    let ret1: GetServerTokenResponseType;
    try {
      ret1 = await getServerTokenPost({ id: id, key: keyGenerated });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
      }
    }

    if (!ret1.ok) {
      throw new Error(
        "request to verify server credentials failed. " + JSON.stringify(ret1)
      );
    }

    console.log("got server token, saving to local");

    const serverToken = GetServerToken();

    await SaveServerCredentials({
      serverId: id,
      serverKey: keyGenerated,
      serverToken: serverToken,
    });

    return sendResponse(res, "ok");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  userToken: Joi.string(),
}).options({ presence: "required" });

export default {
  endpoint: ClaimServer.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkServerIsClaimed,
  requestShema: RequestDataShema,
};
