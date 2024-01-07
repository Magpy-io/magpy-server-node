import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import * as sac from "@tests/helpers/setupAndCleanup";

import { getUserId, serverTokenHeader } from "@tests/helpers/functions";
import { SetLastWarningForUser } from "@src/modules/warningsManager";
import {
  WarningPhotosNotOnDiskDeletedType,
  APIPhoto,
} from "@src/api/export/exportedTypes";

describe("Test 'getLastWarning' endpoint", () => {
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

  it("Should return null when no warnings are stored", async () => {
    const ret = await request(app)
      .post("/getLastWarning")
      .set(serverTokenHeader())
      .send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("warning");
    expect(ret.body.data.warning).toBeNull();
  });

  it("Should return the warning when a warning is are stored", async () => {
    const photoMissing: APIPhoto = {
      id: "",
      meta: {
        name: "",
        fileSize: 0,
        width: 0,
        height: 0,
        date: "",
        syncDate: "",
        serverPath: "",
        clientPath: "",
      },
      image64: "",
    };
    const warning: WarningPhotosNotOnDiskDeletedType = {
      code: "PHOTOS_NOT_ON_DISK_DELETED",
      data: {
        photosDeleted: [photoMissing],
      },
    };
    SetLastWarningForUser(getUserId(), warning);

    const ret = await request(app)
      .post("/getLastWarning")
      .set(serverTokenHeader())
      .send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("warning");
    expect(ret.body.data.warning).toEqual(warning);
  });
});
