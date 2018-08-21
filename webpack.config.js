const path = require('path')

module.exports = {
  entry: './src/storeList.js',
  mode: 'development',
  output: {
    filename: 'storeList.bundle.js',
    path: path.resolve(__dirname, 'src')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: { presets: ['env'] }
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'file-loader?name=/public/icons/[name].[ext]'
      }
    ]
  },
  resolve: { extensions: ['*', '.js', '.jsx'] }
}
