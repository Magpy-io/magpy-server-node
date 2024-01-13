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
  photosData: Array<{ path: string; size: number; date: string }>;
  photoType: PhotoTypes;
  deviceUniqueId: string;
};

export type ResponseData = {
  number: number;
  photos: Array<
    | { path: string; exists: false }
    | { path: string; exists: true; photo: APIPhoto }
  >;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;

export type ResponseType = EndpointMethodsResponseType<
  ServerResponseData<ResponseData>,
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

export const endpoint = "getPhotosByPath";
