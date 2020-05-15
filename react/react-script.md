create-react-app 在 webpack 上封装了一层 `react-scripts`，一方面是可以使得不习惯 eslint，babel 和 webpack 的新手只需关注于组件的编写，另一方面是可以不断的更新和改进默认选项，而不会影响到业务代码。

可见，`react-scripts` 的作用就是通过将一些底层配置封装起来，从而向上屏蔽了众多细节，使得业务开发者只需关注业务代码的开发。

- 其中，scripts 文件夹里面包含了项目的开发脚本和构建脚本，对应的 webpack 配置则放在在 config 文件夹里面。

如果要修改这些配置有三种办法：

（1）通过 `react-app-rewired` 覆盖默认的 webpack 配置。

（2）fork 对应的 `react-scripts`包， 自己维护这个依赖包。

（3）直接 eject 出整个配置在业务项目里维护。该操作的缺点是不可逆，一旦配置文件暴露后就不可再隐藏。

