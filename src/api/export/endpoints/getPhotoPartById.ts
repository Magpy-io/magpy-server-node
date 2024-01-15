import { GetPhotoPartById } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetPhotoPartById.RequestData,
  GetPhotoPartById.ResponseData,
  GetPhotoPartById.ResponseErrorTypes
>(GetPhotoPartById.endpoint, GetPhotoPartById.tokenAuth);
