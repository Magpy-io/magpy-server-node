import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";

export type ResponseData = {
  id: string;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
