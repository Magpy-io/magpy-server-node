import { UpdatePhotoPath } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UpdatePhotoPath.RequestData,
  UpdatePhotoPath.ResponseData,
  UpdatePhotoPath.ResponseErrorTypes
>(UpdatePhotoPath.endpoint, UpdatePhotoPath.tokenAuth);
