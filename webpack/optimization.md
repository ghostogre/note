# optimization

公共代码提取 ,webpack4弃用`CommonsChunkPlugin`,内置 `optimization`

## minimize /  boolean

`production` 模式下，这里默认是 `true`。告知 webpack 使用插件压缩JS代码。

## minimizer

可以自定义`UglifyJsPlugin`和一些配置，默认的压缩为`uglifyjs-webpack-plugin`。

```javascript
minimizer: [
  (compiler) => {
    const TerserPlugin = require('terser-webpack-plugin');
    new TerserPlugin({ /* your config */ }).apply(compiler);
  }
] // 函数式的使用，非函数直接使用new + plugin名称
```

