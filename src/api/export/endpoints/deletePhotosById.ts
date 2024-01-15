import { DeletePhotosById } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  DeletePhotosById.RequestData,
  DeletePhotosById.ResponseData,
  DeletePhotosById.ResponseErrorTypes
>(DeletePhotosById.endpoint, DeletePhotosById.tokenAuth);
