React Native 是一个使用React和应用平台的原生功能来构建 Android 和 iOS 应用的开源框架。通过 React Native，您可以使用 JavaScript 来访问移动平台的 API，以及使用 React 组件来描述 UI 的外观和行为：一系列可重用、可嵌套的代码。

React Native 包括一组基本的，随时可用的原生组件，您可以使用它们来构建您的应用程序。这些是 React Native 的**核心组件**。

```js
import { View, Text, Image, ScrollView, TextInput } from 'react-native';
```

1. `TextInput` 是一个允许用户输入文本的基础组件。它有一个名为 onChangeText 的属性，此属性接受一个函数，而此函数会在文本变化时被调用。另外还有一个名为 onSubmitEditing 的属性，会在文本被提交后（用户按下软键盘上的提交键）调用。
2. `ScrollView` 是一个通用的可滚动的容器，你可以在其中放入多个组件和视图，而且这些组件并不需要是同类型的。ScrollView 不仅可以垂直滚动，还能水平滚动（通过horizontal属性来设置）。
3. `FlatList`组件用于显示一个垂直的滚动列表，其中的元素之间结构近似而仅数据不同。FlatList更适于长列表数据，且元素个数可以增删。和ScrollView不同的是，FlatList并不立即渲染所有元素，而是优先渲染屏幕上可见的元素。`FlatList`组件必须的两个属性是`data`和`renderItem`。`data`是列表的数据源，而`renderItem`则从数据源中逐个解析数据，然后返回一个设定好格式的组件来渲染。
4. 如果要渲染的是一组需要分组的数据，也许还带有分组标签的，那么`SectionList`将是个不错的选择。

## Platform 模块

React Native 提供了一个检测当前运行平台的模块。

```tsx
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  height: Platform.OS === "ios" ? 200 : 100,
});
```

`Platform.OS`在 iOS 上会返回`ios`，而在 Android 设备或模拟器上则会返回`android`。

还有个实用的方法是` Platform.select()`，它可以以 Platform.OS 为 key，从传入的对象中返回对应平台的值

```js
Platform.select({
  ios: {
    backgroundColor: "red",
  },
  android: {
    backgroundColor: "blue",
  },
})
```

这一方法可以接受任何合法类型的参数，因此你也可以直接用它针对不同平台返回不同的组件

```tsx
const Component = Platform.select({
  ios: () => require("ComponentIOS"),
  android: () => require("ComponentAndroid"),
})();

<Component />;
```

### 检测版本

在 Android 上，`Version`属性是一个数字，表示 Android 的 api level。

在 iOS 上，`Version`属性是`-[UIDevice systemVersion]`的返回值，具体形式为一个表示当前系统版本的字符串。

## 特定平台扩展名

当不同平台的代码逻辑较为复杂时，最好是放到不同的文件里，这时候我们可以使用特定平台扩展名。React Native 会检测某个文件是否具有`.ios.`或是`.android.`的扩展名，然后根据当前运行的平台自动加载正确对应的文件。

使用的时候去掉平台扩展名，React Native 会根据运行平台的不同自动引入正确对应的组件。

