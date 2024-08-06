// IMPORTS
import express, { Express } from 'express';
import path from 'path';

import loadEndpoints from '../api/endpointsLoader';
import * as config from '../config/config';
import jsonParsingErrorHandler from '../middleware/jsonParsingErrorHandler';
import FilesWaiting from '../modules/waitingFiles';
import { findClientBuildPath } from './findClientBuildPath';

let app: Express;
let server: ReturnType<typeof app.listen>;

async function initServer() {
  app = express();

  app.use(
    express.json({
      limit: '50mb',
    }),
  );

  app.use(jsonParsingErrorHandler);

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

function clearFilesWaiting() {
  const files = Array.from(FilesWaiting.values());
  files.forEach(file => {
    clearTimeout(file.timeout);
  });
  FilesWaiting.clear();
}

async function stopServer(): Promise<null> {
  return new Promise((res, rej) => {
    clearFilesWaiting();
    if (server) {
      server.close(err => {
        if (err) {
          rej(err);
        } else {
          res(null);
        }
      });
    }
  });
}

export { initServer, stopServer, clearFilesWaiting };
