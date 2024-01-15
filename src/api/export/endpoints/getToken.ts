import { GetToken } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetToken.RequestData,
  GetToken.ResponseData,
  GetToken.ResponseErrorTypes
>(GetToken.endpoint, GetToken.tokenAuth);
