### 开发工作流程

克隆 React 项目后，执行 `yarn` 来获取依赖。 之后，你可以执行以下命令：

- `yarn lint` 检查代码风格。
- `yarn linc` 和 `yarn lint` 差不多，但是运行地更快，因为只检查了分支中的不同文件。
- `yarn test` 运行完整的测试套装。
- `yarn test --watch` 运行交互式的测试监听器。
- `yarn test <pattern>` 匹配文件名，运行响应测试。
- `yarn test-prod` 在生产环境下运行测试，支持和 `yarn test` 一样的选项。
- `yarn debug-test` 和 `yarn test` 差不多，不过多了个调试器，你可以打开 `chrome://inspect` 并审查。
- `yarn flow` 运行 Flow 进行类型检查。
- `yarn build` 新建涉及所有包的 `build` 文件夹。
- `yarn build react/index,react-dom/index --type=UMD` 生成只有 React 和 ReactDOM 的 UMD 版本。

首先，运行 `yarn build`，这会于 `build` 文件夹中生成预先构建的 bundle，还会于 `build/packages` 中生成 npm 包。

想测试你做出的更改的话，最简单的方法就是运行 `yarn build react/index,react-dom/index --type=UMD`，之后再打开 `fixtures/packaging/babel-standalone/dev.html`，该文件已使用 `build` 文件夹内的 `react.development.js` 来应用你的更改。

如果你想测试你对已有 React 项目做出的更改，你可以复制 `build/dist/react.development.js` 和 `build/dist/react-dom.development.js` 或其它构建版本，放入你的应用中并使用这些构建版本而非稳定版。

如果你的项目用 npm，你可以从依赖中删去 `react` 和 `react-dom`，使用 `yarn link` 将其指向本地文件夹的 `build` 目录。请注意，**当请在构建时，传递 `--type=NODE`，而不是 `--type=UMD`。同时，你还需要构建 `scheduler` 的 package：

```bash
cd ~/path_to_your_react_clone/
yarn build react/index,react-dom/index,scheduler --type=NODE

cd build/node_modules/react
yarn link
cd build/node_modules/react-dom
yarn link

cd ~/path/to/your/project
yarn link react react-dom
```

每当你在项目文件夹下运行 `yarn build`，更新版本会出现在 `node_modules` 文件夹，之后可以重新构建项目来测试更改。

如果依然缺少某些 package（例如，可能在项目中使用到 `react-dom/server`），则应始终执行 `yarn build` 进行完整构建。请注意，不带选项运行 `yarn build` 会耗费很长时间。

> 使用自动化代码格式化软件 [Prettier](https://prettier.io/)。 对代码做出更改后，运行 `yarn prettier`。

