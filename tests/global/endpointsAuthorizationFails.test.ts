import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";
import request from "supertest";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  expectErrorCodeToBe,
  expectToNotBeOk,
  getExpiredToken,
} from "@tests/helpers/functions";

const endpointsToTestInvalidToken: Array<{
  endpoint: string;
  func: (...args: any[]) => Promise<any>;
}> = [
  { endpoint: "addPhoto", func: exportedTypes.AddPhotoPost },
  { endpoint: "addPhotoInit", func: exportedTypes.AddPhotoInitPost },
  { endpoint: "addPhotoPart", func: exportedTypes.AddPhotoPartPost },
  { endpoint: "deletePhotosById", func: exportedTypes.DeletePhotosByIdPost },
  { endpoint: "getPhotoPartById", func: exportedTypes.GetPhotoPartByIdPost },
  { endpoint: "getNumberPhotos", func: exportedTypes.GetNumberPhotosPost },
  { endpoint: "getPhotos", func: exportedTypes.GetPhotosPost },
  { endpoint: "getPhotosById", func: exportedTypes.GetPhotosByIdPost },
  { endpoint: "getPhotosByPath", func: exportedTypes.GetPhotosByPathPost },
  { endpoint: "updatePhotoPath", func: exportedTypes.UpdatePhotoPathPost },
  { endpoint: "whoAmI", func: exportedTypes.WhoAmIPost },
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
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it.each(endpointsToTestInvalidToken)(
    "Should return error AUTHORIZATION_MISSING when no token is added for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .set("Content-Type", "application/json")
        .send({});

      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("AUTHORIZATION_MISSING");
    }
  );

  it.each(endpointsToTestInvalidToken)(
    "Should return error AUTHORIZATION_FAILED when invalid token is added for endpoint $endpoint",
    async (p) => {
      exportedTypes.SetUserToken("invalidToken");
      const ret = await p.func();

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, "AUTHORIZATION_FAILED");
    }
  );

  it.each(endpointsToTestInvalidToken)(
    "Should return error AUTHORIZATION_EXPIRED when expired token is used for endpoint $endpoint",
    async (p) => {
      exportedTypes.SetUserToken(getExpiredToken());
      const ret = await p.func();

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, "AUTHORIZATION_EXPIRED");
    }
  );
});
