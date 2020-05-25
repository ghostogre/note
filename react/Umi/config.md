##  chainWebpack

```js
export default {
  chainWebpack(memo, { env, webpack, createCSSRule }) {
    // 设置 alias
    memo.resolve.alias.set('foo', '/tmp/a/b/foo');

    // 删除 umi 内置插件
    memo.plugins.delete('progress');
    memo.plugins.delete('friendly-error');
    memo.plugins.delete('copy');
  }
}
```

参数有，

- memo，当前 webpack-chain对象
- env，当前环境，`development`、`production` 或 `test` 等
- webpack，webpack 实例，用于获取其内部插件
- createCSSRule，用于扩展其他 CSS 实现，比如 sass, stylus

```js
export default {
  async chainWebpack(memo) {
    await delay(100);
    memo.resolve.alias.set('foo', '/tmp/a/b/foo');
  }
}
```

## history

1. `browser`：支持H5的浏览器，`createBrowserHistory`。
2. `hash`：使用url的hash，`createHashHistory`。
3. `memory`：在没有dom的环境里使用，例如RN。`createMemoryHistory`