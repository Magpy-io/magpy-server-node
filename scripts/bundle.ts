import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs/promises';
import { join } from 'path';

require('dotenv').config();

if (!process.env.BUNDLE_OUTPUT_FOLDER) {
  console.log('BUNDLE_OUTPUT_FOLDER env var not defined.');
  process.exit(1);
}

const outputPath = process.env.BUNDLE_OUTPUT_FOLDER;

fs.rm(outputPath, { force: true, recursive: true })
  .then(() => {
    return bundle();
  })
  .then(() => {
    console.log('Finished bundling project.');
  })
  .catch(err => {
    console.log('Error while bundling project.');
    console.log(err);
  });

async function bundle() {
  await build({
    entryPoints: ['./dist/src/index.js'],
    bundle: true,
    minify: true,
    external: ['*.node'],
    platform: 'node',
    outfile: join(outputPath, 'js/bundle.js'),
    plugins: [
      copy({
        assets: [
          {
            from: ['./client/build/**/*'],
            to: ['../client/build'],
          },
          {
            from: ['./node_modules/sharp/build/Release/*'],
            to: ['../build/Release'],
          },
          {
            from: ['./node_modules/sharp/vendor/**/*'],
            to: ['../vendor'],
          },
          {
            from: ['./node_modules/sqlite3/build/Release/*.node'],
            to: ['../build/Release'],
          },
        ],
      }),
    ],
  });

  const p = require('../package.json');
  await fs.writeFile(join(outputPath, '.version_' + p.version), '', 'utf-8');
}
