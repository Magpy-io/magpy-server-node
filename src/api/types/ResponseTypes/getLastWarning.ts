import { WarningDataTypes } from "../WarningTypes";

import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";

export type ResponseData = {
  warning: WarningDataTypes | null;
};

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;
