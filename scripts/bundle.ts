import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

(async () => {
  const res = await build({
    entryPoints: ['./dist/index.js'],
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
})();
