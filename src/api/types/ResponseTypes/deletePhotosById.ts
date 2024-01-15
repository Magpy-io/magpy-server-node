import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";

export type ResponseData = {
  deletedIds: string[];
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
