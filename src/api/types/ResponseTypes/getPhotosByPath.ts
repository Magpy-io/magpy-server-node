import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData = {
  number: number;
  photos: Array<
    | { path: string; exists: false }
    | { path: string; exists: true; photo: APIPhoto }
  >;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
