# Babel

在`Babel`执行编译的过程中，会从项目的根目录下的 `.babelrc`文件中读取配置。`.babelrc`是一个json格式的文件。
在`.babelrc`配置文件中，主要是对**预设(presets)** 和 **插件(plugins)** 进行配置。

```json
{
  "plugins": [
     [
      "transform-runtime",
      {
        "polyfill": false
      }
     ]
   ],
   "presets": [
     [
       "env",
       {
         "modules": false
       }
     ],
     "stage-2",
     "react"
  ]
}
```

## plugins

该属性是告诉babel要使用那些插件，这些插件可以控制如何转换代码。

Babel默认只转换新的javascript语法，而不转换新的API，比如 `Iterator`, `Generator`, `Set`, `Maps`, `Proxy`, `Reflect`, `Symbol`, `Promise` 等全局对象。以及一些在全局对象上的方法(比如 `Object.assign`)都不会转码。
比如说，ES6在Array对象上新增了`Array.form`方法，Babel就不会转码这个方法，如果想让这个方法运行，必须使用 `babel-polyfill`来转换等。

因此：`babel-polyfill`和`babel-runtime`就是为了解决新的API与这种全局对象或全局对象方法不足的问题，因此可以使用这两个插件可以转换的。

### babel-polyfill 

当运行环境中并没有实现的一些方法，`babel-polyfill`会做兼容。 它是通过向全局对象和内置对象的`prototype`上添加方法来实现的。引入polyfill, 我们就可以使用es6方法来编写了，但是**缺点**就是会造成全局空间污染。

### babel-runtime

不管浏览器是否支持ES6，只要是ES6的语法，它都会进行转码成ES5，所以就有很多冗余的代码。不会污染全局对象和内置对象的原型，比如说我们需要Promise，我们只需要`import Promise from 'babel-runtime/core-js/promise'`即可，这样不仅避免污染全局对象，而且可以减少不必要的代码。

