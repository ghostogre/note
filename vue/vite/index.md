**vite 是一个基于 Vue3 单文件组件的非打包开发服务器**，它做到了本地快速开发启动：

1. 快速的冷启动，不需要等待打包操作；
2. 即时的热模块更新，替换性能和模块数量的解耦让更新飞起；
3. 真正的按需编译，不再等待整个应用编译完成，这是一个巨大的改变。
4. 一个开发服务器，它利用 [原生 ES 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 提供了 [丰富的内建功能](https://cn.vitejs.dev/guide/features.html)。
5. 一套构建指令，它使用 [Rollup](https://rollupjs.org/) 打包你的代码，预配置输出高度优化的静态资源用于生产。

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