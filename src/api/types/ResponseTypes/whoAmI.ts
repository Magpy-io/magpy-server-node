import { ErrorsAuthorization, ErrorServerNotClaimed } from "../ErrorTypes";

export type ResponseData = {
  user: { id: string };
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
