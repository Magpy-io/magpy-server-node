import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";

export type ResponseData = {
  number: number;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
