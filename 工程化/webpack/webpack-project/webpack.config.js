var path = require("path");
module.exports = {
  entry: './demo/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /.js$/,
        use: 'babel-loader'
      }
    ]
  }
}
