import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData = {
  endReached: boolean;
  number: number;
  photos: APIPhoto[];
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
