# tapable

tapable库暴露了很多Hook（钩子）类，为插件提供挂载的钩子。

```javascript
const {
	SyncHook,
	SyncBailHook,
	SyncWaterfallHook,
	SyncLoopHook,
	AsyncParallelHook,
	AsyncParallelBailHook,
	AsyncSeriesHook,
	AsyncSeriesBailHook,
	AsyncSeriesWaterfallHook
 } = require("tapable");
```

钩子上有两个对外的接口：`tap` 和 `call`，`tap`负责注册事件回调，`call`负责触发事件，所有钩子都是继承于一个基类`Hook`。以`SyncHook`为例：

```javascript
// 工厂类的作用是生成不同的compile方法，compile本质根据事件注册顺序返回控制流代码的字符串。最后由`new Function`生成真实函数赋值到各个钩子对象上。
class SyncHookCodeFactory extends HookCodeFactory {
    content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
            onError: (i, err) => onError(err),
            onDone,
            rethrowIfPossible
        });
    }
}
const factory = new SyncHookCodeFactory();
// 覆盖Hook基类中的tapAsync方法，因为`Sync`同步钩子禁止以tapAsync的方式调用
const TAP_ASYNC = () => {
    throw new Error("tapAsync is not supported on a SyncHook");
};
// 覆盖Hook基类中的tapPromise方法，因为`Sync`同步钩子禁止以tapPromise的方式调用
const TAP_PROMISE = () => {
    throw new Error("tapPromise is not supported on a SyncHook");
};
// compile是每个继承hook的类都需要实现的，需要调用各自的工厂函数来生成钩子的call方法。
const COMPILE = function(options) {
    factory.setup(this, options);
    return factory.create(options);
};
function SyncHook(args = [], name = undefined) {
    const hook = new Hook(args, name);  // 实例化父类Hook，并修饰hook
    hook.constructor = SyncHook;
    hook.tapAsync = TAP_ASYNC;
    hook.tapPromise = TAP_PROMISE;
    hook.compile = COMPILE;
    return hook;
}
```

## tap

在`Hook`基类中，关于`tap`的代码如下：

```javascript
class Hook{
    constructor(args = [], name = undefined){
        this.taps = []
    }
    tap(options, fn) {
        this._tap("sync", options, fn);
    }
    _tap(type, options, fn) {
        // 这里省略入参预处理部分代码
        this._insert(options);
    }
}
```

最终会执行到`this._insert`方法中，而`this._insert`的工作就是将回调`fn`插入到内部的`taps`数组中，并依据`before`或`stage`参数来调整`taps`数组的排序。具体代码如下：

```javascript
_insert(item) {
	// 每次注册事件时，将call重置，需要重新编译生成call方法
  this._resetCompilation();
  let before;
  if (typeof item.before === "string") {
    before = new Set([item.before]);
  } else if (Array.isArray(item.before)) {
    before = new Set(item.before);
  }
  let stage = 0;
  if (typeof item.stage === "number") {
    stage = item.stage;
  }
  let i = this.taps.length;
  // while循环体中，依据before和stage调整回调顺序
  while (i > 0) {
    i--;
    const x = this.taps[i];
    this.taps[i + 1] = x;
    const xStage = x.stage || 0;
    if (before) {
      if (before.has(x.name)) {
        before.delete(x.name);
        continue;
      }
      if (before.size > 0) {
        continue;
      }
    }
    if (xStage > stage) {
      continue;
    }
    i++;
    break;
  }
  this.taps[i] = item;  // taps暂存所有注册的回调函数
}
```

不论是调用`tap`，`tapAsync`或者`tapPromise`，都会将回调`handler`暂存至`taps`数组中，清空之前已经生成的`call`方法(`this.call = this._call`)。

## call

注册好事件回调后，接下来该如何触发事件了。同样的，`call`也存在三种调用方式：`call`，`callAsync`，`promise`，分别对应三种`tap`注册方式。触发同步`Sync`钩子事件时直接使用`call`方法，触发异步`Async`钩子事件时需要使用`callAsync`或`promise`方法，继续看看在`Hook`基类中`call`是如何定义的：

```javascript
const CALL_DELEGATE = function(...args) {
    // 在第一次执行call时，会依据钩子类型和回调数组生成真实执行的函数fn。并重新赋值给this.call
    // 在第二次执行call时，直接运行fn，不再重复调用_createCall
    this.call = this._createCall("sync");
    return this.call(...args);
};
class Hook {
    constructor(args = [], name = undefined){
        this.call = CALL_DELEGATE
        this._call = CALL_DELEGATE
    }
	
    compile(options) {
        throw new Error("Abstract: should be overridden");
    }
	
    _createCall(type) {
        // 进入该函数体意味是第一次执行call或call被重置，此时需要调用compile去生成call方法
        return this.compile({
            taps: this.taps,
            interceptors: this.interceptors,
            args: this._args,
            type: type
        });
    }
}
```

`_createCall`会调用`this.compile`方法来编译生成真实调用的`call`方法，但在`Hook`基类中`compile`是空实现。它要求继承`Hook`父类的子类必须实现这个方法(即抽象方法)。回到`SyncHook`中查看`compiler`的实现：

```javascript
const HookCodeFactory = require("./HookCodeFactory");
class SyncHookCodeFactory extends HookCodeFactory {
    content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
            onError: (i, err) => onError(err),
            onDone,
            rethrowIfPossible
        });
    }
}
const factory = new SyncHookCodeFactory();
const COMPILE = function(options) {
    // 调用工厂类中的setup和create方法拼接字符串，之后实例化 new Function 得到函数fn
    factory.setup(this, options);
    return factory.create(options);
};
function SyncHook(args = [], name = undefined) {
    const hook = new Hook(args, name);
    hook.compile = COMPILE;
    return hook;
}
```

在`SyncHook`类中`compile`会调用工厂类`HookCodeFactory`的`create`方法，这里对`create`的内部暂时不表，`factory.create`返回编译好的`function`，最终赋值给`this.call`方法。

这里`Hook`使用了一个技巧——**惰性函数**，当第一次指定`this.call`方法时，此时会运行到`CALL_DELEGATE`函数体中，`CALL_DELEGATE`会重新赋值`this.call`，这样在下一次执行时，直接执行赋值后的`this.call`方法，而不用再次进行生成`call`的过程，从而优化了性能。

惰性函数有两个主要优点：

1. 效率高：惰性函数仅在第一次运行时执行计算逻辑，之后函数再次运行时都返回第一次执行的结果，节约了很多执行时间；
2. 延迟执行：在某些场景下，需要判断一些环境信息，一旦确定后就不再需要重新判断。可以理解为`嗅探程序`。比如可以用下面的方式使用惰性载入重写`addEvent`：

```javascript
function addEvent(type, element, fun) {
    if (element.addEventListener) {
        addEvent = function(type, element, fun) {
            element.addEventListener(type, fun, false);
        };
    } else if (element.attachEvent) {
        addEvent = function(type, element, fun) {
            element.attachEvent("on" + type, fun);
        };
    } else {
        addEvent = function(type, element, fun) {
            element["on" + type] = fun;
        };
    }
    // 覆写了addEvent
    return addEvent(type, element, fun);
}
```

## HookCodeFactory 工厂类

`factory.create`返回编译好的`function`赋值给`call`方法。 每个类型的钩子都会构造一个工厂类负责拼接调度回调`handler`时序的函数字符串，通过`new Function()`的实例化方式来生成执行函数。



### 用法

1. 使用new新建钩子
   - tapable暴露的都是类方法，new一个类方法获得我们的钩子。
   - class接受数组参数options，非必传。类方法会根据传参，在监听钩子的时候接受同样数量的参数。

```javascript
	const hook = new SyncHook(['arg1', 'arg2'])
```

2. 使用`tap/tapAsync/tapPromise`绑定钩子：提供了同步和异步绑定钩子函数的方法

   | Async                         | Sync       |
   | ----------------------------- | ---------- |
   | 绑定：tapAsync/tapPromise/tap | 绑定：tap  |
   | 触发：callAsync/promise       | 触发：call |

3. `call/callAsync`执行绑定事件

   ```javascript
   const hook1 = new SyncHook(['arg1', 'arg2', 'arg3'])
   // 绑定事件到事件流
   hook1.tap('hook1', (arg1, arg2, arg3) => {
       console.log(arg1, arg2, arg3)
   })
   // 执行绑定的事件
   hook1.call(1, 2, 3)
   ```

   | type           | function                                                     |
   | -------------- | ------------------------------------------------------------ |
   | Basic Hook     | 按照事件注册顺序，依次执行`handler`，`handler`之间互不干扰； |
   | WaterFall Hook | 同步方法，按照事件注册顺序，依次执行`handler`，前一个`handler`的返回值将作为下一个`handler`的入参； |
   | Bail Hook      | 当`handler`有任何返回值，就会在当前执行`handler`停止         |
   | Loop Hook      | 按照事件注册顺序，依次执行`handler`，若任一`handler`的返回值不为`undefined`，则该事件链再次**从头**开始执行，直到所有`handler`均返回`undefined` |
   | Sync           | 同步方法                                                     |
   | AsyncSeries    | 异步串行钩子                                                 |
   | AsyncParallel  | 异步并行执行钩子                                             |
   
   

### webpack 入口 `（webpack.config.js+shell options）`

从配置文件和 `Shell` 语句中读取与合并参数，得出最终的参数。

> 每次在命令行输入 webpack 后，操作系统都会去调用 `./node_modules/.bin/webpack` 这个 shell 脚本。这个脚本会去调用 `./node_modules/webpack/bin/webpack.js` 并追加输入的参数，如 -p , -w 。
>

### 用`yargs`参数解析 （`optimist`）

```javascript
yargs.parse(process.argv.slice(2), (err, argv, output) => {})
```

### webpack初始化

构建compiler对象：

```javascript
let compiler = new Webpack(options)
```

注册`NodeEnvironmentPlugin`插件：

```javascript
new NodeEnvironmentPlugin().apply(compiler);
```

挂载在options中的基础插件，调用`WebpackOptionApply`库初始化基础插件。

```javascript
if (options.plugins && Array.isArray(options.plugins)) {
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
compiler.options = new WebpackOptionsApply().process(options, compiler)
```

### `run`开始编译

```javascript
if (firstOptions.watch || options.watch) {
    const watchOptions = firstOptions.watchOptions || firstOptions.watch || options.watch || {}
    if (watchOptions.stdin) {
        process.stdin.on("end", function (_) {
            process.exit()
        })
        process.stdin.resume()
    }
    compiler.watch(watchOptions, compilerCallback)
    if (outputOptions.infoVerbosity !== 'none') console.log('\nwebpack is watching the files…\n')
} else compiler.run(compilerCallback)
```

这里分为两种情况：

1）Watching：监听文件变化

2）run：执行编译

### 触发`compile`

1. 在`run`的过程中，已经触发了一些钩子：`beforeRun > run > beforeCompile > compile > make > seal`(编写插件的时候，就可以把自定义的方法挂在对应的钩子上)

2. 构建了关键的`compilation`对象

   

在`run`方法中，执行了`this.compile()`。

`this.compile()`中创建了`compilation`。

```javascript
this.hooks.beforeRun.callAsync(this, err => {
    ...
	this.hooks.run.callAsync(this, err => {
        ...
		this.readRecords(err => {
            ...
			this.compile(onCompiled);
		});
	});
});

...

compile(callback) {
	const params = this.newCompilationParams();
	this.hooks.beforeCompile.callAsync(params, err => {
		...
		this.hooks.compile.call(params);
		const compilation = this.newCompilation(params);
		this.hooks.make.callAsync(compilation, err => {
            ...
			compilation.finish();
			compilation.seal(err => {
                ...
				this.hooks.afterCompile.callAsync(compilation, err 
				    ...
					return callback(null, compilation);
				});
			});
		});
	});
}
```

```javascript
const compilation = this.newCompilation(params);
```

`Compilation`负责整个编译过程，包含了每个构建环节所对应的方法，内部保留了对`compiler`的引用。

当 webpack 以开发模式运行，没检测到文件变化，一次新的`Compilation`将被创建。

**Compilation很重要，编译生产资源和变换文件都靠它。**

### addEntry() `make分析入口文件创建模块对象`

compile中触发`make`事件并调用`addEntry`。

webpack的make钩子，`tapAsync`注册了一个`DllEntryPlugin`，就是将入口模块通过调用`compilation.addEntry`方法将所有的入口模块添加到编译构建队列中，开启编译流程。

#### DllEntryPlugin.js

```javascript
compiler.hooks.make.tapAsync("DllEntryPlugin", (compilation, callback) => {
    compilation.addEntry(
    	this.context,
        new DllEntryDependency(
        	this.entries.map((e, idx) => {
                const dep = new SingleEntryDependency(e)
                dep.loc = {
                    name: this.name,
                    index: idx
                }
                return dep
            })
        ),
        this.name,
        callback
    )
})
```

流程走到这里让我觉得很奇怪：刚刚还在`Compiler.js`中执行`compile`，怎么一下子就到了`DllEntryPlugin.js`?

这就要说道之前`WebpackOptionsApply.process()`初始化插件的时候，执行了`compiler.hooks.entryOption.call(options.context, options.entry)`;

#### WebpackOptionsApply.js

```javascript
class WebpackOptionsApply extends OptionsApply {
	process(options, compiler) {
	    ...
	    compiler.hooks.entryOption.call(options.context, options.entry);
	}
}
```

#### DllPlugin.js

```javascript
compiler.hooks.entryOption.tap("DllPlugin", (context, entry) => {
    const itemToPlugin = (item, name) => {
        if (Array.isArray(item)) {
            return new DllEntryPlugin(context, item, name)
        }
        throw new Error('DllPlugin: supply an Array as entry')
    }
    if (typeof entry === 'object' && !Array.isArray(entry)) {
        Object.keys(entry).forEach(name => {
            itemToPlugin(entry[name], name).apply(compiler)
        })
    } else {
        itemToPlugin(entry, 'main').apply(compiler)
    }
    return true
})
```

其实addEntry方法，存在很多入口，`SingleEntryPlugin`也注册了`compiler.hooks.make.tapAsync`钩子。这里主要再强调一下`WebpackOptionsApply.process()`流程。

### 构建模块

`compilation.addEntry`中执行`_addModuleChain()`这个方法主要做了两件事情，一是根据模块的类型获取对应的模块工厂并创建模块，二是创建模块。

通过 `ModuleFactory.create`方法创建模块，（有`NormalModule `, `MultiModule` , `ContextModule` , `DelegatedModule `等）对模块使用的loader进行加载。调用 acorn 解析经 loader 处理后的源文件生成抽象语法树 AST。遍历 AST，构建该模块所依赖的模块。

```javascript
addEntry(context, entry, name, callback) {
	const slot = {
		name: name,
		request: entry.request,
		module: null
	};
	this._preparedEntrypoints.push(slot);
	this._addModuleChain(
		context,
		entry,
		module => {
			this.entries.push(module);
		},
		(err, module) => {
			if (err) {
				return callback(err);
			}

			if (module) {
				slot.module = module;
			} else {
				const idx = this._preparedEntrypoints.indexOf(slot);
				this._preparedEntrypoints.splice(idx, 1);
			}
			return callback(null, module);
		}
	);
}
```

### 封装构建结果（seal）

webpack 会监听 seal事件调用各插件对构建后的结果进行封装，要逐次对每个 module 和 chunk 进行整理，生成编译后的源码，合并，拆分，生成 hash 。 同时这是我们在开发时进行代码优化和功能添加的关键环节。

```javascript
template.getRenderMainfest.render()
```

通过模板（MainTemplate、ChunkTemplate）把chunk生产_webpack_requie()的格式。

### 输出资源（emit）

把Assets输出到output的path中。

### 总结

webpack是一个**插件合集**，由 `tapable` 控制各插件在 `webpack` 事件流上运行。主要依赖的是compilation的编译模块和封装。

webpack 的入口文件其实就实例了Compiler并调用了run方法开启了编译，webpack的主要编译都按照下面的钩子调用顺序执行。

- Compiler:beforeRun 清除缓存
- Compiler:run 注册缓存数据钩子
- Compiler:beforeCompile
- Compiler:compile 开始编译
- Compiler:make 从入口分析依赖以及间接依赖模块，创建模块对象
- Compilation:buildModule 模块构建
- Compiler:normalModuleFactory 构建
- Compilation:seal 构建结果封装， 不可再更改
- Compiler:afterCompile 完成构建，缓存数据
- Compiler:emit 输出到dist目录

一个 Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。

Compilation 对象也提供了很多事件回调供插件做扩展。

Compilation中比较重要的部分是assets 如果我们要借助webpack帮你生成文件,就要在assets上添加对应的文件信息。

compilation.getStats()能得到生产文件以及chunkhash的一些信息等等。