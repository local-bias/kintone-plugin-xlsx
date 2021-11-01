const path = require('path');

module.exports = {
  entry: {
    desktop: './src/customize.js',
    config: './src/config.js',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', 'json'],
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
};
