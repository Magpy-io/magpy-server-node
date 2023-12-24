import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import checkUserToken from "@src/middleware/checkUserToken";

// whoAmI : checks user token is valid
const endpoint = "/whoami";
const callback = async (req: Request, res: Response) => {
  console.log(`\n[whoami]`);

  try {
    const userId = req.userId;
    const jsonResponse = {
      user: { id: userId },
    };
    console.log("Token verified, sending confirmation");
    responseFormatter.sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
};
