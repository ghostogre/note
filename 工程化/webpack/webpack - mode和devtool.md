## mode

提供`mode`配置选项将告诉webpack相应地使用其内置优化。

```
string = 'production': 'none' | 'development' | 'production'
```

## 用法

`mode`在配置中提供选项：

```javascript
module.exports = {
  mode: 'development'
};
```

或将其作为cli参数传递：

```bash
webpack --mode=development
```

如果未设置，则webpack设置`production`为的默认值`mode`。

请记住，设置`NODE_ENV`不会自动设置`mode`。

------



## devtool

此选项控制是否生成，以及如何生成 source map。

> Source Map 顾名思义，是保存源代码映射关系的文件。调试的时候希望获取的是报错在哪个具体文件里，而不是打包后的app.js。Source Map 保存了一种映射关系，从源文件到转译文件。
>
> 1. 将输出文件中每个字符位置对应在输入文件名中的原位置（行数和列数）保存起来，并一一进行映射。
> 2. 在经历过压缩和混淆之后，代码基本上不会有多少行（特别是JS，通常只有1到2行）。这样的话，移除输出位置的行数，使用";"号来标识新行。
> 3. 由于可能存在多个输入文件，且描述输入文件的信息比较长，所以可以将输入文件的信息存储到一个数组里，记录文件信息时，只记录它在数组里的索引值就好了。
>
> ```
> sources: ['输入文件1.txt'],
> names: ['I', 'am', 'Chris'],
> mappings: "1|0|1|6|2,7|0|1|1|0,9|0|1|3|1" (长度: 29)
> ```

## sourse-map 中 eval、cheap、inline 和 module 各是什么意思？



| 参数   | 参数解释                                                     |
| ------ | ------------------------------------------------------------ |
| eval   | 打包后的模块都使用 `eval()` 执行，行映射可能不准；不产生独立的 map 文件 |
| cheap  | map 映射只显示行不显示列，忽略源自 loader 的 source map      |
| inline | 映射文件以 base64 格式编码，加在 bundle 文件最后，不产生独立的 map 文件 |
| module | 增加对 loader source map 和第三方模块的映射                  |

### 常用配置：

上面的几个例子都是演示，结合官网推荐和实际经验，常用的配置其实是这几个：

**1.source-map**

大而全，啥都有，就因为啥都有可能会让 webpack 构建时间变长，看情况使用。

**2.cheap-module-eval-source-map**

这个一般是开发环境（dev）推荐使用，在构建速度报错提醒上做了比较好的均衡。

**3.cheap-module-source-map**

一般来说，生产环境是不配 source-map 的，如果想捕捉线上的代码报错，我们可以用这个

### 特别的两个：

### hidden-source-map

就是不在 `bundle` 文件结尾处追加 `sourceURL` 指定其 `sourcemap`文件的位置，但是仍然会生成 `sourcemap` 文件。这样，浏览器开发者工具就无法应用`sourcemap`, 目的是避免把`sourcemap`文件发布到生产环境，造成源码泄露。

### nosources-source-map

`sourcemap` 中不带有源码，这样，`sourcemap` 可以部署到生产环境而不会造成源码泄露，同时一旦出了问题，`error stacks` 中会显示准确的错误信息，比如发生在哪个源文件的哪一行。

### **其他**

### inline-source-map

映射文件以 base64 格式编码，加在 bundle 文件最后，不产生独立的 map 文件。加入 map 文件后，我们可以明显的看到包（bundle）体积变大了。

### cheap-sourse-map

cheap，就是廉价的意思，它不会产生列映射，相应的体积会小很多，我们和 sourse-map 的打包结果比一下，只有原来的 1/4 。

**eval-source-map**

每个模块使用 `eval()` 执行，并且 source map 转换为 DataUrl 后添加到 `eval()` 中。eval-source-map 会以 eval() 函数打包运行模块，不产生独立的 map 文件，会显示报错的**行列**信息。

