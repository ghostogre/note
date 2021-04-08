## 过渡

CSS3 过渡是元素从一种样式逐渐改变为另一种的效果。

```
transition： CSS属性，花费时间，效果曲线(默认ease)，延迟时间(默认0);
```

## 动画

动画这个平常用的也很多，主要是做一个预设的动画。和一些页面交互的动画效果，结果和过渡应该一样，让页面不会那么生硬！

```
animation：动画名称，一个周期花费时间，运动曲线（默认ease），动画延迟（默认0），播放次数（默认1），是否反向播放动画（默认normal），是否暂停动画（默认running）;
```

### animation-fill-mode

- none：不改变默认行为。    
- forwards ：当动画完成后，保持最后一个属性值（在最后一个关键帧中定义）。    
- backwards：在 animation-delay 所指定的一段时间内，在动画显示之前，应用开始属性值（在第一个关键帧中定义）。 
- both：向前和向后填充模式都被应用

## 形状转换

**transform**：适用于2D或3D转换的元素
**transform-origin**：转换元素的位置（围绕那个点进行转换）。

## 选择器

css3提供的选择器如 `last-child`，`^=`等。

## 阴影

```
box-shadow: 水平阴影的位置 垂直阴影的位置 模糊距离 阴影的大小 阴影的颜色 阴影开始方向（默认是从里往外，设置inset就是从外往里）;
```

## 边框

### 边框图片

```
border-image: 图片url 图像边界向内偏移 图像边界的宽度(默认为边框的宽度) 用于指定在边框外部绘制偏移的量（默认0） 铺满方式--重复（repeat）、拉伸（stretch）或铺满（round）（默认：拉伸（stretch））;
```

### border-image-slice

图片边框向内偏移的距离。格式：`border-image-slice：top right bottom left`。分别指**切割背景图片的四条线距离上右下左的距离**。

### 边框圆角

border-radius

## 背景

### background-clip

制定背景绘制（显示）区域，

#### padding-box

从padding开始绘制（显示），不算border,，相当于把border那里的背景给裁剪掉！

#### content-box

只在内容区绘制（显示），不算padding和border，相当于把padding和border那里的背景给裁剪掉！

### background-origin

background-origin 属性指定 background-position 属性应该是相对位置。

### background-size

## 反射

可以说是倒影。

```
-webkit-box-reflect:方向[ above-上 | below-下 | right-右 | left-左 ]，偏移量，遮罩图片;
```

## 文字

### 换行

语法：`word-break: normal|break-all|keep-all;`

语法：`word-wrap: normal|break-word;`

### 超出省略号

有三行代码，禁止换行，超出隐藏，超出省略号

```css
div
{
    width:200px; 
    border:1px solid #000000;
    overflow:hidden;
    white-space:nowrap; 
    text-overflow:ellipsis;
}
```

### 多行超出省略号

暂时只支持webkit浏览器

```css
div
{
    width:400px;
    margin:0 auto;
    overflow : hidden;
    border:1px solid #ccc;
    text-overflow: ellipsis;
    padding:0 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height:30px;
    height:60px;
}
```

### 文字阴影

语法：`text-shadow: 水平阴影，垂直阴影，模糊的距离，以及阴影的颜色`。

## 颜色

### rgba

一个是rgba（rgb为颜色值，a为透明度）

### hsla

h:色相”，“s：饱和度”，“l：亮度”，“a：透明度”

## 渐变

### 线性渐变

#### linear-gradient

渐变是两种或多种颜色之间的平滑过渡。在创建渐变的过程中，可以指定多个中间颜色值，这个值称为色标。每个色标包含一种颜色和一个位置，浏览器从每个色标的颜色淡出到下一个，以创建平滑的渐变。

```css
-webkit-linear-gradient([<point>||<angle>,]?<stop>,<stop>[,<stop>]*)
-moz-linear-gradient([<point>||<angle>,]?<stop>,<stop>[,<stop>]*)
-o-linear-gradient([<point>||<angle>,]?<stop>,<stop>[,<stop>]*)	
```

第一个数数表示线性渐变的方向。

### 径向渐变

#### radial-gradient

```css
radial-gradient([<position> || <angle>,]?[<shape> || <size>,]?<color-stop>,<color-stop>[,<color-stop>]*);	
```

- `<length>`：用长度值指定径向渐变圆心的横坐标或纵坐标。可以为负值。
- `<percentage>`：用百分比指定径向渐变圆心的横坐标或纵坐标。可以为负值。
- left：设置左边为径向渐变圆心的横坐标值。
- center：设置中间为径向渐变圆心的横坐标值或纵坐标。
- right：设置右边为径向渐变圆心的横坐标值。
- top：设置顶部为径向渐变圆心的纵标值。
- bottom：设置底部为径向渐变圆心的纵标值。

`<shape>`：主要用来定义径向渐变的形状。其主要包括两个值“circle”和“ellipse”：

- circle：如果`<size>`和`<length>`大小相等，那么径向渐变是一个圆形，也就是用来指定圆形的径向渐变
- ellipse：如果`<size>`和`<length>`大小不相等，那么径向渐变是一个椭圆形，也就是用来指定椭圆形的径向渐变。

`<size>`：主要用来确定径向渐变的结束形状大小。如果省略了，其默认值为“farthest-corner”。可以给其显式的设置一些关键词，主要有：

- closest-side：指定径向渐变的半径长度为从圆心到离圆心最近的边；
- closest-corner：指定径向渐变的半径长度为从圆心到离圆心最近的角；
- farthest-side：指定径向渐变的半径长度为从圆心到离圆心最远的边；
- farthest-corner：指定径向渐变的半径长度为从圆心到离圆心最远的角；

### 圆锥渐变

#### conic-gradient

和另外两个渐变的区别在哪里呢？

- `linear-gradient` 线性渐变的方向是一条直线，可以是任何角度
- `radial-gradient`径向渐变是从圆心点以椭圆形状向外扩散

圆锥渐变的渐变方向和起始点：**起始点是图形中心，然后以顺时针方向绕中心实现渐变效果**。

指定圆锥渐变每一段的比例，配合百分比，可以很轻松的实现饼图。

#### 重复圆锥渐变 `repaeting-conic-gradient`

使用了 `repaeting-conic-gradient` 之后，会自动填充满整个区域。

## Filter（滤镜）

## 弹性布局

## 栅格布局

CSS网格布局（又称“网格”），是一种二维网格布局系统。

只需要给容器（网格容器）定义：`display: grid`，并设置列（grid-template-columns）和 行（grid-template-rows）的大小，然后用 grid-column 和 grid-row 定义容器子元素（grid-item项目，网格项）的位置。

- 网格线，组成网格线的分界线。它们可以是列网格线（column grid lines），也可以是行网格线（row grid lines）并且居于行或列的任意一侧。
- 网格轨道（Grid Track）：两个**相邻的网格线之间**为网格轨道。
- 网格单元（Grid Cell）：**两个相邻的列网格线和两个相邻的行网格线**组成的是网格单元，它是最小的网格单元。
- 网格区（Grid Area）：网格区是由任意数量网格单元组成。

> 1. https://www.jianshu.com/p/d183265a8dad

## 多列布局

兼容性有待提高

```css
.newspaper
{
  	/** 页面分成三列显示 */
    column-count: 3;
    -webkit-column-count: 3;
    -moz-column-count: 3;
  	/** 黑色边框分割每一列 */
    column-rule:2px solid #000;
    -webkit-column-rule:2px solid #000;
    -mox-column-rule:2px solid #000;
}
```

## 盒模型

属性允许您以特定的方式定义匹配某个区域的特定元素。

简单粗暴的理解就是：`box-sizing: border-box`的时候，边框和padding包含在元素的宽高之内！

`box-sizing: content-box`的时候，边框和padding不包含在元素的宽高之内！

## 媒体查询

媒体查询，就在监听屏幕尺寸的变化，在不同尺寸的时候显示不同的样式！

## 混合模式

css3的混合模式，两个（background-blend-mode 和 mix-blend-mode）。这两个写法和显示效果都非常像！区别就在于background-blend-mode 是用于同一个元素的**背景图片和背景颜色**的。mix-blend-mode用于一个元素的**背景图片或者颜色和子元素**的。

