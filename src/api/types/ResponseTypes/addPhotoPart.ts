import {
  ErrorPhotoSizeExceeded,
  ErrorMissingParts,
  ErrorPhotoTransferNotFound,
  ErrorServerNotClaimed,
  ErrorsAuthorization,
} from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData =
  | {
      lenReceived: number;
      lenWaiting: number;
      done: false;
    }
  | {
      lenReceived: number;
      lenWaiting: number;
      done: true;
      photo: APIPhoto;
    };

export type ResponseErrorTypes =
  | ErrorPhotoSizeExceeded
  | ErrorMissingParts
  | ErrorPhotoTransferNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;
