'use strict';

// Webpack
const webpack = require('webpack')

let libraryName = 'uportlib'
let outputFile = libraryName + '.min.js'

// Final Config
module.exports = {
  entry: './src/index.js',
  output: {
    path: 'dist',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel'
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },
  node: {
    console: false,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    modules: [ './src', 'node_modules' ],
    extensions: ['.js', '.json']
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') }
    })
  ],
}
