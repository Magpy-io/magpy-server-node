import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseMessage,
} from "../ApiResponseTypes";
import {
  ErrorPathAccessDenied,
  ErrorPathFolderDoesNotExist,
  ErrorsNotFromLocal,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";

export type RequestData = { path?: string };

export type ResponseData = ServerResponseMessage;

export type ResponseErrorTypes =
  | ErrorPathFolderDoesNotExist
  | ErrorPathAccessDenied
  | ErrorsNotFromLocal;

export type ResponseType = EndpointMethodsResponseType<
  ResponseData,
  ResponseErrorTypes
>;

export async function Post(data: RequestData): Promise<ResponseType> {
  try {
    const response = await axios.post(getPathWithEndpoint(endpoint), data);
    return response.data;
  } catch (err: any) {
    return handleAxiosError(err);
  }
}

export const endpoint = "updateServerPath";
