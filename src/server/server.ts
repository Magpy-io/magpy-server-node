// IMPORTS
import express, { Express } from 'express';
import path from 'path';

import loadEndpoints, { ExtendedRequest } from '../api/endpointsLoader';
import * as config from '../config/config';
import jsonParsingErrorHandler from '../middleware/jsonParsingErrorHandler';
import FilesWaiting from '../modules/waitingFiles';
import { findClientBuildPath } from './findClientBuildPath';

import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown';
import { Server } from 'http';
import { stdinEventEmitter } from '../modules/StdinEvents';

import cors from 'cors';
import { NewRequestId } from 'src/modules/RequestIdGenerator';
import { requestID } from 'src/middleware/requestID';

let app: Express;
let server: Server | null;

export async function initServer() {
  app = express();

  app.on('error', e => {
    console.log(e);
    throw e;
  });

  app.use(cors());

  app.use(
    express.json({
      limit: '50mb',
    }),
  );

  app.use(jsonParsingErrorHandler);

  app.use(requestID);

  loadEndpoints(app);
  console.log('Endpoints loaded');

  if (process.env.NODE_ENV !== 'test') {
    const clientBuildPath = await findClientBuildPath();

    if (!clientBuildPath) {
      throw new Error('Client build not found.');
    }

    // Serve static files from the React app
    app.use(express.static(clientBuildPath));

    // Catch-all route to serve React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

  return new Promise<Express>(resolve => {
    server = app.listen(config.port, () => {
      console.log(`Server is listening on port ${config.port}`);
      resolve(app);
    });
  });
}

export function setupShutdownManager() {
  console.log('Setting up gracefull termination of server');
  if (!server) {
    throw new Error('setupShutdownManager: server not yet initialized');
  }
  const shutdownManager = new GracefulShutdownManager(server);

  stdinEventEmitter.on('notification-icon-clicked', e => {
    if (e == 'exit') {
      shutdownManager.terminate(() => {
        console.log('Server was gracefully terminated');
        process.exit(0);
      });

      // Setup force close if it takes too long.
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    }
  });

  process.on('SIGINT', () => {
    shutdownManager.terminate(() => {
      console.log('Server is gracefully terminated');
      process.exit(0);
    });

    // Setup force close if it takes too long.
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  process.on('SIGTERM', () => {
    shutdownManager.terminate(() => {
      console.log('Server is gracefully terminated');
      process.exit(0);
    });

    // Setup force close if it takes too long.
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}

export function clearFilesWaiting() {
  const files = Array.from(FilesWaiting.values());
  files.forEach(file => {
    clearTimeout(file.timeout);
  });
  FilesWaiting.clear();
}

export async function stopServer(): Promise<null> {
  return new Promise((res, rej) => {
    clearFilesWaiting();
    if (server) {
      server.close(err => {
        server = null;
        if (err) {
          rej(err);
        } else {
          res(null);
        }
      });
    }
  });
}
