import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseData,
} from "../ApiResponseTypes";
import {
  ErrorMissingParts,
  ErrorPhotoSizeExceeded,
  ErrorPhotoTransferNotFound,
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
  partNumber: number;
  partSize: number;
  photoPart: string;
};

export type ResponseData =
  | {
      lenReceived: number;
      lenWaiting: number;
      done: false;
    }
  | {
      lenReceived: number;
      lenWaiting: number;
      done: true;
      photo: APIPhoto;
    };

export type ResponseErrorTypes =
  | ErrorPhotoSizeExceeded
  | ErrorMissingParts
  | ErrorPhotoTransferNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;

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

export const endpoint = "addPhotoPart";
