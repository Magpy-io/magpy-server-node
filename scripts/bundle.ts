import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'fs/promises';

(async () => {
  const res = await build({
    entryPoints: ['./dist/src/index.js'],
    bundle: true,
    minify: true,
    external: ['*.node'],
    platform: 'node',
    outfile: './bundle/js/bundle.js',
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
  await fs.writeFile('./bundle/.version_' + p.version, '', 'utf-8');
})();
