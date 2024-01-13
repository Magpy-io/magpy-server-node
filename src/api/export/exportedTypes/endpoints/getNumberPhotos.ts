import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseData,
} from "../ApiResponseTypes";
import { ErrorsAuthorization, ErrorServerNotClaimed } from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";
import { getPathWithEndpoint } from "../PathManager";
import {
  userAuthorizationObject,
  verifyHasUserToken,
} from "../UserTokenManager";

export type RequestData = void;

export type ResponseData = ServerResponseData<{
  number: number;
}>;

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;

export type ResponseType = EndpointMethodsResponseType<
  ResponseData,
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

export const endpoint = "getNumberPhotos";
