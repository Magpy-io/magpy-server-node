import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { expiredTokenHeader } from "@tests/helpers/functions";

const endpointsToTestInvalidToken = [
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
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it.each(
    endpointsToTestInvalidToken.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return error AUTHORIZATION_MISSING when no token is added for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("AUTHORIZATION_MISSING");
    }
  );

  it.each(
    endpointsToTestInvalidToken.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return error AUTHORIZATION_FAILED when invalid token is added for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .set({ Authorization: "Bearer invalidToken" })
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("AUTHORIZATION_FAILED");
    }
  );

  it.each(
    endpointsToTestInvalidToken.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return error AUTHORIZATION_EXPIRED when expired token is used for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .set(expiredTokenHeader())
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("AUTHORIZATION_EXPIRED");
    }
  );
});
