import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
jest.mock("fs/promises");
jest.mock("@src/modules/backendRequests");

import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";

import {
  setupServerUserToken,
  serverTokenHeader,
} from "@tests/helpers/functions";
import { getServerToken } from "@src/modules/backendRequests";

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
        .set("Content-Type", "application/json")
        .send({});

      expect(ret.statusCode).toBe(401);
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
        .set("Content-Type", "application/json")
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("AUTHORIZATION_FAILED");
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
        .set("Content-Type", "application/json")
        .send({});

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("SERVER_NOT_CLAIMED");
    }
  );
});
