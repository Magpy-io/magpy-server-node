import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData = {
  photo: APIPhoto;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
