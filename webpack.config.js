'use strict';

// Webpack
const webpack = require('webpack')

// Plugin Setup
const globalsPlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true')),
  'process.env': { 'NODE_ENV': JSON.stringify('development') }
})

let libraryName = 'uportlib'
let outputFile = libraryName + '.js'

// Final Config
module.exports = {
  entry: './lib/index.js',
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
    console: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    extensions: ['', '.js', '.json']
  },
  devTool: 'inline-source-map',
  plugins: [globalsPlugin]
}
