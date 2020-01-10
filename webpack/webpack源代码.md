# webpack

eg.1

```javascript

//***** debug/start.js *****
const webpack = require('../lib/index.js')  // 直接使用源码中的webpack函数
const config = require('./webpack.config')
const compiler = webpack(config)
compiler.run((err, stats)=>{
    if(err){
        console.error(err)
    }else{
        console.log(stats)
    }
})
```



## webpack 启动方式

1. webpack-cli脚手架启动：`webpack ./debug/index.js --config ./debug/webpack.config.js`
2. 通过`require('webpack')`引入包的方式执行：`./bin/webpack.js`

第一种方式最终还是会用require的方式来启动webpack：`eg.1: webpack(config)`

### webpack 编译的起点

一切从`const compiler = webpack(config)`开始。

webpack源码`./lib/webpack.js`:

```javascript
// 省略部分源码，只看关键部分
const webpack = (options, callback) => {
    let compiler = createCompiler(options)
    // 如果传入callback函数，则自启动
    if (callback) {
        compiler.run(err, states) => {
            compiler.close((err2) => {
                callback(err || err2, states)
            })
        }
    }
    return compiler
}
```

webpack函数执行后返回compiler对象，在webpack中存在两个非常重要的核心对象，分别为`compiler`和`compilation`，它们在整个编译过程中被广泛使用。

* **Compiler**类(`./lib/comilper.js`)：webpack的主要引擎，在compiler对象记录了完整的webpack环境信息。在webpack启动到结束，`compiler`只会生成一次。你可以在`compiler`上读到`webpack config`信息，`outputPath`等。
* **Compilation**类(`./lib/Compliation.js`)：代表了一次单一的版本构建和生成资源。`compliation`编译作业可以多次执行，比如webpack工作在`watch`模式下，每次监测到源文件发生变化时，都会重新实例化一个`compilation`对象。一个`compilation`对象表现了当前的模块资源，编译生成环境，变化的文件，以及被跟踪依赖的状态信息。

两者的区别：`compiler`代表的是不变的webpack环境，`compilation`代表的是一次编译作业，每一次的编译都可能不同。

**Compiler**类在函数`createCompiler`中实例化(`./lib/index.js`):

``````javascript
const createCompiler = options => {
    const compiler = new Compiler(options.context)
    // 注册所有的自定义插件
    if (Array.isArray(options.plugins)) {
        for (const plugin of options.plugins) {
             if (typeof plugin === 'function') {
                 plugin.call(compiler, compiler)
             } else {
                 plugin.apply(compiler)
             }
        }
    }
    compiler.hooks.environment.call()
    compiler.hooks.afterEnvironment.call()
    compiler.options = new WebpackOptionsApply().process(options, compiler) // process中注册所有webpack内置的插件
    return compiler
}
``````

`Compiler`类实例化后，如果webpack函数接收了回调`callback`，则直接执行`compiler.run()`方法，那么webpack自动开启编译之旅。如果未指定`callback`回调，需要用户自己调用`run`方法来启动编译（如eg.1中）。

1. `compiler`由`Compiler`实例化，最重要的是`run`方法。
2. 遍历`webpack config`中的**plugins**数组。（webpack函数中会对options做`object schema`的校验）
3. `plugin`：如果`plugin`是函数直接调用他；如果`plugin`是其他类型（主要是object类型），执行plugin对象的apply方法。apply函数签名：`(compiler) => {}`。webpack非常严格的要求我们plugins数组元素必须是函数，或者一个有apply字段的对象且apply是函数，原因就在于此。
4. 调用钩子：`compiler.hooks.environment.call()`和`compiler.hooks.afterEnvironment.call()`
5. `process(options)`：在`webpack config`中，除了plugins还有很多字段，这个就是一个个处理这些字段。

## WebpackOptionsApply().process(options, compiler)

`WebpackOptionsApply`类的工作是对`webpack options`进行初始化。源码文件：`./lib/WebpackOptionsApply.js`，前五十行都是引入各种webpack内置的`Plugin`。猜想`progress`方法是各种`new SomePlugin().apply()`的操作，事实也是如此。

源码(`./lib/WebpackOptionsApply.js`):

```javascript
class WebpackOptionsApply extends OptionsApply {
    constructor () {
        super()
    }
    process (options, compiler) {
        // 传入的配置信息满足要求，处理与配置项相关的逻辑
        if (options.target) {
            new OnePlugin().apply(compiler)
        }
        if (options.devtool) {
            new AnotherPlugin().apply(compiler)
        }
        if ...
        
        new JavascriptModulesPlugin().apply(compiler)
        new JsonModulesPlugin().apply(compiler)
        new ...
        
        compiler.hooks.afterResolvers.call(compiler)
    }
}
```

源码中...省略号省略了很多相似的操作，process函数很长，有接近500行左右的代码，主要做了两件事：

1. `new`很多的`Plugin`，并且`apply`它们。

> 我们知道webpack插件其实就是一个提供apply方法的类，它在合适的时候会被webpack实例化并执行apply方法。而apply方法接收了 compiler 对象，方便在hooks上监听消息。
> 同时在process函数中实例化的各个Plugin都是webpack自己维护的，因此你会发现webpack项目根目录下有很多的以`Plugin`结尾的文件。而用户自定义的插件在之前就已经注册完成了。
> 不同插件有自己不同的使命，它们的职责是钩住compiler.hooks上的一个消息，一旦某个消息被触发，注册在消息上的回调根据hook类型依次调用。所谓“钩住”的三个方式：`tap  tapAsync  tapPromise`，你需要知道`Tapable`的工作原理哦。

2. 根据`options.xxx`配置项进行初始化工作。

process函数执行完，webpack将所有它关心的hook消息都注册完成，等待后续编译过程中挨个触发。

## compiler.run()

(`./lib/Compiler.js`):

```javascript
class Compiler {
    constructor (context) {
        // 所有钩子都是Tapable来提供的，不同钩子在触发时，调用时序也不同
        this.hooks = {
            beforeRun: new AsyncSeriesHook(['compiler']),
            run: new AsyncSeriesHook(['compiler']),
            done: new AsyncSeriesHook(['stats']),
            // ...
        }
    }
    // ...
    run (callback) {
        const onCompiled = (err, compilation) => {
            if (err) return
            const stats = new Stats(compilation)
            this.hooks.done.callAsync(stats, err => {
                if (err) return
                callback(err, stats)
                this.hooks.afterDone.call(this)
            })
        }
        this.hooks.beforeRun.callAsync(this, err => {
            if (err) return
            this.hooks.run.callAsync(this, err => {
                if (err) return
                this.compile(onCompiled)
            })
        })
    }
}
```

在编译过程的相应阶段去调用提前注册好的钩子函数(`this.hooks.xxxx.call()`)。在run函数中出现的钩子有：`beforeRun --> run --> done --> afterDone`。

`run`函数挂在了webpack编译的前期和后期，中期的阶段由`this.compile`来完成。

## compiler.compile()

此函数是模块编译的主战场：

```javascript
compile (callback) {
    const params = this.newCompilationParams() // 初始化模块工厂对象
    this.hooks.beforeCompile.callAsync(params, err => {
        this.hooks.compile.call(params)
        // compilation记录本次的编译信息
        const compilation = new Compilation(this)
        this.hooks.make.callAsync(compilation, err => {
            compilation.finish(err => {
                compilation.seal(err => {
                    this.hooks.afterCompile.callAsync(compilation, err => {
                        return callback(null, compilation)
                    })
                })
            })
        })
    })
}
```

`compile`函数和`run`一样，触发了一系列的钩子函数，在compile函数中出现的钩子有：`beforeCompile --> compile --> make --> afterCompile`。

其中`make`就是我们关心的编译过程。但在这里它仅是一个钩子触发，显然真正的编译执行是注册在这个钩子的回调上面。

webpack因为有Tapable的加持，代码编写非常灵活，node中流行的callback回调机制（说的就是回调地狱），webpack使用的炉火纯青，如果用断点调试，可能不太容易捕捉到。这里我使用搜索关键词的方法反向查找make钩子是在哪里注册的。

通过搜索关键词`hooks.make.tapAsync`我们发现在`lib/EntryPlugin.js`中的apply方法中找到了它的身影。

查一下这个`EntryPlugin`是在什么时候被调用的，继续关键词`new EntryPlugin`搜索，在`lib/EntryOptionPlugin.js`中找到了它，而且其中你发现了熟悉的“东西”：

```javascript
if (typeof entry === 'string' || Array.isArray(entry)) {
    applyEntryPlugins(entry, 'main')
} else if (typeof entry === 'object') {
    for (const name of Object.keys(entry)) {
        applyEntryPlugins(entry[name], name)
    }
} else if (typeof entry === 'function') {
    new DynamicEntryPlugin(context, entry).apply(compiler)
}
```

此时你会明白entry是字符串或数组时，打包出来的资源统一叫`main.js`这个名字了。

继续搜索关键词`new EntryOptionPlugin`，搜索到的文件就是`lib/WebpackOptionsApply.js`。如此一切都明了了，make钩子在process函数中就已经注册好了，就等着你来调用。

回到`lib/EntryPlugin.js`看看`compiler.hooks.make.tapAsync`都干了啥。其实就是运行`compiliation.addEntry`方法，继续探索`compiliation.addEntry`。

```javascript
	addEntry (context, entry, name, callback) {
        this.hooks.addEntry.call(entry, name)
        // entryDependencies中的每一项都代表了一个入口，打包输出就会有多个文件
        let entriesArray = this.entryDependencies.get(name)
        entriesArray.push(entry)
        this.addModuleChain(context, entry, (err, module) => {
            this.hooks.successEntry.call(entry, name, module)
            return callback(null, module)
        })
    }
```

`addEntry`的作用是将模块的入口信息传给模块链，即`addModuleChain`，随后继续调用`compilation.factorizeModule`，这些调用最后会将`entry`翻译成一个模块（严格来说，模块是`NormalModule`实例化的对象）。

相关函数的调用顺序：`this.addEntry --> this.addModuleChain --> this.handleModuleCreation --> this.addModule --> this.buildModule --> this._buildModule --> module.build`(`this指代compiliation`)。

最终会走到`NormalModule`对象(`./lib/NormalModule.js`)中，执行build方法。

在`normalModule.build`方法中会先调用自身`doBuild`方法：

```javascript
const { runLoaders } = require('loader-runner')
doBuild(options, compilation, resolver, fs, callback) {
    // runLoaders从包loader-runner引入的方法
    runLoader({
        resource: this.resource, // 这里的resource可能是js文件，可能是css文件，可能是img文件
        loaders: this.loaders
    }, (err, result) => {
        const source = result[0]
        const sourceMap = result.length >= 1 ? result[1] : null
        const extraInfo = result.length >= 2 ? result[2] : null
        // ...
    })
}
```

其实`doBuild`就是选用合适的`loader`去加载`resource`，目的就是为了将这份`resource`转换为JS模块（原因是webpack只识别JS模块）。最后返回加载后的源文件`source`，以便接下来继续处理。

> webpack对处理标准的JS模块很在行，但处理其他类型文件(css, scss, json, jpg)等就无能为力了，此时它就需要loader的帮助。loader的作用就是转换源代码为JS模块，这样webpack就可以正确识别了。
> loader的作用就像是Linux中信息流管道，它接收源码字符串流，加工一下，然后返回加工后的源码字符串交给下一个loader继续处理。
> loader的基本范式：(code, sourceMap, meta) => string

经过了`doBuild`后，任何的模块都转换成标准JS模块。

接下来就是编译标准JS代码了。在传入`doBuild`的回调函数中这样处理`source`：

```javascript
const result = this.parser.parse(source)
```

这里的`this.parser`就是`JavascriptParser`的实例对象，最终`JavascriptParser`会调用第三方包`acorn`提供的`parse`方法对JS源代码进行语法解析。

````javascript
parse (code, options) {
    // 调用第三方插件acorn解析js模块
    let ast = acorn.parse(code)
    // ...
    // 省略部分代码
    if (this.hooks.program.call(ast, comments) === undefined) {
        this.detectStrictMode(ast.body)
        this.prewalkStatements(ast.body)
        this.blockPrewalkStatements(ast.body)
        // 这里webpack会遍历一次ast.body，其中会收集这个模块的所有依赖，最后写入到module.dependencies中。
        this.walkStatements(ast.body)
    }
}
````

通常我们会使用一些类似于`babel-loader`等 loader 预处理源文件，那么webpack 在这里的parse具体作用是什么呢？parse的最大作用就是收集模块依赖关系，比如调试代码中出现的`import {is} from 'object-is'`或`const xxx = require('XXX')`的模块引入语句，webpack会记录下这些依赖项，记录在`module.dependencies`数组中。

## compiler.seal

上一步收集了依赖，接下来就是如何打包封装模块了。

> 在执行`compilation.seal`(`./lib/Compliation`)之前，你可以打个断点，查看此时`compilation.modules`的情况。此时`compilation.modules`有三个子模块，分别为`./src/index.js`  `node_modules/object.is/index.js` 以及 `node_modules/object.is/is.is`
>

`compilation.seal`的步骤比较多，先封闭模块，生成资源，这些资源保存在`compilation.assets`, `compilation.chunks`。

> 你会在多数第三方webpack插件中看到`compilation.assets` 和 `compilation.chunks` 的身影。

然后调用`compilation.createChunkAssets`方法把所有依赖项通过对应的模板 render 出一个拼接好的字符串：

```javascript
createChunkAssets (callback) {
    asyncLib.forEach(
    	this.chunks,
        (chunk, callback) => {
            // manifest是数组结构，每个manifest都提供了render方法，提供后续的源码字符串生成服务。至于render方法何时初始化的，在`./lib/MainTemplate.js`中
            let manifest = this.getRenderManifest()
            asyncLib.forEach(
            	manifest,
                (fileManifest, callback) => {
					...
					source = fileManifest.render()
                      this.emitAsset(file, source, assetInfo)
                },
                callback
            )
        },
        callback
    )
}
```

值得一提的是，`createChunkAssets`执行过程中，会优先读取cache中是否已经有了相同hash的资源，如果有，则直接返回内容，否则才会继续执行模块生成的逻辑，并存入cache中。

## compiler.hooks.emit.callAsync()

在seal执行后，关于模块所有信息以及打包后源码信息都存在内存中，是时候将它们输出为文件了。接下来就是一连串的callback回调，最后我们到达了`compiler.emitAssets`方法体中。在`compiler.emitAssets`中会先调用`this.hooks.emit`生命周期，之后根据`webpack config`文件的output配置的path属性，将文件输出到指定的文件夹。至此，你就可以在`./debug/dist`中查看到调试代码打包后的文件了。

```javascript
this.hooks.emit.callAsync(compilation, () => {
    outputPath = compilation.getPath(this.outputPath, {})
    mkdirp(this.outputFileSystem, outputPath, emitFiles)
 })
```

简单总结一下 webpack 编译模块的基本流程：

1. 调用`webpack`函数接收`config`配置信息，并初始化`compiler`，在此期间会`apply`所有 `webpack` 内置的插件;
2. 调用`compiler.run`进入模块编译阶段；
3. 每一次新的编译都会实例化一个`compilation`对象，记录本次编译的基本信息；
4. 进入make阶段，即触发`compilation.hooks.make`钩子，从entry为入口：
   a. 调用合适的loader对模块源码预处理，转换为标准的JS模块；
   b. 调用第三方插件acorn对标准JS模块进行分析，收集模块依赖项。同时也会继续递归每个依赖项，收集依赖项的依赖项信息，不断递归下去；最终会得到一颗依赖树🌲；
5. 最后调用`compilation.seal render `模块，整合各个依赖项，最后输出一个或多个chunk；

