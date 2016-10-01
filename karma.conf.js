var webpack = require('webpack');

module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],
    frameworks: [ 'mocha', 'chai' ],
    files: [
      'test/uportsubprovider.js'
      // Current tooling and testing approach does not allow all tests to be run
      // in broswer enviroments.
      // 'test/*.js'
    ],
    exclude: [
      'test/istanbul.reporter.js'
    ],
    preprocessors: {
        'test/uportsubprovider.js': [ 'webpack', 'sourcemap' ]
        // 'test/*.js': [ 'webpack', 'sourcemap' ]
    },
    reporters: [ 'mocha', 'coverage' ],
    plugins: [
      'karma-webpack',
      'karma-mocha',
      'karma-coverage',
      'karma-chai',
      'karma-mocha-reporter',
      'karma-chrome-launcher',
      'karma-safari-launcher',
      'karma-firefox-launcher',
      'karma-phantomjs-launcher',
      'karma-sourcemap-loader'
    ],
    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loaders: ['babel']},,
          { test: /\.json$/, loader: 'json'}
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
     }

    },
    webpackServer: {
      noInfo: true
    },
    coverageReporter: {
     reporters: [
         {type:'html', subdir: '.'},
         {type:'lcovonly', subdir: '.'}
     ]
   },
  port: 9876,
  logLevel: config.LOG_INFO,
  autoWatch: true,
  // override to true for CI
  singleRun: false,
  colors: true,
  concurrency: Infinity
  });
};
