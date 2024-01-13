import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseMessage,
} from "../ApiResponseTypes";
import {
  ErrorBackendServerUnreachable,
  ErrorsNotFromLocal,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";

export type RequestData = void;

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;

export type ResponseType = EndpointMethodsResponseType<
  ServerResponseMessage,
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

export const endpoint = "unclaimServer";
