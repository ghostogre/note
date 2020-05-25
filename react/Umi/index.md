# Umi（乌米）

整合了各个技术栈。

## .umi 临时文件

**.umi 临时目录**是整个 Umi 项目的发动机，你的入口文件、路由等等都在这里，这些是由 umi 内部插件及三方插件生成的。

通常会在 .umi 下看到以下目录

```bash
+ .umi
  + core     # 内部插件生成
  + pluginA  # 外部插件生成
  + presetB  # 外部插件生成
  + umi.ts   # 入口文件
```

临时文件是 Umi 框架中非常重要的一部分，框架或插件会根据你的代码生成临时文件.可以在这里调试代码，但不要在 .git 仓库里提交他，因为他的临时性，每次启动 umi 时都会被删除并重新生成。

## 安装

node 版本是 10.13 或以上。

```bash
# 国内源
$ npm i yarn tyarn -g
# 后面文档里的 yarn 换成 tyarn
$ tyarn -v

# 阿里内网源
$ tnpm i yarn @ali/yarn -g
# 后面文档里的 yarn 换成 ayarn
$ ayarn -v
```

通过官方工具创建项目，

```bash
$ yarn create @umijs/umi-app
# 或 npx @umijs/create-umi-app
```

# 目录结构

一个基础的 Umi 项目大致是这样的，

```bash
.
├── package.json # 插件和插件集，以 @umijs/preset-、@umijs/plugin-、umi-preset- 和 umi-plugin- 开头的依赖会被自动注册为插件或插件集。
├── .umirc.ts # 配置文件，包含 umi 内置功能和插件的配置。
├── .env # 环境变量
├── dist # 编译目录
├── mock # 存储 mock 文件，此目录下所有 js 和 ts 文件会被解析为 mock 文件。
├── public # 此目录下所有文件会被 copy 到输出路径。
└── src
    ├── .umi # 临时文件目录，比如入口文件、路由等
    ├── layouts/index.tsx # 约定路由的全局样式文件
    ├── pages
        ├── index.less
        └── index.tsx
    └── app.ts # 运行时配置文件，可以在这里扩展运行时的能力，比如修改路由、修改 render 方法等。
```

# 配置

Umi 在 `.umirc.ts` 或 `config/config.ts` 中配置项目和插件，支持 es6。一份常见的配置如下，

```bash
export default {
  base: '/docs/',
  publicPath: '/static/',
  hash: true,
  history: {
    type: 'hash',
  },
}
```

## 配置文件

推荐在 `.umirc.ts` 中写配置。如果配置比较复杂需要拆分，可以放到 `config/config.ts` 中，并把配置的一部分拆出去，比如路由。

两者二选一，`.umirc.ts` 优先级更高。

## TypeScript 提示

如果你想在写配置时也有提示，可以通过 umi 的 `defineConfig` 方法定义配置，

```js
import { defineConfig } from 'umi';

export default defineConfig({
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
});
```

## 本地临时配置

可以新建 `.umirc.local.ts`，这份配置会和 `.umirc.ts` 做 deep merge 后形成最终配置。

> 注：`.umirc.local.ts` 仅在 `umi dev` 时有效。`umi build` 时不会被加载。

- `config/config.ts` 对应的是 `config/config.local.ts`
- `.local.ts` 是本地验证使用的临时配置，请将其添加到 `.gitignore`，**务必不要提交到 git 仓库中**
- `.local.ts` 配置的优先级最高，比 `UMI_ENV` 指定的配置更高

## 多环境多份配置

可以通过环境变量 `UMI_ENV` 区分不同环境来指定配置。(在bash里执行命令)

举个例子，

```js
// .umirc.js
export default { a: 1, b: 2 };

// .umirc.cloud.js
export default { b: 'cloud', c: 'cloud' };

// .umirc.local.js
export default { c: 'local' };
```

不指定 `UMI_ENV` 时，拿到的配置是：

```js
{
  a: 1,
  b: 2,
  c: 'local',
}
```

指定 `UMI_ENV=cloud` 时，拿到的配置是：

```js
{
  a: 1,
  b: 'cloud',
  c: 'local',
}
```

# 运行时配置

运行时配置和配置的区别是他跑在浏览器端，基于此，我们可以在这里写函数、jsx、import 浏览器端依赖等等，**注意不要引入 node 依赖**。

## 配置方式

约定 `src/app.tsx` 为运行时配置。

## 配置项

### patchRoutes({ routes })

修改路由。

比如在最前面添加一个 `/foo` 路由，

```bash
export function patchRoutes({ routes }) {
  routes.unshift({
    path: '/foo',
    exact: true,
    component: require('@/extraRoutes/foo').default,
  });
}
```

比如和 `render` 配置配合使用，请求服务端根据响应动态更新路由，

```javascript
let extraRoutes;

export function patchRoutes({ routes }) {
  merge(routes, extraRoutes);
}

export function render() { // 动态路由
  fetch('/api/routes').then((res) => { extraRoutes = res.routes })
}
```

注意：

- 直接 routes，不需要返回

### render(oldRender: Function)

覆写 render。

比如用于**渲染之前**做权限校验，

```javascript
import { history } from 'umi';

export function render(oldRender) {
  fetch('/api/auth').then(auth => {
    if (auth.isLogin) { oldRender() }
    else { history.push('/login'); }
  });
}
```

### onRouteChange({ routes, matchedRoutes, location, action })

在初始加载和路由切换时做一些事情。

比如用于做埋点统计

```javascript
export function onRouteChange({ location, routes, action }) {
  bacon(location.pathname);
}
```

### rootContainer(LastRootContainer, args)

修改交给 react-dom 渲染时的根组件。

比如用于在外面包一个 Provider，

```bash
export function rootContainer(container) {
  return React.createElement(ThemeProvider, null, container);
}
```

args 包含：

- routes，全量路由配置
- plugin，运行时插件机制
- history，history 实例

# Mock 数据

##  约定式 Mock 文件

Umi 约定 `/mock` 文件夹下所有文件为 mock 文件。

## 编写 Mock 文件

如果 `/mock/api.ts` 的内容如下，

```js
export default {
  // 支持值为 Object 和 Array
  'GET /api/users': { users: [1, 2] },

  // GET 可忽略
  '/api/users/1': { id: 1 },

  // 支持自定义函数，API 参考 express@4
  'POST /api/users/create': (req, res) => {
    // 添加跨域请求头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('ok');
  },
}
```

然后访问 `/api/users` 就能得到 `{ users: [1,2] }` 的响应，其他以此类推。

## 如何关闭 Mock？

可以通过配置关闭，

```js
export default {
  mock: false,
};
```

也可以通过环境变量临时关闭，

```bash
$ MOCK=none umi dev
```

## 引入 Mock.js

[Mock.js](http://mockjs.com/) 是常用的辅助生成模拟数据的三方库，借助他可以提升我们的 mock 数据能力。

比如：

```js
import mockjs from 'mockjs';

export default {
  // 使用 mockjs 等三方库
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 50, 'type|0-2': 1 }],
  }),
};
```

## umi build

编译构建 web 产物。通常需要针对部署环境，做特定的配置和环境变量修改。

默认产物输出到项目的 `dist` 文件夹，你可以通过修改配置 `outputPath` 指定产物输出目录。 默认编译时会将 `public` 文件夹内的所有文件，原样拷贝到 `dist` 目录，如果你不需要这个特性，可以通过配置 `chainWebpack` 来删除它。

```js
export default {
  chainWebpack(memo, { env, webpack }) {
    // 删除 umi 内置插件
    memo.plugins.delete('copy');
  }
}
```

> 注意：如果 `public` 里面存在产物同名文件，如 `index.html`，将会导致产物文件被覆盖。

## umi dev

启动本地开发服务器进行项目的开发调试

## umi generate

内置的生成器功能，内置的类型有 `page` ，用于生成最简页面。支持别名调用 `umi g`。可用于快速生成 component、page、layout 等，并且可在插件里被扩展，比如 `umi-plugin-dva` 里扩展了 dva:model，然后就可以通过 `umi g dva:model foo` 快速 dva 的 model。

```bash
$ umi generate <type> <name> [options]
```

这个命令支持扩展，通过 `api.registerGenerator` 注册，你可以通过插件来实现自己常用的生成器。

```ts
import { Generator, IApi } from 'umi';

const createPagesGenerator = function ({ api }: { api: IApi }) {
  return class PageGenerator extends Generator {
    constructor(opts: any) {
      super(opts);
    }
    async writing() {}
  };
}

api.registerGenerator({
  key: 'pages',
  Generator: createPageGenerator({ api }),
});
```

```bash
umi generate page pageName
umi generate page pageName --typescript
umi generate page pageName --less
```

## umi plugin

快速查看当前项目使用到的所有的 `umi` 插件。

## umi help

## umi version|-v

## umi webpack

查看 umi 使用的 webpack 配置。

```bash
$ umi webpack [options]
```

| 可选参数      | 说明                                           |
| ------------- | ---------------------------------------------- |
| rules         | 查看 webpack.module.rules 配置详情             |
| rule=[name]   | 查看 webpack.module.rules 中某个规则的配置详情 |
| plugins       | 查看 webpack.plugins 配置详情                  |
| plugin=[name] | 查看 webpack.plugins 中某个插件的配置详情      |