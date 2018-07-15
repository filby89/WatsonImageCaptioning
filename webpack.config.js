var path = require('path');
var webpack = require('webpack');



module.exports = {
  entry: './views/bundle.jsx',
  output: {
    path: __dirname + '/public/js',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  node: {
  fs: 'empty'
  },
  module: {
    loaders: [{
      test: /.jsx?$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      query: {
        cacheDirectory: true,
        presets: ['es2015', 'es2017', 'stage-0', 'react']
      }
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }]
  }
};