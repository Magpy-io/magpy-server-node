import request from "supertest";
import { Express } from "express";

let app: Express | null = null;

export default {
  post: async (
    route: string,
    data: object,
    options?: { headers: { authorization: string } }
  ) => {
    if (!app) {
      throw new Error("axios mock, app for supertest is not set.");
    }

    const routeSplit = route.split("/").filter((e) => !!e);
    const endpointName = routeSplit.pop();

    const ret = await request(app)
      .post("/" + endpointName)
      .set(options?.headers || {})
      .send(data);

    if (ret.statusCode != 200) {
      throw { response: { data: ret.body } };
    }
    return {
      data: ret.body,
      headers: { authorization: ret.headers["authorization"] },
    };
  },
};

export function setApp(p: Express) {
  app = p;
}
