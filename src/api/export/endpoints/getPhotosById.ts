import { GetPhotosById } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetPhotosById.RequestData,
  GetPhotosById.ResponseData,
  GetPhotosById.ResponseErrorTypes
>(GetPhotosById.endpoint, GetPhotosById.tokenAuth);
