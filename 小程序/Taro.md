### 小程序的架构

微信小程序主要分为 **逻辑层** 和 **视图层**，以及在他们之下的原生部分。逻辑层主要负责 JS 运行，视图层主要负责页面的渲染，它们之间主要通过 `Event` 和 `Data` 进行通信，同时通过 `JSBridge` 调用原生的 API。

### Taro

**Taro 当前架构只是在开发时遵循了 React 的语法，在代码编译之后实际运行时，和 React 并没有关系**。

