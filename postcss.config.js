module.exports = {
  sourceMap: true,
  plugins: () => [
    require('autoprefixer')({ browsers: [ 'last 2 versions' ] })
  ]
};