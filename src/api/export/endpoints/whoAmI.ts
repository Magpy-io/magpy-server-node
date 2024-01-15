import { WhoAmI } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  WhoAmI.RequestData,
  WhoAmI.ResponseData,
  WhoAmI.ResponseErrorTypes
>(WhoAmI.endpoint, WhoAmI.tokenAuth);
