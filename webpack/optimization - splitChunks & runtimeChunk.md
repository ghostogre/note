代码分割的本质，就是在**“源码直接上线”**和**“打包为唯一的脚本main.bundle.js”**这两种极端方案之间寻找一种更符合实际场景的中间状态，用可接受的服务器性能压力增加来换取更好的用户体验。**异步模块**和**懒加载模块**从宏观上来讲实际上都属于**代码分割**的范畴。`code splitting`最极端的状况其实就是拆分成打包前的原貌，也就是**源码直接上线**。

webpack4提供了零配置方案，默认入口属性为`./src`，默认输出路径为`./dist`，不再需要配置文件，实现了开箱即用的封装能力，更通俗的讲，webpack会自动查找项目中src目录下的index.js文件，然后选择的模式进行相应的打包操作，最后新建dist目录并生成一个main.js文件。此外针对开发环境和线上环境提供了两种打包模式：`"production"`和`"development"`

webpack4废弃了CommonsChunkPlugin，引入了`optimization.splitChunks`和`optimization.runtimeChunk`，旨在优化chunk的拆分。先介绍一下code splitting下的CommonsChunkPlugin有什么缺点，然后再介绍一下chunk split是怎么进行优化的。

缺点是：

1. 对于某些孩子chunk来说，父chunk的很多模块都是多余的，但是还是加载了。
2. 无法优化异步chunk

## CommmonsChunkPlugin

思路是，即将满足`minChunks`配置想所设置的条件的模块移到一个新的chunk文件中去，这个思路是基于`父子关系`的，也就是这个新产出的new chunk是所有chunk的父亲，在加载孩子chunk的时候，父亲chunk是必须要提前加载的。

## runtimeChunk

其实就是单独分离出webpack的一些运行文件。

默认为`false`，配置 runtimeChunk 会给每个入口添加一个只包含runtime的额外的代码块，name 的值也可以是字符串，不过这样就会给每个入口添加相同的 runtime，配置为函数时，返回当前的entry对象，即可分入口设置不同的runtime。

1. `true`：对于每个`entry`会生成`runtime~${entrypoint.name}`的文件。

2. `'single'`: 会生成一个唯一单独的`runtime.js`文件，就是`manifest`。

3. ###### `multiple`：和`true`一致。

4. `name:{ }`：自定义`runtime`文件的`name`。

   ```javascript
   runtimeChunk: {
     name: entrypoint => `manifest.${entrypoint.name}`
   }
   ```

## splitChunks

对于动态导入模块，默认使用 webpack v4+ 提供的全新的通用分块策略.  SplitChunks 是由 webpack 4 内置的 SplitChunksPlugin 插件提供的能力。

`splitChunks`中默认的代码自动分割要求是下面这样的：

- node_modules中的模块或其他被重复引用的模块

  就是说如果引用的模块来自`node_modules`,那么只要它被引用，那么满足其他条件时就可以进行自动分割。否则该模块需要被重复引用才继续判断其他条件。（对应的就是下文配置选项中的`minChunks`为1或2的场景）

- 分离前模块最小体积下限（默认30k，可修改）

  30k是官方给出的默认数值，它是可以修改的，每一次分包对应的都是服务端的性能开销的增加，所以必须要考虑分包的性价比。

- 对于异步模块，生成的公共模块文件不能超出5个（可修改）

  触发了懒加载模块的下载时，并发请求不能超过5个，对于稍微了解过服务端技术的开发者来说，**【高并发】**和**【压力测试】**这样的关键词应该不会陌生。

- 对于入口模块，抽离出的公共模块文件不能超出3个（可修改）

  也就是说一个入口文件的最大并行请求默认不得超过3个，原因同上。

```javascript
optimization: {
    splitChunks: {
      chunks: 'async', // 默认只作用于异步模块，为`all`时对所有模块生效,`initial`对同步模块有效
      minSize: 30000,  // 表示抽取出来的文件在压缩前的 最小 大小，默认为 30000
      maxSize: 0, // 表示抽取出来的文件在压缩前的 最大 大小，默认为 0，表示不限制最大大小
      minChunks: 1, // 表示被（entry）引用次数，默认为1
      maxAsyncRequests: 5, // 按需(异步)时，最大的并行加载次数，默认为 5
      maxInitialRequests: 3, // 初始化时，最大并行加载次数，默认为 3
      automaticNameDelimiter: '~', // 抽取出来的文件的自动生成名字的分割符，默认为 ~
      name: true, // 抽取出来文件的名字，默认为 true，表示自动生成文件名
      cacheGroups: { // 缓存组
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2, // 一般为非第三方公共模块
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
```

### chunks

可用值：`all`（推荐）, `async`（默认）, 和`initial`。

1. async: 分割异步打包的代码，打包出b和vue两个chunk

2. all: 分割异步同步代码（需要定义新规则，将同步的代码打包）

   ```javascript
     splitChunks: {
       chunks: 'all',
       cacheGroups: {
           a : {
               name: 'a',
               chunks: 'all',
           }
       }
     }
   ```

   

优化是否包含这个chunk。还可以使用 function

```javascript
chunks (chunk) {
  // exclude `my-excluded-chunk`
  return chunk.name !== 'my-excluded-chunk';
}
```

**cacheGroups** 

自定义配置决定生成的文件,缓存策略。

cacheGroups 才是我们配置的关键。它可以继承/覆盖上面 `splitChunks` 中所有的参数值，除此之外还额外提供了三个配置，分别为：`test`, `priority` 和 `reuseExistingChunk`。

- test: 表示要过滤 modules，默认为所有的 modules，可匹配模块路径或 chunk 名字，当匹配的是 chunk 名字的时候，其里面的所有 modules 都会选中；
- priority：表示抽取权重，数字越大表示优先级越高。因为一个 module 可能会满足多个 cacheGroups 的条件，那么抽取到哪个就由权重最高的说了算；
- reuseExistingChunk：表示是否使用已有的 chunk，如果为 true 则表示如果当前的 chunk 包含的模块已经被抽取出去了，那么将不会重新生成新的。

下面我们把所有 node_modules 的模块被不同的 chunk 引入超过 1 次的抽取为 common。

```javascript
cacheGroups: {
  common: {
    test: /[\\/]node_modules[\\/]/,
    name: 'common',
    chunks: 'initial',
    priority: 2,
    minChunks: 2,
  },
}
```

比如我们想把一些基础的框架单独抽取如 react ，然后是业务的基础。

```javascript
cacheGroups: {
  reactBase: {
    name: 'reactBase',
    test: (module) => {
        return /react|redux|prop-types/.test(module.context);
    },
    chunks: 'initial',
    priority: 10,
  },
  common: {
    name: 'common',
    chunks: 'initial',
    priority: 2,
    minChunks: 2,
  },
}
```

简单的 test 匹配 react，误杀的太多，比如有些 react 组件命名就有 react 关键词，结果把这个也打进去了，肯定不是我们想要的。于是就想到从 entry 入口里面定义一个 react 的基础库，核心代码如下：

```javascript
const vendorPkg = [
  'react',
  'react-dom',
  'redux',
  'redux-thunk',
  'react-redux',
  'react-router-dom',
  'react-router-redux',
  'history',
  'prop-types',
  'react-loadable',
];

module.exports = {
  entry: {
    vendor: vendorPkg,
    ...
  }
}
```

然后开始配置 `cacheGroups`，发现不论怎么配置都实现不了其他页面共用这个 vendor。

### CSS 配置

同样对于通过 MiniCssExtractPlugin 生成的 CSS 文件也可以通过 SplitChunks 来进行抽取公有样式等。

如下表示将所有 CSS 文件打包为一个（注意将权重设置为最高，不然可能其他的 cacheGroups 会提前打包一部分样式文件）：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
          priority: 20, 
        }
      }
    }
  }
}
```



