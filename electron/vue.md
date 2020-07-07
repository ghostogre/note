## 运行

第一次运行`yarn electron:serve`的时候，因为不使用非科学上网，vue devtool 会安装失败（尝试五次后会跳过，直接打开应用）。

```bash
Failed to fetch extension, trying 1 more times
Failed to fetch extension, trying 0 more times
Vue Devtools failed to install: Error: net::ERR_CONNECTION_RESET
```

> 修改background.js（主进程）会重新启动应用。

### 在vue中使用electron模块

默认是`nodeIntegration: false`，这时候我们使用electron的模块，就会报错`Uncaught ReferenceError: __dirname is not defined`，而导致页面无法运行，显示空白。所以如果要使用electron模块的话要保证开启`nodeIntegration: true`。因为关闭这个配置的话，所有的node api都会被屏蔽，包括`require`。

如果想要开启`nodeIntegration`，需要我们创建`vue.config.js`然后复写配置（覆写配置后需要重新启动）：

```js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  }
}
```

然后background.js中通过`process.env.ELECTRON_NODE_INTEGRATION`来判断是否开启。

> PS：虽然说集成了HMR热更新，但是实际上报错修改经常的需要重启才能生效。

