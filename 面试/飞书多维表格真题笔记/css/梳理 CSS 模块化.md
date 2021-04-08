# 梳理 CSS 模块化

最初学习写页面的时候：

- 行内样式，即直接在 html 中的 **style 属性**里编写 css 代码。
- 内嵌样式，即在 html 中的 **style 标签**内编写 class，提供给当前页面使用。
- 导入样式，即在内联样式中 通过 @import 方法，导入其他样式，提供给当前页面使用。
- 外部样式，即使用 html 中的 link 标签，加载样式，提供给当前页面使用。

使用**行内样式的缺点**

- 样式不能复用。
- 样式权重太高，样式不好覆盖。
- 表现层与结构层没有分离。
- 不能进行缓存，影响加载效率。

### 为什么不建议使用导入样式？

经测试，在 css 中使用 @import 会有以下两种情况：

1、在 IE6-8 下，@import 声明指向的样式表并不会与页面其他资源并发加载，而是等页面**所有资源加载完成后才开始下载**。

2、如果在 link 标签中去 @import 其他 css，页面会等到所有资源加载完成后，才开始解析 link 标签中 @import 的 css。

使用导入样式的**缺点**

- 导入样式，只能放在 style 标签的第一行，放其他行则会无效。
- @import 声明的样式表不能充分利用浏览器并发请求资源的行为，其加载行为往往会延后触发或被其他资源加载挂起。
- 由于 @import 样式表的延后加载，可能会导致页面样式闪烁。

### 使用预处理器 Sass/Less

预处理器主要是强化了 css 的语法，弥补了上文说了这些问题，但本质上，打包出来的结果和源生的 css 都是一样的，只是对开发者友好，写起来更顺滑。

### 后处理器 PostCSS

postcss 可以称作为 css 界的 babel，它的实现原理是通过 ast 去分析我们的 css 代码，然后将分析的结果进行处理，从而衍生出了许多种处理 css 的使用场景。

常用的 postcss 使用场景有：

- 配合 stylelint 校验 css 语法
- 自动增加浏览器前缀 autoprefixer
- 编译 css next 的语法

## CSS 模块化定义

> 解决样式命名的冲突

## CSS 模块化的实现方式

### BEM 命名规范

BEM 的意思就是块（block）、元素（element）、修饰符（modifier）。是由 Yandex 团队提出的一种前端命名方法论。

可以让我们的 css 代码层次结构清晰，通过严格的命名也可以解决命名冲突的问题。

### CSS Modules

CSS Modules 指的是我们像 import js 一样去引入我们的 css 代码，代码中的每一个类名都是引入对象的一个属性，通过这种方式，即可在使用时明确指定所引用的 css 样式。

并且 CSS Modules 在打包的时候会自动将类名转换成 hash 值，完全杜绝 css 类名冲突的问题。

### CSS In JS

CSS in JS，意思就是使用 js 语言写 css，完全不需要些单独的 css 文件，所有的 css 代码全部放在组件内部，以实现 css 的模块化。

CSS in JS 其实是一种编写思想，目前已经有超过 40 多种方案的实现，最出名的是 styled-components。

```tsx
import React from "react";
import styled from "styled-components";

// 创建一个带样式的 section 标签
const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`;

<Wrapper></Wrapper>;
```

