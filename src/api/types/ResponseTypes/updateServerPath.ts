import {
  ErrorPathAccessDenied,
  ErrorPathFolderDoesNotExist,
  ErrorsNotFromLocal,
} from "../ErrorTypes";

export type ResponseData = string;

export type ResponseErrorTypes =
  | ErrorPathFolderDoesNotExist
  | ErrorPathAccessDenied
  | ErrorsNotFromLocal;
