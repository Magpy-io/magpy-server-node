const path = require('path');

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './dist/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  },
  externals: {
    sharp: 'commonjs sharp',
    sqlite3: 'commonjs sqlite3',
  },
};
