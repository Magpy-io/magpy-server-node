const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './dist/index.js',
  devtool: 'source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  },
  externals: {
    'E:/Libraries/Documents/Projects/opencloud-server/node_modules/sharp/build/Release/sharp-win32-x64.node':
      'sharp_win32_x64_node',
    'E:/Libraries/Documents/Projects/opencloud-server/node_modules/sqlite3/build/Release/node_sqlite3.node':
      'node_sqlite3_node',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/sharp', to: 'node_modules/sharp' },
        { from: 'node_modules/sqlite3', to: 'node_modules/sqlite3' },
      ],
    }),
  ],
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            bare_returns: true, //allow code with returns outside of functions, solved minimizing error.
          },
        },
      }),
    ],
  },
};
