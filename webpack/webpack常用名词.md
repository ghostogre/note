## webpack中的三个概念module、chunk和bundle

**module**：就是js的模块化webpack支持commonJS、ES6等模块化规范，简单来说就是你通过import语句引入的代码。

**chunk**: chunk是webpack根据功能拆分出来的，打包过程中被分组的模块文件（module）叫做chunk，例如异步加载一个模块就是一个chunk，包含三种情况：

	* 你的项目入口（entry）
	* 通过import()动态引入的代码
	* 通过splitChunks拆分出来的代码
	
	分为三类：
	
	entry chunk 包含webpack runtime 代码并且是最先执行的chunk，一旦原本存在运行时（runtime）的entry chunk失去了运行时，这个块就会转而变成initial chunk。
	initial chunk 包含同步加载进来的module且不包含runtime code的chunk 在entry chunk执行后再执行的
	normal chunk 使用require.ensure、System.import、import()异步加载进来的module，会被放到normal chunk中

**bundle**：bundle是webpack打包之后的各个文件，一般就是和chunk是一对一的关系，bundle就是对chunk进行编译压缩打包等处理之后的产出。

### filename

filename 是一个很常见的配置，就是对应于 `entry` 里面的输入文件，经过webpack 打包后输出文件的文件名。

### chunkFilename

`chunkFilename` 指未被列在 `entry` 中，却又需要被打包出来的 `chunk` 文件的名称。一般来说，这个 `chunk` 文件指的就是要**懒加载**的代码。`output.chunkFilename` 默认使用 `[id].js` 或从 `output.filename` 中推断出的值。

由于 `output.chunkFilename` 没有显示指定，就会把 `[name]` 替换为 `chunk` 文件的 `id` 号，如果chunk id是1，所以文件名就是 `1.bundle.js`。

### 一句话总结：

`filename` 指**列在** `entry` 中，打包后输出的文件的名称。

`chunkFilename` 指**未列在** `entry` 中，却又需要被打包出来的文件的名称。

### 内置变量列表：

1. id: Chunk的唯一标识， 从0开始
2. name: Chunk的名称
3. hash：Chunk的唯一标识的Hash值
4. chunkhash: Chunk内容的Hash值
5. query 模块文件名 ？ 后面的字符串
    注： Hash的长度是可以指定的如：[hash:8] ，默认20

## webpackPrefetch、webpackPreload 和 webpackChunkName 到底是干什么的？

### webpackChunkName

在我们的业务代码中，不可能只异步加载一个文件，所以写死肯定是不行的，但是写成 `[name].bundle.js` 时，打包的文件又是意义不明、辨识度不高的 chunk `id`。

```javascript
{
    entry: {
        index: "../src/index.js"
    },
    output: {
        filename: "[name].min.js",  // index.min.js
        chunkFilename: '[name].bundle.js', // 1.bundle.js，chunk id 为 1，辨识度不高
    }
}

// 在 import 的括号里 加注释 /* webpackChunkName: "lodash" */ ，为引入的文件取别名
const { default: _ } = await import(/* webpackChunkName: "lodash" */ 'lodash');
```

### webpackPrefetch 和 webpackPreload

这两个配置一个叫预拉取（Prefetch），一个叫预加载（Preload），两者有些细微的不同，我们先说说 `webpackPreload`。

在上面的懒加载代码里，我们是点击按钮时，才会触发异步加载 `lodash` 的动作，这时候会动态的生成一个 `script` 标签，加载到 `head` 头里

但是如果我们import的时候添加 `webpackPrefetch`:

```javascript
...

const { default: _ } = await import(/* webpackChunkName: "lodash" */ /* webpackPrefetch: true */ 'lodash');

...
```

就会以 `<link ref="prefetch" as="script" href="">` 的形式预拉取 lodash 代码。

`webpackPreload` 是预加载当前导航下可能需要资源，他和 `webpackPrefetch` 的主要区别是：

- preload chunk 会在父 chunk 加载时，以并行方式开始加载。prefetch chunk 会在父 chunk 加载结束后开始加载。
- preload chunk 具有中等优先级，并立即下载。prefetch chunk 在浏览器闲置时下载。
- preload chunk 会在父 chunk 中立即请求，用于当下时刻。prefetch chunk 会用于未来的某个时刻

### 一句话总结：

`webpackChunkName` 是为预加载的文件取别名，`webpackPrefetch` 会在浏览器闲置下载文件，`webpackPreload` 会在父 chunk 加载时并行下载文件。

## hash、chunkhash、contenthash 有什么不同？

### hash

hash 计算是跟整个项目的构建相关,`webpack`在每一次构建的时候都会产生一个`compilation`对象，这个`hash`值就是根据`compilation`内所有的内容计算而来的值。

### chunkhash

因为 hash 是项目构建的哈希值，项目中如果有些变动，hash 一定会变，比如说我改动了 utils.js 的代码，index.js 里的代码虽然没有改变，但是大家都是用的同一份 hash。hash 一变，缓存一定失效了，这样子是没办法实现 CDN 和浏览器缓存的。

chunkhash 就是解决这个问题的，它根据不同的入口文件(Entry)进行依赖文件解析、构建对应的 chunk，生成对应的哈希值。

### contenthash

我们更近一步，index.js 和 index.css 同为一个 chunk，如果 index.js 内容发生变化，但是 index.css 没有变化，打包后他们的 hash 都发生变化，这对 css 文件来说是一种浪费。如何解决这个问题呢？

contenthash 将根据资源内容创建出唯一 hash，也就是说文件内容不变，hash 就不变。

### 一句话总结：

hash 计算与整个项目的构建相关；

chunkhash 计算与同一 chunk 内容相关；

contenthash 计算与文件内容本身相关。

## runtime

runtime，以及伴随的 manifest 数据，主要是指：在浏览器运行时，webpack 用来连接模块化的应用程序的所有代码。runtime 包含：在模块交互时，连接模块所需的加载和解析逻辑。包括浏览器中的已加载模块的连接，以及懒加载模块的执行逻辑。

## Manifest

那么，一旦你的应用程序中，形如 `index.html` 文件、一些 bundle 和各种资源加载到浏览器中，会发生什么？你精心安排的 `/src` 目录的文件结构现在已经不存在，所以 webpack 如何管理所有模块之间的交互呢？这就是 manifest 数据用途的由来……

当编译器(compiler)开始执行、解析和映射应用程序时，它会保留所有模块的详细要点。这个数据集合称为 "Manifest"，当完成打包并发送到浏览器时，会在运行时通过 Manifest 来解析和加载模块。无论你选择哪种[模块语法](https://www.webpackjs.com/api/module-methods)，那些 `import` 或 `require` 语句现在都已经转换为 `__webpack_require__` 方法，此方法指向模块标识符(module identifier)。通过使用 manifest 中的数据，runtime 将能够查询模块标识符，检索出背后对应的模块。

