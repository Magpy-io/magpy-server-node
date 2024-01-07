import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
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

import checkServerIsClaimed from "@src/middleware/checkServerIsClaimed";

// claimServer : creates server in backend and sets the requesting user as it's owner
const endpoint = "/claimServer";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res);
    }
    console.log("Request parameters ok.");

    const requestParameters: RequestType = req.body;

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
        console.error(err);
        return responseFormatter.sendErrorMessage(res);
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
        console.error("request to verify user token failed");
        console.error(ret);
        return responseFormatter.sendErrorMessage(res);
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
        console.error(err);
        return responseFormatter.sendErrorMessage(res);
      }
    }

    if (!ret1.ok) {
      console.error("request to verify server credentials failed");
      console.error(ret1);
      return responseFormatter.sendErrorMessage(res);
    }

    console.log("got server token, saving to local");

    const serverToken = GetServerToken();

    await SaveServerCredentials({
      serverId: id,
      serverKey: keyGenerated,
      serverToken: serverToken,
    });

    return responseFormatter.sendSuccessfulMessage(res, "ok");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "userToken", "string")) return true;

  return false;
}

type RequestType = {
  userToken: string;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkServerIsClaimed,
};
