在项目中最好不要一遇到问题就一键执行 `eject` 操作， `eject` 操作是不可逆的，执行之后会把所有细节都暴露在我们面前，让项目目录变得很庞大。

## **create-react-app 配置多环境接口**

`create-react-app` 默认是支持多个环境配置文件的：

- `.env`：默认。
- `.env.local`：本地覆盖。**除 test 之外的所有环境都加载此文件**。
- `.env.development`, `.env.test`, `.env.production`：设置特定环境。
- `.env.development.local`, `.env.test.local`, `.env.production.local`：设置特定环境的本地覆盖。

左侧的文件比右侧的文件具有更高的优先级：

- `npm start`: `.env.development.local`, `.env.development`, `.env.local`, `.env`
- `npm run build`: `.env.production.local`, `.env.production`, `.env.local`, `.env`
- `npm test`: `.env.test.local`, `.env.test`, `.env` (注意没有 `.env.local` )

如果要在build的时候使用非生产环境的配置文件，可以使用 **dotenv** 来做环境变量的管理（`dotenv` 可将环境变量从 .env 文件加载到 `process.env`中。）

### **写好各个环境的配置文件**

首先，我们可以写好每个环境下的配置文件。

```text
# .env.development
REACT_APP_BASE_URL='http://development.xxx.xxx'
# env.production
REACT_APP_BASE_URL='http://production.xxx.xxx'
```

### **修改 `package.json` 中的 `scripts`来指定环境**

```json
"scripts": {
    "start": "react-app-rewired start",
    "build:dev": "dotenv -e .env.development react-app-rewired build",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test",
    "eject": "react-scripts eject"
}
```

这样，当我需要在测试服务器上打包前端代码时，我就可以执行`npm run build:dev`来指定使用 `.env.development`中的环境变量了

## **UMI 配置多环境接口**

有了以上的经验我们就可以知道，其实多环境配置，不外乎就是将各个环境的配置文件分开，并使用额外的手段来在打包时指定对应环境的配置文件。

### **写好各个环境的配置文件**

查看 **[UMI 文档](https://link.zhihu.com/?target=https%3A//umijs.org/zh/config/%23define)** 可知，环境变量被放在 `config/config.js`下的 define 这个配置中，

> 如果你使用 TypeScript 开发，那么配置文件是 config/config.ts。

所以同样的，我们可以将原来的 `config/config.ts` 做个分身，写两份配置文件，分别是 `config/config.dev.ts` 和 `config/config.prod.ts`

### **修改 package.json 中的 scripts 来指定环境**

查看 `umi`生成的模版项目中的`package.json` 可以发现： **`umi` 默认是使用 [cross-env](https://link.zhihu.com/?target=https%3A//www.npmjs.com/package/cross-env)来为 `umi` 打包指定配置文件**。所以我们将`package.json` 中的 `scripts` 改写如下：

```json
"scripts": {
  "start": "react-app-rewired start",
  "build-dev": "cross-env UMI_ENV=dev umi dev",
	"build-test": "cross-env UMI_ENV=test umi build",
	"build-prod": "cross-env UMI_ENV=prod umi build",
},
```

