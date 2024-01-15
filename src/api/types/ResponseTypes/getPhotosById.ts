import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";
import { APIPhoto } from "../Types";

export type ResponseData = {
  number: number;
  photos: Array<
    | { id: string; exists: false }
    | { id: string; exists: true; photo: APIPhoto }
  >;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
