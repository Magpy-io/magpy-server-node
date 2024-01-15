import { GetPhotoPartById } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetPhotoPartById.RequestData,
  GetPhotoPartById.ResponseData,
  GetPhotoPartById.ResponseErrorTypes
>(GetPhotoPartById.endpoint, GetPhotoPartById.tokenAuth);
