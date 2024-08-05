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
            from: ['./node_modules/sharp/build/Release/*.node'],
            to: ['../build/Release'],
          },
          {
            from: ['./node_modules/sharp/vendor/8.14.5/linux-x64/lib/*'],
            to: ['../vendor/8.14.5/linux-x64/lib'],
          },
          {
            from: ['./node_modules/sqlite3/build/Release/*.node'],
            to: ['../build/Release'],
          },
        ],
        watch: true,
      }),
    ],
  });
})();
