import {
  ErrorInvalidPartNumber,
  ErrorIdNotFound,
  ErrorServerNotClaimed,
  ErrorsAuthorization,
} from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData = {
  photo: APIPhoto;
  part: number;
  totalNbOfParts: number;
};

export type ResponseErrorTypes =
  | ErrorInvalidPartNumber
  | ErrorIdNotFound
  | ErrorServerNotClaimed
  | ErrorsAuthorization;
