const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './dist/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  },
  optimization: {
    usedExports: false,
  },
  externals: {
    sharp: 'commonjs sharp',
    sqlite3: 'commonjs sqlite3',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/sharp', to: 'node_modules/sharp' },
        { from: 'node_modules/sqlite3', to: 'node_modules/sqlite3' },
      ],
    }),
  ],
};
