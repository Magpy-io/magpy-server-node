import axios from "axios";
import {
  EndpointMethodsResponseType,
  ServerResponseData,
} from "../ApiResponseTypes";
import {
  ErrorBackendServerUnreachable,
  ErrorsNotFromLocal,
} from "../ErrorTypes";
import { handleAxiosError } from "../ExceptionsManager";

import { getPathWithEndpoint } from "../PathManager";

export type RequestData = void;

export type ResponseData = {
  storagePath: string;
  serverName: string;
  owner: { name: string; email: string } | null;
};

export type ResponseErrorTypes =
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;

export type ResponseType = EndpointMethodsResponseType<
  ServerResponseData<ResponseData>,
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

export const endpoint = "getServerInfo";
