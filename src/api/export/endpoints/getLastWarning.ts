import { GetLastWarning } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetLastWarning.RequestData,
  GetLastWarning.ResponseData,
  GetLastWarning.ResponseErrorTypes
>(GetLastWarning.endpoint, GetLastWarning.tokenAuth);
