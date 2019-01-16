const path = require('path');

module.exports = {
  entry: './src/Connect.js',
  output: {
    filename: 'uport-connect.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'uportconnect',
    libraryExport: 'default',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: require.resolve('pubsub-js'),
        loaders: [
          'imports-loader?define=>false',
          'exports-loader?PubSub'
        ]
      },
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
};
