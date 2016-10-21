'use strict';

// Webpack
const webpack = require('webpack')

let libraryName = 'uportlib'
let outputFile = libraryName + '.min.js'

// Final Config
module.exports = {
  entry: './src/index.js',
  devtool: 'cheap-source-map',
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
    new webpack.SourceMapDevToolPlugin({
      filename: outputFile + '.map',
      append: false,
      module: true,
      columns: true,
      lineToLine: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') }
    })

  ],
}
