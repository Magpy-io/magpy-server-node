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

import { SaveServerData } from "@src/modules/serverDataManager";

import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";

// claimServer : creates server in backend and sets the requesting user as it's owner
const endpoint = "/claimServer";
const callback = async (req: Request, res: Response) => {
  console.log("\n[claimServer]");
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      responseFormatter.sendFailedMessage(res);
      return;
    }
    console.log("Request parameters ok.");

    const requestParameters: RequestType = req.body;

    const myIp = await getMyIp();

    const { userToken } = requestParameters;

    if (req.hasValidCredentials) {
      console.log("server already claimed, it has valid token");
      responseFormatter.sendFailedMessage(
        res,
        "Server already claimed",
        "SERVER_ALREADY_CLAIMED"
      );
      return;
    }

    console.log("server not claimed");

    const keyGenerated = randomBytes(32).toString("hex");

    let ret: RegisterServerResponseType;
    try {
      SetUserToken(userToken);
      ret = await registerServerPost({
        name: "MyServer",
        ipAddress: myIp,
        serverKey: keyGenerated,
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
      if (ret.errorCode == "AUTHORIZATION_FAILED") {
        console.log("user token authorization error");
        responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_BACKEND_FAILED"
        );
        return;
      } else if (ret.errorCode == "AUTHORIZATION_EXPIRED") {
        console.log("user token expired");
        responseFormatter.sendFailedMessage(
          res,
          "User token expired",
          "AUTHORIZATION_BACKEND_EXPIRED"
        );
        return;
      } else {
        console.error("request to verify user token failed");
        console.error(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }
    }

    const id = ret.data.server._id;
    console.log("server registered, got id: " + id);

    let ret1: GetServerTokenResponseType;
    try {
      ret1 = await getServerTokenPost({ id: id, key: keyGenerated });
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

    if (!ret1.ok) {
      console.error("request to verify server credentials failed");
      console.error(ret1);
      responseFormatter.sendErrorMessage(res);
      return;
    }

    console.log("got server token, saving to local");

    const serverToken = GetServerToken();

    await SaveServerData({
      serverId: id,
      serverKey: keyGenerated,
      serverToken: serverToken,
    });

    responseFormatter.sendSuccessfulMessage(res, "ok");
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
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
  middleWare: checkServerHasValidCredentials,
};
