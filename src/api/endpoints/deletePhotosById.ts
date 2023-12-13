import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotoByIdFromDB, deletePhotoByIdFromDB } from "@src/db/sequelizeDb";
import { removePhotoFromDisk } from "@src/modules/diskManager";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";

// deletePhotosById: deletes photos from server by id
const endpoint = "/deletePhotosById";
const callback = async (req: Request, res: Response) => {
  console.log("\n[deletePhotosById]");

  console.log("Checking request parameters.");
  if (checkReqBodyAttributeMissing(req, "ids", "Array string")) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`ids len: ${req.body.ids.length}`);

  const ids: string[] = req.body.ids;

  try {
    const removedIds = [];
    for (const id of ids) {
      const dbPhoto = await getPhotoByIdFromDB(id);
      if (dbPhoto) {
        await deletePhotoByIdFromDB(id);
        await removePhotoFromDisk(dbPhoto.serverPath);
        removedIds.push(id);
      }
    }

    console.log("Photos removed from db and disk.");
    console.log("Sending response message.");
    responseFormatter.sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default { endpoint: endpoint, callback: callback, method: "post" };
