# flex 布局

Flexible Box 模型，通常被称为 flexbox，是一种一维的布局模型。它给 flexbox 的子元素之间提供了强大的空间分布和对齐能力。

当使用 flex 布局时，首先想到的是两根轴线 — **主轴和交叉轴**。主轴由 flex-direction 定义，另一根轴垂直于它。

flexbox 的特性是沿着主轴或者交叉轴对齐之中的元素。

## 起始线和终止线

过去，CSS的书写模式主要被认为是水平的，从左到右的。现代的布局方式涵盖了书写模式的范围，所以我们不再假设一行文字是从文档的左上角开始向右书写, 新的行也不是必须出现在另一行的下面。英文是从左到右，阿拉伯文字是从右到左。

用起始和终止来描述比左右更合适。

## Flex 容器

为了创建 flex 容器， 我们把一个容器的 display 属性值改为 flex 或者 inline-flex。 完成这一步之后，容器中的直系子元素就会变为 **flex 元素**。所有CSS属性都会有一个初始值，所以 flex 容器中的所有 flex 元素都会有下列行为：

- 元素排列为一行 (`flex-direction` 属性的初始值是 row)。
- 元素从主轴的起始线开始。
- 元素不会在主维度方向拉伸，但是可以缩小。
- 元素被拉伸来填充交叉轴大小。
- `flex-basis` 属性为 auto。
- `flex-wrap` 属性为 nowrap。

## 简写属性 flex-flow

你可以将两个属性 flex-direction 和 flex-wrap 组合为简写属性 flex-flow。第一个指定的值为 flex-direction ，第二个指定的值为 flex-wrap。

## flex属性

很少看到 flex-grow，flex-shrink，和 flex-basis 属性单独使用，而是混合着写在 flex 简写形式中。

- `flex-basis`；flex元素是在这个基准值的基础上缩放的。

- `flex: none` 可以把flex元素设置为不可伸缩。

- `flex: auto` 等同于 `flex: 1 1 auto`。

- `flex: 1` 或者 `flex: 2` 等等。它相当于`flex: 1 1 0`。元素可以在`flex-basis`为0的基础上伸缩。

