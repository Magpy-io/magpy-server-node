import {
  ErrorBackendServerUnreachable,
  ErrorServerNotClaimed,
  ErrorUserNotAllowed,
  ErrorAuthorizationBackendFailed,
  ErrorAuthorizationBackendExpired,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorBackendServerUnreachable
  | ErrorServerNotClaimed
  | ErrorUserNotAllowed
  | ErrorAuthorizationBackendFailed
  | ErrorAuthorizationBackendExpired;
