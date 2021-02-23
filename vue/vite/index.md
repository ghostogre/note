**vite 是一个基于 Vue3 单文件组件的非打包开发服务器**，它做到了本地快速开发启动：

1. 快速的冷启动，不需要等待打包操作；
2. 即时的热模块更新，替换性能和模块数量的解耦让更新飞起；
3. 真正的按需编译，不再等待整个应用编译完成，这是一个巨大的改变。
4. 一个开发服务器，它利用 [原生 ES 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 提供了 [丰富的内建功能](https://cn.vitejs.dev/guide/features.html)。
5. 一套构建指令，它使用 [Rollup](https://rollupjs.org/) 打包你的代码，预配置输出高度优化的静态资源用于生产。

在过去的 Webpack、Rollup 等构建工具的时代，我们所写的代码一般都是基于 ES Module 规范，在文件之间通过 `import` 和 `export` 形成一个很大的依赖图。这些构建工具在本地开发调试的时候，也都会**提前把你的模块**先打包成浏览器可读取的 js bundle，虽然有诸如路由懒加载等优化手段，但懒加载并不代表懒构建，Webpack 还是需要把你的异步路由用到的模块提前构建好。

Vite 会在本地帮你启动一个服务器，当浏览器读取到这个 html 文件之后，会在执行到 import 的时候才去向服务端发送 `Main.vue` 模块的请求，Vite 此时在利用内部的一系列黑魔法，包括 Vue 的 template 解析，代码的编译等等，解析成浏览器可以执行的 js 文件返回到浏览器端。这样的话，没有用到的路由也不会拖累构建速度了。

> Vite需要Node.js版本> = 12.0.0。

安装vite：

```bash
$ npm init @vitejs/app
$ yarn create @vitejs/app
```

```bash
# npm 6.x
npm init @vitejs/app my-vue-app --template vue

# npm 7+, extra double-dash is needed:
npm init @vitejs/app my-vue-app -- --template vue

# yarn
yarn create @vitejs/app my-vue-app --template vue
```

vite不仅支持Vue，还支持react等框架。

`index.html` 在项目最外层而不是在 `public` 文件夹里。这是有意而为之的：在开发期间 Vite 是一个服务器，而 `index.html` 是该 Vite 项目的入口点。vite支持使用多个`.html`文件来实现多页面应用。vite有根目录这个概念，这个根目录是指你的文件运行的位置。我们使用相对路径的时候（`import App from './app.vue'`）会使用根目录作为基础路径（`import App from '/src/app.vue'`）。

#### 依赖预编译

依赖预编译，其实是 Vite 2.0 在为用户启动开发服务器之前，先用 `esbuild` 把检测到的依赖预先构建了一遍。(`Esbuild` 使用 Go 编写的构建工具，并且比以 JavaScript 编写的打包器预构建依赖快 10-100 倍)

**怎么还是走启动时编译这条路线了？**

理想中的场景就是浏览器去下载只包含这个函数的文件。但其实没那么理想，经常出现函数的模块内部又依赖了很多其他函数，形成了一个依赖图的情况。浏览器处理的时候发现内部还有其他import，一直延伸下去，会使得请求次数剧增。这当然是不可接受的，于是折中的办法，利用 Esbuild 接近无敌的构建速度，让你在没有感知的情况下在启动的时候预先帮你把所用到的所有内部模块全部打包成一个传统的 js bundle。

在 `httpServer.listen` 启动开发服务器之前，会先把这个函数劫持改写，放入依赖预构建的前置步骤。然后会根据本次运行的入口，来扫描其中的依赖，在扫描到入口文件（比如 `index.html`）中依赖的模块后，形成类似这样的依赖路径数据结构。之后再根据分析出来的依赖，使用 `Esbuild` 把它们提前打包成单文件的 bundle。这样的话就只会发起一次请求了。

在预构建这个步骤中，还会对 `CommonJS` 模块进行分析，方便后面需要统一处理成浏览器可以执行的 `ES Module`。

#### 指定替代根目录

`vite` 以当前工作目录作为根目录启动开发服务器。当然，你可以通过 `vite serve some/sub/dir` 来指定一个替代的根目录。

#### CSS

css文件会被编译成`\np{color:red;}\n`（`p { color: red; }`）这样的字符串。

## 原理

浏览器直接请求`.vue` 文件，那么文件内容是如何做出解析的呢。**项目是如何在不使用webpack等打包工具的条件下如何直接运行vue文件。**

### vite运行原理

其最大的特点是在浏览器端使用 `export import` 的方式导入和导出模块，在 script 标签里设置 `type="module"` ，然后使用 **ES module**。

> 高度依赖`module script`特性，也就意味着从这里开始抛弃了IE市场

另一个效果就是去掉了webpack打包步骤，不用再将各个模块文件打包成一个bundle，以便支持浏览器的模块化加载。那么**vite是如何处理这些模块**的呢？

另一个效果就是去掉了webpack打包步骤，不用再将各个模块文件打包成一个bundle，以便支持浏览器的模块化加载。那么**vite是如何处理这些模块**的呢？

关键在于vite使用`Koa`构建的服务端，在`createServer`中主要**通过中间件注册相关功能**。

vite 对 `import` 都做了一层处理，其过程如下：

1. 在 koa 中间件里获取请求 body
2. 通过 [es-module-lexer](https://www.npmjs.com/package/es-module-lexer) 解析资源 ast 拿到 import 的内容
3. 判断 import 的资源是否是绝对路径，绝对视为 npm 模块
4. 返回处理后的资源路径，例如：`"vue" => "/@modules/vue"`

将处理的template,script,style等所需的依赖以http请求的形式，通过**query参数形式区分**并加载SFC文件各个模块内容。

vue模块安装在`node_modules`中，浏览器`ES Module`是无法直接获取到项目下node_modules目录中的文件。所以`vite`对`import`都做了一层处理，重写了前缀使其带有`@modules`，以便项目访问引用资源；另一方面，把文件路径都写进同一个@modules中，类似面向切片编程，可以从中再进行其他操作而不影响其他部分资源，比如后续可加入alias等其他配置。

通过koa middleware正则匹配上带有`@modules`的资源，再通过`require('XXX')`获取到导出资源并返给浏览器。

单页面文件的请求有个特点，都是以`*.vue`作为请求路径结尾，当服务器接收到这种特点的http请求，主要处理

- 根据`ctx.path`确定请求具体的vue文件
- 使用`parseSFC`解析该文件，获得`descriptor`，一个`descriptor`包含了这个组件的基本信息，包括`template`、`script`和`styles`等属性
- 然后根据`descriptor`和`ctx.query.type`选择对应类型的方法，处理后返回`ctx.body`
- type为空时表示处理`script`标签，使用`compileSFCMain`方法返回`js`内容
- type为`template`时表示处理`template`标签，使用`compileSFCTemplate`方法返回`render`方法
- type为`style`s时表示处理`style`标签，使用`compileSFCStyle`方法返回`css`文件内容

在浏览器里使用 ES module 是使用 http 请求拿到的模块，所以 vite 必须提供一个` web server` 去代理这些模块， `koa中间件` 就是负责这个事情，vite 通过对请求路径`query.type`的劫持获取资源的内容返回给浏览器，然后通过拼接不同的处理单页面文件解析后的各个资源文件，最后响应给浏览器进行渲染。

## hmr热更新

vite的热更新主要有四步：

1. 通过 watcher 监听文件改动；
2. 通过 server 端编译资源，并推送新资源信息给 client ；
3. 需要框架支持组件 rerender/reload ；
4. client 收到资源信息，执行框架 rerender 逻辑。

在client端，Websocket监听了一些更新的消息类型，然后分别处理：

- **vue-reload** —— vue 组件更新：通过 import 导入新的 vue 组件，然后执行 `HMRRuntime.reload`
- **vue-rerender** —— vue template 更新：通过 import 导入新的 template ，然后执行 `HMRRuntime.rerender`
- **vue-style-update** —— vue style 更新：直接插入新的 stylesheet
- **style-update** —— css 更新：document 插入新的 stylesheet
- **style-remove** —— css 移除：document 删除 stylesheet
- **js-update** —— js 更新：直接执行
- **full-reload** —— 页面 roload：使用 `window.reload` 刷新页面

在server端，通过watcher监听页面改动，根据文件类型判断是js Reload还是vue Reload。通过解析器拿到当前文件内容，并与缓存里的上一次解析结果进行比较，如果发生改变则执行相应的render。

> 当代大部分浏览器都已经支持在`type="module"`的`script`标签下直接执行解析`import`语句，在直接执行到这一步的时候，浏览器会**自动根据目录路径去请求路径下的资源**，只要触发了**请求**，我们就可以“拦截”了，把请求的assets资源截取进行处理，返回给浏览器执行。

## 插件机制

Vite 从 preact 的 WMR 中得到了启发，把插件机制做成**兼容 Rollup** 的格式。

目前和 vite 兼容或者内置的插件，可以查看[vite-rollup-plugins](https://vite-rollup-plugins.patak.dev/)。

Rollup 插件就是 Rollup 对外提供一些时机的钩子，还有一些工具方法，让用户去写一些配置代码，以此介入 Rollup 运行的各个时机之中。（其实webpack也是提供钩子）

