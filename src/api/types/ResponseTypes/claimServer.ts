import {
  ErrorBackendServerUnreachable,
  ErrorServerAlreadyClaimed,
  ErrorAuthorizationBackendFailed,
  ErrorAuthorizationBackendExpired,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorBackendServerUnreachable
  | ErrorServerAlreadyClaimed
  | ErrorAuthorizationBackendFailed
  | ErrorAuthorizationBackendExpired;
