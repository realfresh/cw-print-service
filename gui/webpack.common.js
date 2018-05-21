const webpack = require('webpack');
const path = require('path');
const { resolve } = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'electron-renderer',
  entry: ['babel-polyfill' ,'./gui/src/render/index.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          query: {
            compact: true
          },
        },
        include: resolve(__dirname, 'src'),
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader?minimize",
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              plugins: () => [
                require('autoprefixer')({ browsers: [ 'last 2 versions' ] })
              ]
            }
          },
          'resolve-url-loader',
          "sass-loader?sourceMap&outputStyle=compressed",
        ],
        include: resolve(__dirname, 'src/styles'),
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader?minimize&sourceMap=true",
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              plugins: () => [
                require('autoprefixer')({ browsers: [ 'last 2 versions' ] })
              ]
            }
          },
          'resolve-url-loader',
        ],
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader",
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ],
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "app.css",
      chunkFilename: "[id].css"
    }),
    require('autoprefixer'),
    new webpack.NamedModulesPlugin(),
    new CopyWebpackPlugin([
      { from: './gui/resources/', to: './' },
    ]),
  ],
};
