import { GetPhotosByPath } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetPhotosByPath.RequestData,
  GetPhotosByPath.ResponseData,
  GetPhotosByPath.ResponseErrorTypes
>(GetPhotosByPath.endpoint, GetPhotosByPath.tokenAuth);
