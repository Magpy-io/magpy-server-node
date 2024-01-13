import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseMessage,
} from "../ApiResponseTypes";
import {
  ErrorAuthorizationBackendExpired,
  ErrorAuthorizationBackendFailed,
  ErrorBackendServerUnreachable,
  ErrorServerNotClaimed,
  ErrorUserNotAllowed,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";
import { extractToken, SetUserToken } from "../UserTokenManager";

export type RequestData = {
  userToken: string;
};

export type ResponseData = ServerResponseMessage;

export type ResponseErrorTypes =
  | ErrorBackendServerUnreachable
  | ErrorServerNotClaimed
  | ErrorUserNotAllowed
  | ErrorAuthorizationBackendFailed
  | ErrorAuthorizationBackendExpired;

export type ResponseType = EndpointMethodsResponseType<
  ResponseData,
  ResponseErrorTypes
>;

export async function Post(data: RequestData): Promise<ResponseType> {
  try {
    const response = await axios.post(getPathWithEndpoint(endpoint), data);
    const token = extractToken(response);
    SetUserToken(token);
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

export const endpoint = "getToken";
