import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseData,
} from "../ApiResponseTypes";
import { ErrorsAuthorization, ErrorServerNotClaimed } from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";
import { APIPhoto, PhotoTypes } from "../Types";
import { getPathWithEndpoint } from "../PathManager";
import {
  userAuthorizationObject,
  verifyHasUserToken,
} from "../UserTokenManager";

export type RequestData = {
  number: number;
  offset: number;
  photoType: PhotoTypes;
};

export type ResponseData = ServerResponseData<{
  endReached: boolean;
  number: number;
  photos: APIPhoto[];
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

export const endpoint = "getPhotos";
