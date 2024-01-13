import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseMessage,
} from "../ApiResponseTypes";
import {
  ErrorBackendServerUnreachable,
  ErrorInvalidName,
  ErrorsNotFromLocal,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";

export type RequestData = { name?: string };

export type ResponseData = ServerResponseMessage;

export type ResponseErrorTypes =
  | ErrorInvalidName
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;

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

export const endpoint = "updateServerName";
