var webpack = require('webpack');

module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['PhantomJS', 'Chrome'],
    frameworks: [ 'mocha', 'chai' ],
    files: [ './testIndex.js' ],
    preprocessors: {
        './testIndex.js': ['webpack']
    },
    reporters: [ 'mocha' ],
    webpack: {
      devtool: 'cheap-module-source-map',
      entry: 'testIndex.js',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader'
          },
          {
            test: /\.json$/,
            loader: 'json-loader'
          }
        ]
     },
     node: {
       console: false,
       fs: 'empty',
       net: 'empty',
       tls: 'empty'
     }
  },
  webpackServer: {
    noInfo: true
  },
  webpackMiddleware: {
    stats: 'errors-only'
  },
  port: 9876,
  logLevel: config.LOG_INFO,
  client: {
    captureConsole: true
  },
  browserNoActivityTimeout: 10000,
  autoWatch: true,
  // override to true for CI
  singleRun: false,
  colors: true
  });
};
