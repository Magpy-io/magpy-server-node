import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotoByIdFromDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import { removePhotoFromDisk } from "@src/modules/diskManager";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import checkUserToken from "@src/middleware/checkUserToken";

// deletePhotosById: deletes photos from server by id
const endpoint = "/deletePhotosById";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedBadRequest(res);
    }
    console.log("Request parameters ok.");

    console.log(`ids len: ${req.body.ids.length}`);

    const ids: string[] = req.body.ids;

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
    return responseFormatter.sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
