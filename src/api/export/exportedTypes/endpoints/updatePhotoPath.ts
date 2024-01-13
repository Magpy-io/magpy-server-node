import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseMessage,
} from "../ApiResponseTypes";
import {
  ErrorIdNotFound,
  ErrorsAuthorization,
  ErrorServerNotClaimed,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";
import {
  userAuthorizationObject,
  verifyHasUserToken,
} from "../UserTokenManager";

export type RequestData = {
  id: string;
  path: string;
  deviceUniqueId: string;
};

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorIdNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;

export type ResponseType = EndpointMethodsResponseType<
  ServerResponseMessage,
  ResponseErrorTypes
>;

export async function Post(data: RequestData): Promise<ResponseType> {
  verifyHasUserToken();
  try {
    const response = await axios.post(
      getPathWithEndpoint(endpoint),
      data,
      userAuthorizationObject()
    );
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

export const endpoint = "updatePhotoPath";
