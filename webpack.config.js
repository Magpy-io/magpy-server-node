const path = require('path');

module.exports = {
  target: 'node',
  entry: './dist/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        loader: 'node-loader',
        options: {
          name: '[path][name].[ext]',
        },
      },
    ],
  },
};
