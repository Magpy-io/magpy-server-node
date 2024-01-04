import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkUserToken from "@src/middleware/checkUserToken";

// whoAmI : checks user token is valid
const endpoint = "/whoami";
const callback = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const jsonResponse = {
      user: { id: userId },
    };
    console.log("Token verified, sending confirmation");
    return responseFormatter.sendResponse(res, jsonResponse);
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
