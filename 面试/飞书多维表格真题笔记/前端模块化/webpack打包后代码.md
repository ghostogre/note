### 打包单一模块

**webpack.config.js**

```js
module.exports = {
    entry:"./chunk1.js",
    output: {
        path: __dirname + '/dist',
        filename: '[name].js'
    },
};
```

**chunk1.js**

```js
var chunk1=1;
exports.chunk1=chunk1;
```

**main.js**（webpack生成的一些注释已经去掉）

```js
 (function(modules) { // webpackBootstrap
     // modules就是一个数组，元素就是一个个函数体，就是我们声明的模块
     // The module cache 缓存已经加载了的模块
     var installedModules = {};
     // The require function
     function __webpack_require__(moduleId) {
         // moduleId就是调用是传入的0
         // Check if module is in cache
       	 // installedModules[0]是undefined，继续往下，也就是说没有保存缓存
         if(installedModules[moduleId])
             return installedModules[moduleId].exports;
         // Create a new module (and put it into the cache)
       	 // module就是{exports: {},id: 0,loaded: false}
         var module = installedModules[moduleId] = {
             exports: {},
             id: moduleId,
             loaded: false
         };
         // Execute the module function
         modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
         // 表明模块已经载入
         module.loaded = true;
         // Return the exports of the module
         return module.exports;
     }

		 // 在函数上添加了m，c，p属性
     // expose the modules object (__webpack_modules__)
   	 // m 属性保存的是传入的模块数组
     __webpack_require__.m = modules;
   	 // c 属性保存的是installedModules变量
     // expose the module cache
     __webpack_require__.c = installedModules;
     // __webpack_public_path__
   	 // P 是一个空字符串
     __webpack_require__.p = "";
     // Load entry module and return exports
     return __webpack_require__(0);
 })([function(module, exports) {
    var chunk1=1;
    exports.chunk1=chunk1;
}]);
```

这其实就是一个立即执行函数，简化一下就是：

```js
(function(module){})([function(){},function(){}]);
```

```js
modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)
// 其实就是
modules[moduleId].call({}, module, module.exports, __webpack_require__)
```

但是并不是等价，call能确保当模块中使用this的时候，this是指向module.exports的。

```js
function  a(module, exports) {
    var chunk1=1;
    exports.chunk1=chunk1;
}

a(module, exports,__webpack_require__);
```

运行后`module.exports`就是`{chunk1:1}`。所以当我们使用chunk1这个模块的时候（比如`var chunk1=require("chunk1")`，得到的就是一个对象`{chunk1:1}）`。如果模块里没有`exports.chunk1=chunk1`或者`module.exports=chunk1`得到的就是一个空对象`{}`。

### 使用模块

**main.js**

```js
var chunk1=require("./chunk1");
console.log(chunk1);
```

打包后：

```js
(function (modules) { // webpackBootstrap
    // The module cache
    var installedModules = {};
    // The require function
    function __webpack_require__(moduleId) {
        // Check if module is in cache
        if (installedModules[moduleId])
            return installedModules[moduleId].exports;
        // Create a new module (and put it into the cache)
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: false
        };
        // Execute the module function
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        // Flag the module as loaded
        module.loaded = true;
        // Return the exports of the module
        return module.exports;
    }
    // expose the modules object (__webpack_modules__)
    __webpack_require__.m = modules;
    // expose the module cache
    __webpack_require__.c = installedModules;
    // __webpack_public_path__
    __webpack_require__.p = "";
    // Load entry module and return exports
    return __webpack_require__(0);
})([function (module, exports, __webpack_require__) {
  	/** main.js */
    var chunk1=__webpack_require__(1);
    console.log(chunk1);
}, function (module, exports) {
  	/** chunk1.js */
    var chunk1 = 1;
    exports.chunk1 = chunk1;
}]);
```

其实就是多包裹了一个main模块，不过这个模块没有导出项，而且这个模块依赖于chunk1模块。所以当运行`__webpack_require__(0)`的时候，main模块缓存到`installedModules[0]`上，`modules[0].call`（也就是调用main模块）的时候，chunk1被缓存到`installedModules[1]`上，并且导出对象`{chunk1：1}`给模块main使用

### 入口参数为数组

入口参数是字符串不管是多入口还是单入口，最后都会将入口模块的导出项导出，没有导出项就导出{}，而入口参数是数组，就会将最后一个模块导出。

### 使用CommonsChunkPlugin插件

**webpack.config.js**

```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
    entry: {
        main: './main.js',
        main1: './main1.js',
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js'
    },
    plugins: [
        new CommonsChunkPlugin({
        name: "common"
        })
    ]
};
```

main mian1中都require了chunk1，所以chunk1会被打包到common。

```js
(function (modules) { // webpackBootstrap
    // 安装一个 JSONP callback，为了 chunk 加载
    var parentJsonpFunction = window["webpackJsonp"]; // undefined
    window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
        // moreModules 为独立 chunk 代码，chunkIds 标记独立 chunk 唯一性避免按需加载时重复加载
      	// 以main.js中代码为例，chunkIds为[0]，moreModules为
        // [function(module, exports, __webpack_require__) {
        //    var chunk1=__webpack_require__(1);
        //    console.log(chunk1);
        // }]
        // add "moreModules" to the modules object,
        // then flag all "chunkIds" as loaded and fire callback
        var moduleId, chunkId, i = 0, callbacks = [];
        for (; i < chunkIds.length; i++) {
            chunkId = chunkIds[i]; // chunkId = 0
            if (installedChunks[chunkId])
              	// 0 push入callbacks(使用requireEnsure不再是0)
                callbacks.push.apply(callbacks, installedChunks[chunkId]);
            // 赋值为0表明chunk已经loaded
          	installedChunks[chunkId] = 0;
        }
      	// 将 moreModules 覆盖到 modules 上，modules就是作为立即执行函数传参传入的modules
        for (moduleId in moreModules) {
          	// modules[0]会被覆盖
            modules[moduleId] = moreModules[moduleId];
        }
      	// 初次运行到这里的时候 parentJsonpFunction 为 undefined
        if (parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
      	// 初次运行到这里时callbacks=[]
        while (callbacks.length)
            callbacks.shift().call(null, __webpack_require__);
        if (moreModules[0]) {
            installedModules[0] = 0;
            return __webpack_require__(0);
        }
    };
    // The module cache
  	// 缓存模块，通过闭包引用(window["webpackJsonp"]可以访问到)
    var installedModules = {};
    // object to store loaded and loading chunks
    // "0" means "already loaded"
    // Array means "loading", array contains callbacks
  	// 2 为公共chunck唯一ID，0表示已经loaded
    var installedChunks = {
        2: 0
    };
    // The require function
    function __webpack_require__(moduleId) {
        // Check if module is in cache
        if (installedModules[moduleId])
            return installedModules[moduleId].exports;
        // Create a new module (and put it into the cache)
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: false
        };
        // Execute the module function
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        // Flag the module as loaded
        module.loaded = true;
        // Return the exports of the module
        return module.exports;
    }
    // This file contains only the entry chunk.
    // The chunk loading function for additional chunks
    // 按需加载
    __webpack_require__.e = function requireEnsure(chunkId, callback) {
        // "0" 标志着 "已经加载"
        if (installedChunks[chunkId] === 0)
            return callback.call(null, __webpack_require__);
        // 数字意味着 "当前加载".
        if (installedChunks[chunkId] !== undefined) {
            installedChunks[chunkId].push(callback);
        } else {
            // start chunk loading
          	// 利用script加载chunk模块
            installedChunks[chunkId] = [callback];
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.async = true;
          	// 从这里可以看出 __webpack_require__.p 就是加载模块的URL前缀
            script.src = __webpack_require__.p + "" + chunkId + "." + ({ "0": "main", "1": "main1" }[chunkId] || chunkId) + ".js";
            head.appendChild(script);
        }
    };
    // expose the modules object (__webpack_modules__)
    __webpack_require__.m = modules;
    // expose the module cache
    __webpack_require__.c = installedModules;
    // __webpack_public_path__
    __webpack_require__.p = "";
})([, function (module, exports) {
		// __webpack_require__的时候把chunk1存到了installedModules的 index=1 的位置上
    var chunk1 = 1;
    exports.chunk1 = chunk1;

}]);
```

**main.js**

```js
webpackJsonp([0],[function(module, exports, __webpack_require__) {
    var chunk1=__webpack_require__(1);
    console.log(chunk1);
 }]);
```

**main1.js**

```js
webpackJsonp([1],[function(module, exports, __webpack_require__) {
    var chunk1=__webpack_require__(1);
    console.log(chunk1);
}]);
```

多了webpackJsonp函数，立即执行的匿名函数没有立即调用__webpack_require__(0)。common.js 的 modules 的`index: 0` 会添加进 main 和 main1 的 moreModules参数。

修改一下如下：main，main1都分别 require chunk1，chunk2，然后将chunk1打包到公共模块（`minChunks: 3`，chunk2不会被打包到公共模块）。

```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
    entry: {
      main: './main.js',
      main1: './main1.js',
      chunk1: ["./chunk1"] // 单入口数组写法将多个依赖合并到一个chunk中
    },
    output: {
      path: __dirname + '/dist2',
      filename: '[name].js'
    },
    plugins: [
      new CommonsChunkPlugin({
        name: ["chunk1"], // 已经存在的chunk（一般指入口文件）对应的name
        filename: "common.js",
        minChunks: 3,
      })
    ]
};
```

**main.js**

```js
// 调用webpackJsonp，传入的参数[1]为 chunkIds , 第二个参数为 moreModules
webpackJsonp([1], [function (module, exports, __webpack_require__) {
		 var chunk1 = __webpack_require__(1);
    var chunk2 = __webpack_require__(2);
    exports.a = 1;
    console.log(chunk1);
}, , function (module, exports) {
    var chunk2 = 1;
    exports.chunk2 = chunk2;
}
]);
```

**main1.js**

```js
webpackJsonp([2], [function (module, exports, __webpack_require__) {
    var chunk1 = __webpack_require__(1);
    var chunk2 = __webpack_require__(2);
    exports.a = 1;
    console.log(chunk1);
}, , function (module, exports) {
    var chunk2 = 1;
    exports.chunk2 = chunk2;
}
]);
```

**common.js**

```js
/** common.js 传入的 modules */
[function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(1);
}, function (module, exports) {
    var chunk1 = 1;
    exports.chunk1 = chunk1;
}]
```

```js
// main.js 到webpackJsonp里
var moduleId, chunkId, i = 0, callbacks = [];
for (; i < chunkIds.length; i++) {
  chunkId = chunkIds[i]; // 1
  // false, 赋值为0后还是false
  if (installedChunks[chunkId])
    callbacks.push.apply(callbacks, installedChunks[chunkId]);
  installedChunks[chunkId] = 0;
}
// 三个模块
for (moduleId in moreModules) {
  // moduleId: 0,1,2
  // moreModules[1]为空模块，自执行函数的参数(公共模块)会被覆盖，但是参数中的相应模块已经loaded并且缓存
  modules[moduleId] = moreModules[moduleId];
}
if (parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
while (callbacks.length)
  callbacks.shift().call(null, __webpack_require__);
if (moreModules[0]) {
  // installedModules[0]会重新load,但是load的是moreModules[0]，因为modules[0]已经被覆盖，moreModules[0]依赖于 modules[1]、modules[2]，modules[1]已经loaded
  installedModules[0] = 0; // __webpack_require__ 里面会重新赋值 installedModules[0]
  return __webpack_require__(0);
}
```

