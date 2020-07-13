#### ios

必须安装的依赖有：Node（v12以上）、Watchman、Xcode 和 CocoaPods。

推荐使用Homebrew(直接使用brew_install.rb来安装，不能使用root用户安装brew)来安装 Node 和 Watchman：

```bash
brew install node
brew install watchman
```

注意：不要使用 cnpm！cnpm 安装的模块路径比较奇怪，packager不能识别。

```bash
# 使用nrm工具切换淘宝源
npx nrm use taobao

# 如果之后需要切换回官方源可使用
npx nrm use npm
```



**Watchman** 则是监视文件系统变更的工具。安装此工具可以提高开发时的性能（packager 可以快速捕捉文件的变化从而实现实时刷新）。

React Native 目前需要**Xcode** 10 或更高版本。

**CocoaPods**是用 Ruby 编写的包管理器。从 0.60 版本开始 react native 的 iOS 版本需要使用 CocoaPods 来管理依赖。

