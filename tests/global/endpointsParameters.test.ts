import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { serverTokenHeader } from "@tests/helpers/functions";

const endpointsToTestInvalidJson = [
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
  "claimServer",
  "getToken",
  "whoAmI",
  "unclaimServer",
  "updateServerName",
  "updateServerPath",
];

const dataToTestEndpointsParameters: Array<{
  endpoint: string;
  defaultBody: any;
}> = [
  {
    endpoint: "addPhoto",
    defaultBody: {
      name: "",
      fileSize: 0,
      width: 0,
      height: 0,
      path: "",
      date: "",
      image64: "",
    },
  },
  {
    endpoint: "addPhotoInit",
    defaultBody: {
      name: "",
      fileSize: 0,
      width: 0,
      height: 0,
      path: "",
      date: "",
      image64Len: 0,
    },
  },
  {
    endpoint: "addPhotoPart",
    defaultBody: {
      id: "",
      partNumber: 0,
      partSize: 0,
      photoPart: "",
    },
  },
  {
    endpoint: "deletePhotosById",
    defaultBody: {
      ids: [],
    },
  },
  {
    endpoint: "getPhotoPartById",
    defaultBody: { id: "" },
  },
  {
    endpoint: "getPhotos",
    defaultBody: { number: 0, offset: 0, photoType: "" },
  },
  {
    endpoint: "getPhotosById",
    defaultBody: { ids: [], photoType: "" },
  },
  {
    endpoint: "getPhotosByPath",
    defaultBody: { paths: [], photoType: "" },
  },
  {
    endpoint: "updatePhotoPath",
    defaultBody: { id: "", path: "" },
  },
  {
    endpoint: "claimServer",
    defaultBody: { userToken: "" },
  },
  {
    endpoint: "getToken",
    defaultBody: { userToken: "" },
  },
];

describe("Test endpoints return error when invalid request", () => {
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
    endpointsToTestInvalidJson.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )(
    "Should return BAD_REQUEST when invalid json request for endpoint $endpoint",
    async (p) => {
      const ret = await request(app)
        .post("/" + p.endpoint)
        .set("Content-Type", "application/json")
        .send("{");

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("BAD_REQUEST");
    }
  );

  it.each(dataToTestEndpointsParameters)(
    "should return BAD_REQUEST missing parameters for endpoint $endpoint",
    async (testData) => {
      const parameters = Object.keys(testData.defaultBody);
      for (let i = 0; i < parameters.length; i++) {
        const data = { ...testData.defaultBody };
        delete data[parameters[i]];

        const ret = await request(app)
          .post("/" + testData.endpoint)
          .set(serverTokenHeader())
          .send(data);

        expect(ret.statusCode).toBe(400);
        expect(ret.body.ok).toBe(false);
        expect(ret.body.errorCode).toBe("BAD_REQUEST");
      }
    }
  );
});
