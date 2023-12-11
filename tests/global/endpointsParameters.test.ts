import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";

const endpointsToTest = [
  "addPhoto",
  "addPhotoInit",
  "addPhotoPart",
  "deletePhotosById",
  "getPhotoPartById",
  "getPhotos",
  "getPhotosById",
  "getPhotosByPath",
  "updatePhotoPath",
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
];

describe("Test endpoints return error when missing parameter", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
    await clearDB();
    await clearImagesDisk();
  });

  beforeEach(async () => {
    console.log("beforeEach");
    await initDB();
  });

  afterEach(async () => {
    console.log("afterEach");
    await clearDB();
    await clearImagesDisk();
  });

  it.each(
    endpointsToTest.map((endpoint) => {
      return {
        endpoint,
      };
    })
  )("Testing invalid json request for endpoint $endpoint", async (p) => {
    const ret = await request(app)
      .post("/" + p.endpoint)
      .send("a");

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("BAD_REQUEST");
  });

  it.each(dataToTestEndpointsParameters)(
    "Testing missing parameters for endpoint $endpoint",
    async (testData) => {
      const parameters = Object.keys(testData.defaultBody);
      for (let i = 0; i < parameters.length; i++) {
        const data = { ...testData.defaultBody };
        delete data[parameters[i]];

        const ret = await request(app)
          .post("/" + testData.endpoint)
          .send(data);

        expect(ret.statusCode).toBe(400);
        expect(ret.body.ok).toBe(false);
        expect(ret.body.errorCode).toBe("BAD_REQUEST");
      }
    }
  );
});
