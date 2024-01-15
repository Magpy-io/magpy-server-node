import {
  ErrorIdNotFound,
  ErrorsAuthorization,
  ErrorServerNotClaimed,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorIdNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;
