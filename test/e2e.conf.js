module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['Chrome'],
    frameworks: [ 'mocha', 'chai' ],
    files: ['./e2e/*.js', '../src/*.js'],
    preprocessors: {
      '../src/*.js': ['webpack', 'sourcemap'],
      './e2e/*.js': ['webpack']
    },
    reporters: [ 'mocha', 'coverage' ],
    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader'
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
    port: 9876,
    logLevel: config.LOG_INFO,
    browserNoActivityTimeout: 60000,
    autoWatch: true,
    // override to true for CI
    colors: true,
  });
};
