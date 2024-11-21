import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { initServer, stopServer } from '@src/server/server';
import {
  addNPhotos,
  addNPhotosToDb,
  expectToBeOk,
  generateId,
  getDataFromRet,
} from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';
import { photosExistByIdInDB } from '@src/db/sequelizeDb';

describe('Test db functions', () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it("Test 'photosExistByIdInDB' function all exist", async () => {
    const added = await addNPhotos(3);

    const ids = added.map(photo => photo.id);
    const res = await photosExistByIdInDB(ids);

    const allExists = res.every(e => e);

    expect(res.length).toBe(ids.length);
    expect(allExists).toBe(true);
  });

  it("Test 'photosExistByIdInDB' function some missing", async () => {
    const added = await addNPhotos(3);

    const ids = added.map(photo => photo.id);
    const idsChanged = [generateId(), ids[1], ids[2], generateId()];

    const res = await photosExistByIdInDB(idsChanged);

    expect(res.length).toBe(idsChanged.length);

    expect(res[0]).toBe(false);
    expect(res[1]).toBe(true);
    expect(res[2]).toBe(true);
    expect(res[3]).toBe(false);
  });
});
