import {
  ErrorsNotFromLocal,
  ErrorBackendServerUnreachable,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;
