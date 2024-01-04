import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import {
  getPhotoByIdFromDB,
  updatePhotoClientPathById,
  getPhotoByClientPathFromDB,
} from "@src/db/sequelizeDb";

import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import checkUserToken from "@src/middleware/checkUserToken";
import { checkPhotoExists } from "@src/modules/functions";

// updatePhotoPath : updates the path of a photo in db
const endpoint = "/updatePhotoPath";
const callback = async (req: Request, res: Response) => {
  console.log(`\n[updatePhotoPath]`);

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  console.log(`id: ${req.body.id}, newPath: ${req.body.path}`);

  const { id, path }: RequestType = req.body;

  try {
    console.log(`Searching in db for photo with id: ${id}`);
    const exists = await checkPhotoExists({
      id: id,
    });
    if (!exists) {
      console.log("Photo does not exist in server.");
      console.log("Sending response message.");
      responseFormatter.sendFailedMessage(
        res,
        `Photo with id ${id} not found in server`,
        "ID_NOT_FOUND"
      );
    } else {
      console.log("Photo found");

      console.log("Getting photo from db with new path");
      const photoWithNewPathExists = await checkPhotoExists({
        clientPath: path,
      });
      console.log("Received response from db.");

      if (!photoWithNewPathExists) {
        console.log("Photo path does not exist in db");
        console.log("Updating path in db");
        await updatePhotoClientPathById(id, path);

        console.log("Photo updated successfully.");
        console.log("Sending response message.");
        responseFormatter.sendSuccessfulMessage(
          res,
          `Photo with id ${id} successfully updated with new path`
        );
      } else {
        console.log("Photo path already exists in db");
        console.log("Sending response message.");
        responseFormatter.sendFailedMessage(
          res,
          `A photo already exists with path ${path}`,
          "PATH_EXISTS"
        );
      }
    }
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "id", "string")) return true;
  if (checkReqBodyAttributeMissing(req, "path", "string")) return true;

  return false;
}

type RequestType = {
  id: string;
  path: string;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
