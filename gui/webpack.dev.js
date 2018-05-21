const config = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');

module.exports = merge(config, {
  mode: "development",
  watch: true,
  watchOptions: {
    ignored: /node_modules|tmp/,
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 3001,
    historyApiFallback: true,
  },
  plugins: [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') }),
  ],
});