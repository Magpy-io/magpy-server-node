import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { randomTokenHeader } from "@tests/helpers/functions";

const endpointsToTestServerNotClaimed = [
  "addPhoto",
  "addPhotoInit",
  "addPhotoPart",
  "deletePhotosById",
  "getPhotoPartById",
  "getNumberPhotos",
  "getPhotos",
  "getPhotosById",
  "getPhotosByPath",
  "updatePhotoPath",
  "whoAmI",
];

describe("Test endpoints return error when invalid token", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNoUserTokenSetup(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it.each(
    endpointsToTestServerNotClaimed.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return error SERVER_NOT_CLAIMED when server was not claimed before for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .set(randomTokenHeader())
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("SERVER_NOT_CLAIMED");
    }
  );
});
