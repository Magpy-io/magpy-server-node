import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';
import request from 'supertest';

const endpointsToTestInvalidJson: Array<{
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
  { endpoint: 'claimServer' },
  { endpoint: 'claimServerLocal' },
  { endpoint: 'getToken' },
  { endpoint: 'getTokenLocal' },
  { endpoint: 'whoAmI' },
  { endpoint: 'unclaimServer' },
  { endpoint: 'updateServerName' },
  { endpoint: 'updateServerPath' },
];

describe('Test endpoints return error when invalid request for endpoint $endpoint', () => {
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

  it.each(endpointsToTestInvalidJson)(
    'Should return BAD_REQUEST when invalid json request for endpoint $endpoint',
    async p => {
      const ret = await request(app)
        .post('/' + p.endpoint)
        .set('Content-Type', 'application/json')
        .send('{');

      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe('BAD_REQUEST');
    },
  );
});
