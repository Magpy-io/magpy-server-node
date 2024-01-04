import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { getPhotoByIdFromDB } from "@src/db/sequelizeDb";
import { getOriginalPhotoFromDisk } from "@src/modules/diskManager";

import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { getNumberOfParts, getPartN } from "@src/modules/stringHelper";
import checkUserToken from "@src/middleware/checkUserToken";
import { checkPhotoExistsAndDeleteMissing } from "@src/modules/functions";

// getPhotoPartById : returns a part of a photo by id.
const endpoint = "/getPhotoPartById";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkReqBodyAttributeMissing(req, "id", "string")) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(res);
    }
    console.log("Request parameters ok.");

    const id: string = req.body.id;
    let partNumber = 0;
    if (!checkReqBodyAttributeMissing(req, "part", "number")) {
      partNumber = req.body.part;
    }

    console.log(`id: ${req.body.id}, partNumber: ${partNumber}`);

    console.log("Checking photo exists");

    const exists = await checkPhotoExistsAndDeleteMissing({
      id: id,
    });

    if (!exists) {
      console.log("Photo not found in db.");
      console.log("Sending response message.");
      return responseFormatter.sendFailedMessage(
        res,
        `Photo with id: ${id} not found`,
        "ID_NOT_FOUND"
      );
    } else {
      console.log("Photo found in db.");
      console.log(`Getting photo with id = ${id} from db.`);
      const dbPhoto = await getPhotoByIdFromDB(id);

      if (!dbPhoto) {
        throw new Error(
          "getPhotoPartById: photo exists but cannot retrieve from db"
        );
      }

      console.log("Retrieving photo from disk.");
      const image64 = await getOriginalPhotoFromDisk(dbPhoto.serverPath);
      console.log("Photo retrieved.");
      console.log("Sending response data.");

      const totalNbOfParts = getNumberOfParts(image64);

      if (0 <= partNumber && partNumber < totalNbOfParts) {
        const part = getPartN(image64, partNumber);
        const jsonResponse = {
          photo: responseFormatter.createPhotoObject(dbPhoto, part),
          part: partNumber,
          totalNbOfParts: totalNbOfParts,
        };
        return responseFormatter.sendResponse(res, jsonResponse);
      } else {
        console.log(
          `Part number ${partNumber} must be between 0 and ${
            totalNbOfParts - 1
          } included`
        );
        console.log("Sending response message.");
        return responseFormatter.sendFailedMessage(
          res,
          `Part number ${partNumber} must be between 0 and ${
            totalNbOfParts - 1
          } included`,
          "INVALID_PART_NUMBER"
        );
      }
    }
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
