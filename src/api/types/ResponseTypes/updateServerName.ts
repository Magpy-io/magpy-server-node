import {
  ErrorBackendServerUnreachable,
  ErrorInvalidName,
  ErrorsNotFromLocal,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorInvalidName
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;
