import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { initServer, stopServer } from '@src/server/server';
import { randomTokenHeader } from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';
import request from 'supertest';

const endpointsToTestServerNotClaimed: Array<{
  endpoint: string;
}> = [
  { endpoint: 'addPhoto' },
  { endpoint: 'addPhotoInit' },
  { endpoint: 'addPhotoPart' },
  { endpoint: 'deletePhotosById' },
  { endpoint: 'getPhotoPartById' },
  { endpoint: 'getNumberPhotos' },
  { endpoint: 'getPhotos' },
  { endpoint: 'getPhotosById' },
  { endpoint: 'getPhotosByMediaId' },
  { endpoint: 'updatePhotoMediaId' },
  { endpoint: 'whoAmI' },
];

describe('Test endpoints return error when invalid token', () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNotClaimed(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it.each(endpointsToTestServerNotClaimed)(
    'Should return error SERVER_NOT_CLAIMED when server was not claimed before for endpoint $endpoint',
    async p => {
      const ret = await request(app)
        .post('/' + p.endpoint)
        .set(randomTokenHeader())
        .set('Content-Type', 'application/json')
        .send({});

      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe('SERVER_NOT_CLAIMED');
    },
  );
});
