import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";

import {
  setupServerUserToken,
  serverTokenHeader,
  expiredTokenHeader,
} from "@tests/helpers/functions";

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
  "unclaimServer",
];

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
  "unclaimServer",
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
    await openAndInitDB();
    mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
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

  it.each(
    endpointsToTestServerNotClaimed.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return error SERVER_NOT_CLAIMED when server was not claimed before for endpoint $endpoint",
    async (p) => {
      // clear server config
      mockFsVolumeReset();

      const ret = await request(app)
        .post("/" + p.endpoint)
        .set(serverTokenHeader())
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("SERVER_NOT_CLAIMED");
    }
  );
});
