import { ErrorBadRequest, ErrorServerError } from "./ErrorTypes";

export type ServerResponseMessage = {
  ok: true;
  message: string;
  warning: boolean;
};

export type DataTypeFrom<T> = T extends { data: infer D } ? D : never;

export type ServerResponseData<T> = {
  ok: true;
  data: T;
  warning: boolean;
};

export type ServerResponseError<Errors> = {
  ok: false;
  message: string;
  errorCode: Errors | ErrorBadRequest | ErrorServerError;
  warning: boolean;
};

export type EndpointMethodsResponseType<T, U> = T | ServerResponseError<U>;
