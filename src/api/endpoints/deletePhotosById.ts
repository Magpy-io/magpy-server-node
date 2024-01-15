import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotoByIdFromDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import { removePhotoFromDisk } from "@src/modules/diskManager";
import Joi from "joi";
import checkUserToken from "@src/middleware/checkUserToken";
import { DeletePhotosById } from "@src/api/export/exportedTypes";

const sendResponse =
  responseFormatter.getCustomSendResponse<DeletePhotosById.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    const requestParameters: DeletePhotosById.RequestData = req.body;

    const ids: string[] = requestParameters.ids;

    const removedIds = [];
    for (const id of ids) {
      const dbPhoto = await getPhotoByIdFromDB(id);
      if (dbPhoto) {
        await deletePhotoByIdFromDB(id);
        await removePhotoFromDisk(dbPhoto);
        removedIds.push(id);
      }
    }

    console.log("Photos removed from db and disk.");
    console.log("Sending response message.");
    return sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

const RequestDataShema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })),
}).options({ presence: "required" });

export default {
  endpoint: DeletePhotosById.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: RequestDataShema,
};
