'use strict'

// Webpack
const webpack = require('webpack')

let libraryName = 'uportconnect'

// Final Config
module.exports = {
  entry: {'uport-connect': './lib/index.js',
          'uport-connect-core': './lib/indexCore.js'},
  devtool: 'source-map',
  output: {
    filename: 'dist/[name].min.js',
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      // {
      //   test: /\.js$/,
      //   exclude: /(node_modules)/,
      //   loader: 'babel-loader'
      // },
      // {
      //   test: /\.json$/,
      //   loader: 'json-loader'
      // }
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
    extensions: ['.js']
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') }
    })
  ]
}
