import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseData,
} from "../ApiResponseTypes";
import {
  ErrorIdNotFound,
  ErrorInvalidPartNumber,
  ErrorsAuthorization,
  ErrorServerNotClaimed,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";
import { APIPhoto } from "../Types";
import { getPathWithEndpoint } from "../PathManager";
import {
  userAuthorizationObject,
  verifyHasUserToken,
} from "../UserTokenManager";

export type RequestData = {
  id: string;
  part: number;
};

export type ResponseData = ServerResponseData<{
  photo: APIPhoto;
  part: number;
  totalNbOfParts: number;
}>;

export type ResponseErrorTypes =
  | ErrorInvalidPartNumber
  | ErrorIdNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;

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

export const endpoint = "getPhotoPartById";
