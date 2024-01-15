import {
  ErrorsNotFromLocal,
  ErrorBackendServerUnreachable,
} from "../ErrorTypes";

export type ResponseData = {
  storagePath: string;
  serverName: string;
  owner: { name: string; email: string } | null;
};

export type ResponseErrorTypes =
  | ErrorsNotFromLocal
  | ErrorBackendServerUnreachable;
