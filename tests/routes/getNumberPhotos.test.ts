import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  addNPhotos,
  expectToBeOk,
  getDataFromRet,
} from "@tests/helpers/functions";

describe("Test 'getNumberPhotos' endpoint", () => {
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

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n after adding $n photos",
    async (p: { n: number }) => {
      await addNPhotos(p.n);

      const ret = await exportedTypes.GetNumberPhotosPost();

      expectToBeOk(ret);
      expect(ret.warning).toBe(false);
      expect(getDataFromRet(ret).number).toBe(p.n);
    }
  );
});
