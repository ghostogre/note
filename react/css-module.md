使用`create-react-app`创建的项目,默认情况下就支持`css-module`，`css module`可以设置css全局作用域和局部作用域。

- 样式文件必须以`[name].module.css`或`[name].module.scss`的形式命名。
- 以变量的形式导入样式文件，比如 `import styles from './style.module.css';`
- className以变量引用的方式添加，比如 `className={ styles.title }`

```jsx
import React, { Component } from 'react'
import styles from './Style5.module.scss'

export default class Style5 extends Component {
  render() {
    return (
      <div>
        <div className={styles.title}>我是标题</div>
      </div>
    )
  }
}
```

在`js module`里导入`css module`，导出一个对象（全部的局部类名映射到全局类名）。

```html
<!--最终结果类名会被编译成哈希字符串-->
<div class="Style5_title__lsl4D"></div>
```

如果不想使用默认的哈希值

`:global`切换本地类名为全局范围的类名。（`@keyframes :global(xxx)`)

```css
:global(.wrap) {
  color: green;
}
```

> 对于局部类名，使用驼峰命名（推荐，不强制），比起`style['class-name']`，`style.className`更加清晰。

使用了 `CSS Modules` 后，就相当于给每个 class 名外加了一个 `:local` 这是默认的，也可以显式使用`:local`。

### 组合器

```css
.className {
  color: green;
  background: red;
}

.otherClassName {
  composes: className;
  color: yellow;
}
```

支持组合多个选择器 - `composes: classNameA classNameB;`

也支持组合来自其他文件里的类名。

```css
.otherClassName {
  composes: className from "./style.css";
}
```

注意，请保证不要循环引用，请确保不要在来自不同文件的多个类名中为它们定义不同的值。

同样的，也可以组合全局作用域的类名

```css
.otherClassName {
  composes: globalClassName from global;
}
```