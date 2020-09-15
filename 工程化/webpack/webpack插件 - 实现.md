# 自定义webpack插件

## 一个插件的自我修养

一个合乎规范的插件应满足以下条件：

1. 它是一个具名的函数或者JS类；
2. 在原型链上指定`apply`方法；
3. 指定一个明确的事件钩子并注册回调；
4. 处理 webpack 内部实例的特定数据(`Compiler` 或 `Compilation`)；
5. 完成功能后调用webpack传入的回调等；

其中`条件4、5`并不是必需的，只有功能复杂的插件会同时满足以上五个条件。webpack 中有两个非常重要的内部对象，`compiler`和`compilation`对象，在两者的`hooks`上都事先定义好了不同类型的钩子，这些钩子会在编译的整个过程中在相应时间点时触发。而自定义插件就是“钩住”这个时间点，并执行相关逻辑。

[compiler钩子列表](https://webpack.js.org/api/compiler-hooks/) [compilation钩子列表](https://webpack.js.org/api/compilation-hooks/)

## 自动上传资源的插件

使用webpack打包资源后都会在本地项目中生成一个`dist`文件夹用于存放打包后的静态资源，此时可以写一个自动上传资源文件到CDN的webpack插件，每次打包成功后及时的上传至CDN。

```javascript
const assert = require("assert");
const fs = require("fs");
const glob = require("util").promisify(require("glob"));

// 1. 它是一个具名的函数或者JS类
class AssetUploadPlugin {
    constructor(options) {
        // 这里可以校验传入的参数是否合法等初始化操作
        assert(
            options,
            "check options ..."
        );
    }
    // 2. 在原型链上指定`apply`方法
    // apply方法接收 webpack compiler 对象入参
    apply(compiler) {
        // 3. 指定一个明确的事件钩子并注册回调
        compiler.hooks.afterEmit.tapAsync(  // 因为afterEmit是AsyncSeriesHook类型的钩子，需要使用tapAsync或tapPromise钩入回调
            "AssetUploadPlugin",
            (compilation, callback) => {
                const {
                    outputOptions: { path: outputPath }
                } = compilation;  // 4. 处理 webpack 内部实例的特定数据
                uploadDir(
                    outputPath,
                    this.options.ignore ? { ignore: this.options.ignore } : null
                )
                .then(() => {
                    callback();  // 5. 完成功能后调用webpack传入的回调等；
                })
                .catch(err => {
                    callback(err);
                });
            });
    }
};
// uploadDir就是这个插件的功能性描述
function uploadDir(dir, options) {
    if (!dir) {
        throw new Error("dir is required for uploadDir");
    }
    if (!fs.existsSync(dir)) {
        throw new Error(`dir ${dir} is not exist`);
    }
    return fs
        .statAsync(dir)
        .then(stat => {
            if (!stat.isDirectory()) {
                throw new Error(`dir ${dir} is not directory`);
            }
        })
        .then(() => {
            return glob(
                "**/*",
                Object.assign(
                    {
                        cwd: dir,
                        dot: false,
                        nodir: true
                    },
                    options
                )
            );
        })
        .then(files => {
            if (!files || !files.length) {
                return "未找到需要上传的文件";
            }
            // TODO: 这里将资源上传至你的静态云服务器中，如京东云、腾讯云等
            // ...
        });
}

module.exports = AssetUploadPlugin
```

在webpack中使用：

```javascript
const AssetUploadPlugin = require('./AssetUploadPlugin')
const config = {
    //...
    plugins: [
        new AssetUploadPlugin({
            ignore: []
        })
    ]
}

```

