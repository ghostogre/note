在每个项目的根目录下面，一般都会有一个 `package.json` 文件，其定义了运行项目所需要的各种依赖和项目的配置信息（如名称、版本、许可证等元数据）。

大多数人对 `package.json` 文件的了解，仅停留在：

- 项目名称、项目构建版本、许可证的定义；
- 依赖定义（包括 `dependencies` 字段，`devDependencies` 字段）；
- 使用`scripts`字段指定运行脚本命令的 `npm` 命令行缩写。

使用`yarn init -y`和`npm init -y`命令后会创建一个`package.json`。

```json
{
  "name": "my-test", # 项目名称
  "version": "1.0.0", # 项目版本（格式：大版本.次要版本.小版本）
  "description": "", # 项目描述
  "main": "index.js", # 入口文件，默认是index.js
  "scripts": { # 指定运行脚本命令的 npm 命令行缩写
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [], # 关键词
  "author": "", # 作者
  "license": "ISC" # 许可证
}
```

### React 项目相关

#### 设置应用根路径（homepage）

当我们使用 `create-react-app` 脚手架搭建的 `React` 项目，默认是使用内置的 `webpack` 配置，当`package.json` 中不配置 `homepage` 属性时，build 打包之后的文件资源应用路径默认是 `/`。

一般来说，我们打包的静态资源会部署在 `CDN` 上，为了让我们的应用知道去哪里加载资源，则需要我们设置一个根路径，这时可以通过 `package.json` 中的 `homepage` 字段设置应用的根路径。

当我们设置了 `homepage` 属性后，打包后的资源路径就会加上 `homepage` 的地址

```json
{
  "homepage": "https://xxxx.cdn/my-project",
}
```

#### 开发环境解决跨域问题（proxy）

在做前后端分离的项目的时候，调用接口时则会遇到跨域的问题，当在开发环境中时，可以通过配置 `package.json` 中的 `proxy` 来解决跨域问题，配置如下：

```json
{
  "proxy": "http://localhost:4000"  // 配置你要请求的服务器地址
}
```

注意，当 `create-react-app` 的版本高于 2.0 版本的时候在 `package.json` 中只能配置 `string` 类型，这意味着如果要使用 `package.json` 来解决跨域问题，则只能代理一个服务器地址。

如果要代理多个服务器地址时，则需要安装 `http-proxy-middleware` ，在 `src` 目录下新建 `setupProxy.js` ：

```js
const proxy = require("http-proxy-middleware");
 
module.exports = function(app) {
  app.use(
    proxy("/base", { // 需要转发的请求
      target: "http://localhost:4000", // 目标服务器 host
      changeOrigin: true // 默认false，是否需要改变原始主机头为目标URL
      // 是否代理websockets
      // ws: true,
      // pathRewrite: {
        // '^/api/old-path' : '/api/new-path',
        // 重写请求，比如我们源访问的是api/old-path，那么请求会被解析为/api/new-path
      // },
      // router: {
           // 如果请求主机 == 'dev.localhost:3000',
           // 重写目标服务器 'http://www.example.org' 为 'http://localhost:8000'
           // 'dev.localhost:3000' : 'http://localhost:8000'
      // }
    })
  );
  app.use(
    proxy("/fans", {
      target: "http://localhost:5000",
      changeOrigin: true
    })
  );
};
```

#### 根据开发环境采用不同的全局变量值（自定义字段）

假设有这么一个组件，当组件被点击时，在开发环境时是跳转测试环境的地址，在正式环境时则跳转正式环境的地址。首先，通过配置前面提到的 `scripts` 字段，实现环境变量（NODE_ENV）的设置：

```json
"scripts": {
  "start": "NODE_ENV=development node scripts/start.js",
  "build": "NODE_ENV=production node scripts/build.js",
}
```

##### 方案一

```js
let sentryUrl;
if (process.env.NODE_ENV === 'development') {
    sentryUrl = 'test-sentry.xxx.com';
} else {
    sentryUrl = 'sentry.xxx.com';
}
```

根据不同环境给 `sentryUrl` 设置不同的值。果有多个组件，要根据不同的环境使用不同的服务（多种服务）地址，如果按照上面的写法，项目中将存在许多重复的判断代码，且当服务地址发生变化时，包含这些服务地址的组件都需要相应的做改动，这样明显是不合理的。

##### 方案二

解决方案：相关服务的地址配置在 `package.json`中，同时修改项目的 `webpack` 配置。

注：修改项目的 `webpack` 配置需要 eject 项目的 `webpack` 配置

eject弹出后：

![](D:\CodingNote\项目经验\package.json\ejected.png)

如果需要定制化项目，一般就是在 `config` 目录下对默认的 `webpack` 配置进行修改，在这里我们需要关注 `config/path.js` 和 `config/env.js` 两个文件：

- `env.js` 的主要目的在于读取 `env` 配置文件并将 `env` 的配置信息给到全局变量 `process.env` ；
- `path.js` 的主要目的在于为项目提供各种路径，包括构建路径、 `public` 路径等。

首先，需要在 `package.json` 中配置以下内容：

```json
"scripts": {
  "start": "NODE_ENV=development node scripts/start.js",
  "build": "NODE_ENV=production node scripts/build.js",
},
"sentryPath": {
  "dev": "https://test-sentry.xxx.com",
  "prod": "https://sentry.xxx.com"
 }
```

重写`path.js`:

```js
// 重写 getPublicUrl 方法
const getPublicUrl = (appPackageJson, pathName) => {
  let path;
  switch (process.env.DEPLOY_ENV) {
    case 'development':
      path = require(appPackageJson)[pathName].dev;
      break;
    case 'production':
      path = require(appPackageJson)[pathName].prod;
      break;
    default:
      path = envPublicUrl || require(appPackageJson).homepage;
  }
  return path;
}

// 新增 getSentryPath 方法
const getSentryPath = (appPackageJson) => {
  return getPublicUrl(appPackageJson, 'sentryPath');
}

// config after eject: we're in ./config/
module.exports = {
  ...,
  sentryUrl: getSentryPath(resolveApp('package.json')), // 新增
};
```

`env.js`:

```js
// 修改 getClientEnvironment 方法
function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        ...
      },
      {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PUBLIC_URL: publicUrl,
        SENTRY_URL: paths.sentryUrl // 新增
      }
    );

  const stringified = {
    ...
  };
  return { raw, stringified };
}
```

通过上面的配置，我们就可以在组件中通过 `process.env.SENTRY_URL` 获取到 `sentry` 服务的地址了。

