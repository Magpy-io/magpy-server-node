import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export";
import { SetUserToken } from "@src/api/export/UserTokenManager";

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
  { endpoint: "addPhoto", func: exportedTypes.AddPhoto.Post },
  { endpoint: "addPhotoInit", func: exportedTypes.AddPhotoInit.Post },
  { endpoint: "addPhotoPart", func: exportedTypes.AddPhotoPart.Post },
  { endpoint: "deletePhotosById", func: exportedTypes.DeletePhotosById.Post },
  { endpoint: "getPhotoPartById", func: exportedTypes.GetPhotoPartById.Post },
  { endpoint: "getNumberPhotos", func: exportedTypes.GetNumberPhotos.Post },
  { endpoint: "getPhotos", func: exportedTypes.GetPhotos.Post },
  { endpoint: "getPhotosById", func: exportedTypes.GetPhotosById.Post },
  { endpoint: "getPhotosByPath", func: exportedTypes.GetPhotosByPath.Post },
  { endpoint: "updatePhotoPath", func: exportedTypes.UpdatePhotoPath.Post },
  { endpoint: "whoAmI", func: exportedTypes.WhoAmI.Post },
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
      SetUserToken("invalidToken");
      const ret = await p.func();

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, "AUTHORIZATION_FAILED");
    }
  );

  it.each(endpointsToTestInvalidToken)(
    "Should return error AUTHORIZATION_EXPIRED when expired token is used for endpoint $endpoint",
    async (p) => {
      SetUserToken(getExpiredToken());
      const ret = await p.func();

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, "AUTHORIZATION_EXPIRED");
    }
  );
});
