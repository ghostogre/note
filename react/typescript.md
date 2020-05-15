# 基本用法

想要使用JSX必须做两件事：

1. 给文件一个`.tsx`扩展名
2. 启用`jsx`选项

TypeScript具有三种JSX模式：`preserve`，`react`和`react-native`。 这些模式只在代码生成阶段起作用 - 类型检查并不受影响。 在`preserve`模式下生成代码中会保留JSX以供后续的转换操作使用（比如：[Babel](https://babeljs.io/)）。 另外，输出文件会带有`.jsx`扩展名。 `react`模式会生成`React.createElement`，在使用前不需要再进行转换操作了，输出文件的扩展名为`.js`。 `react-native`相当于`preserve`，它也保留了所有的JSX，但是输出文件的扩展名是`.js`。

| 模式           | 输入     | 输出                         | 输出文件扩展名 |
| :------------- | :------- | :--------------------------- | :------------- |
| `preserve`     | `<div/>` | `<div/>`                     | `.jsx`         |
| `react`        | `<div/>` | `React.createElement("div")` | `.js`          |
| `react-native` | `<div/>` | `<div/>`                     | `.js`          |

### `as`操作符

TypeScript在`.tsx`文件里禁用了使用尖括号的类型断言。尖括号和jsx本身的语法冲突，所以我们要使用`as`。

### 类型检查

dom元素使用小写开头，组件使用大写开头。

