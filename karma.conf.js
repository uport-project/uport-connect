var webpack = require('webpack');

module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    frameworks: [ 'mocha', 'chai' ],
    files: [
      'test/uportsubprovider.js'
      // Current tooling and testing approach does not allow all tests to be run
      // in broswer enviroments.
      // 'test/*.js'
    ],
    preprocessors: {
        'test/uportsubprovider.js': [ 'webpack', 'sourcemap']
        // 'test/*.js': [ 'webpack', 'sourcemap' ]
    },
    reporters: [ 'mocha', 'coverage' ],

    webpack: {
      devtool: 'source-map',
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
              presets: ['es2015']
            }
          },
          {
            test: /\.json$/,
            loader: 'json'
          }
        ],
        postLoaders: [
          {
            test: /\.js$/,
            exclude: /(__tests__|node_modules|bower_components|test)/,
            loader: 'istanbul-instrumenter'
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
       extensions: ['.js', '.json']
     }
  },
  webpackServer: {
    noInfo: true
  },
  coverageReporter: {
    reporters: [
      {type:'lcovonly', subdir: '.'},
      {type:'html', subdir: 'html'}
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
