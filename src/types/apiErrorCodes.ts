type ErrorCodes =
  | "BAD_REQUEST"
  | "SERVER_ERROR"
  | "AUTHORIZATION_FAILED"
  | "BACKEND_SERVER_UNREACHABLE"
  | "PATH_EXISTS"
  | "ID_NOT_FOUND"
  | "USER_NOT_ALLOWED"
  | "SERVER_NOT_CLAIMED"
  | "INVALID_PART_NUMBER"
  | "SERVER_ALREADY_CLAIMED"
  | "PHOTO_TRANSFER_NOT_FOUND"
  | "MISSING_PARTS"
  | "PHOTO_EXISTS"
  | "PHOTO_SIZE_EXCEEDED";

export type { ErrorCodes };
