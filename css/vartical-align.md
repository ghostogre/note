## vertical-align

### 作用对象

行内元素对齐，`inline`，`inline-block`, `inline-table`

### 基线和外边界

![](D:\CodingNote\css\assets\vertical-align-001.png)

这里有三行文本紧挨着。

1. 红线表示行高的顶边和底边。

2. 绿线表示字体高度。

3. 蓝线表示基线。

左边这一行，行高与字体高度**相同**，因此上下方的红色和绿线重叠在了一起。中间一行，行高是`font-size`的两倍。右边一行，行高为`font-size`的一半。

**行内元素的外边界**与自己行高的上、下边对齐。行高比`font-size`小不小**并不重要**。因此上图中红线同时也就表示外边界。

**行内元素的基线**是字符恰好位于其上的那条线，也就是图中的蓝线。大致来说，基线总是穿过**字体高度一半以下**的某一点。

### 行内块

![](D:\CodingNote\css\assets\vertical-align-002.png)

从左到右：包含流内内容（如果一个元素是浮动的，绝对定位的或者是根元素，则该元素被称为流出，反之则是流内）的行内块、包含流内内容且设置了溢出（`overflow: hidden`）的行内块和未包含流内内容（但内容区有高度）的行内块。

红线表示外边距的边界，黄色是边框，绿色的内边距，蓝色是内容区，蓝线是每个行内块元素的基线。

**行内块元素的外边界**即其外边距盒子的上、下两边，也就是图中的红线。

**行内块元素的基线**取决于元素是否包含流内内容：

- 有流内内容的行内块元素，基线就是正常流中最后内容元素的基线（左）。这个最后元素的基线是按照它自己的规则找到的。
- 有流内内容但`overflow`属性值不是`visible`的行内块元素，基线就是外边距盒子的底边（中）。也就是与行内块元素的下外边界重合。
- 没有流内内容的行内块元素，基线同样是外边距盒子的底边（右）。

## 行盒子

![](D:\CodingNote\css\assets\vertical-align-003.png)

行盒子的**顶边**与该行中最顶部元素的顶边重合，**底边**与该行中最底部元素的底边重合。因此图中的红线表示的就是行盒子。

**行盒子的基线**是个变量：

> CSS 2.1没有定义行盒子的基线。

在使用`vertical-align`时这一块应该是最令人困惑的了。也就是说，基线画在哪里需要满足很多条件，比如要符合`vertical-align`指定的条件，同时还要保证行盒子高度最小。这是个自由变量。

因为行盒子的基线并不可见，所以有时候不容易确定它的位置。但实际上有个简单的办法可以令其可见。只要在相关行的开头加上一个字母，比如上图中开头的“x”即可。如果这个字母没有被设置对齐，那么它默认就位于基线之上。

围绕基线的是行盒子中的**文本盒子**。可以简单地把文本盒子看成行盒子内部未经对齐的行内元素。文本盒子的高度等于其父元素的`font-size`。因此，文本盒子只是用来盛放未经格式化的文本的。上图中的绿线表示的就是文本盒子。由于文本盒子与基线关联，所以基线移动它也会跟着移动。

## Vertical-Align的值

### 对齐行内元素的基线和行盒子的基线

![](D:\CodingNote\css\assets\vertical-align-004.png)

- **`baseline`**：元素基线与行盒子基线重合。
- **`sub`**：元素基线移动至行盒子基线下方。
- **`super`**：元素基线移动至行盒子基线上方。
- **<百分比值>**：元素基线相对于行盒子基线向上或向下移动，移动距离等于`line-height`的百分比。
- **<长度值>**：元素基线相对于行盒子基线向上或向下移动指定的距离。

### 相对于行盒子的基线对齐元素的外边界

![](D:\CodingNote\css\assets\vertical-align-005.png)

**`middle`**：元素上、下边的中点与行盒子基线加上x-height的一半对齐。

### 相对于行盒子的文本盒子对齐元素的外边界

![](D:\CodingNote\css\assets\vertical-align-006.png)

还有两种情况是相对于行盒子的基线对齐，因为文本盒子的位置由行盒子的基线决定。

- **`text-top`**：元素的顶边与行盒子的文本盒子的顶边对齐。
- **`text-bottom`**：元素的底边与行盒子的文本盒子的底边对齐。

### 相对于行盒子的外边界对齐元素的外边界

![](D:\CodingNote\css\assets\vertical-align-007.png)

- **`top`**：元素的顶边与行盒子的顶边对齐。
- **`bottom`**：元素的底边与行盒子的底边对齐。

## 容易出错的情况

### 居中图标

```html

<span class="icon middle"></span>
Centered?


<span class="icon middle"></span>
<span class="middle">Centered!</span>

<style type="text/css">
  .icon   { display: inline-block;
            /* size, color, etc. */ }

  .middle { vertical-align: middle; }
</style>
```

![](D:\CodingNote\css\assets\vertical-align-008.png)

因为左侧的情况是文本没对齐，而是仍然位于基线之上。应用`vertical-align: middle`，实际上会导致图标中心与不出头小写字母的中心（x-height的一半）对齐，所以出头的字母会在上方突出出来。

右侧，仍然是对齐整个字体区的垂直中点。结果文本基线稍稍向下移动了一点，于是就实现了文本与图标完美对齐。

### 行盒子基线的移动

这是使用`vertical-align`时一个常见的坑：行盒子基线的位置会受到其中所有元素的影响。假设一个元素采用的对齐方式会导致行盒子移动。由于大多数垂直对齐（除`top`和`bottom`外），都相对于基线计算，因此这会导致该行所有其他元素重新调整位置。

#### example

1. 如果行内有一个很高的元素，这个元素上方和下方都没有空间了，此时要与行盒子的基线对齐，就必须让它移动。矮盒子是`vertical-align: baseline`。左侧的高盒子是`vertical-align: text-bottom`，而右侧的高盒子是`vertical-algin: text-top`。可以看到，基线带着矮盒子移动到了上方。

![](D:\CodingNote\css\assets\vertical-align-009.png)

```html
 <!-- left mark-up -->
 <span class="tall-box text-bottom"></span>
 <span class="short-box"></span>

 <!-- right mark-up -->
 <span class="tall-box text-top"></span>
 <span class="short-box"></span>

 <style type="text/css">
   .tall-box,
   .short-box   { display: inline-block;
                 /* size, color, etc. */ }

   .text-bottom { vertical-align: text-bottom; }
   .text-top    { vertical-align: text-top; }
 </style>
```

​	在通过`vertical-align`的其他值对齐一个较高的元素时，也会出现同样的现象。

2. 即使设置`vertical-align`为`bottom`（左）和`top`（右），也会导致基线移动。这就很奇怪了，因为此时根本不关基线什么事。

   ![](D:\CodingNote\css\assets\vertical-align-010.png)

   ```html
   <!-- left mark-up -->
   <span class="tall-box bottom"></span>
   <span class="short-box"></span>
   
   <!-- right mark-up -->
   <span class="tall-box top"></span>
   <span class="short-box"></span>
   
   <style type="text/css">
     .tall-box,
     .short-box { display: inline-block;
                 /* size, color, etc. */ }
   
     .bottom    { vertical-align: bottom; }
     .top       { vertical-align: top; }
   </style>
   ```

   3. 把两个较大的元素放在一行并垂直对齐它们，基线也会移动以匹配两种对齐。然后，行的高度会调整（左）。再增加一个元素，但该元素对齐方式决定了它不会超出行盒子的边界，所以行盒子不会调整（中）。如果新增的元素会超出行盒子的边界，那么行盒子的高度和基线就会再次调整。在这例子中，前两个盒子向下移动了（右）。

      ![](D:\CodingNote\css\assets\vertical-align-011.png)

      ```html
      <!-- left mark-up -->
      <span class="tall-box text-bottom"></span>
      <span class="tall-box text-top"></span>
      
      <!-- middle mark-up -->
      <span class="tall-box text-bottom"></span>
      <span class="tall-box text-top"></span>
      <span class="tall-box middle"></span>
      
      <!-- right mark-up -->
      <span class="tall-box text-bottom"></span>
      <span class="tall-box text-top"></span>
      <span class="tall-box text-100up"></span>
      
      <style type="text/css">
        .tall-box    { display: inline-block;
                      /* size, color, etc. */ }
      
        .middle      { vertical-align: middle; }
        .text-top    { vertical-align: text-top; }
        .text-bottom { vertical-align: text-bottom; }
        .text-100up  { vertical-align: 100%; }
      </style>
      ```

   ### 行内元素下面可能会有一个小间隙

   行内最后会有一个实际上不存在的空白节点。

   这个间隙来自你的标记中行内元素间的空白。行内元素间的所有空白会折叠为一个。如果我们要通过`width: 50%`实现并排放两个行内元素，那这个空白就会成为障碍。因为一行放不下两个50%再加一个空白，结果就会折行（左）。要删除这个间隙，需要在HTML中通过注释删除空白（右）。

   ![](D:\CodingNote\css\assets\vertical-align-012.png)

   ```html
   <!-- left mark-up -->
   <div class="half">50% wide</div>
   <div class="half">50% wide... and in next line</div>
   
   <!-- right mark-up -->
      <div class="half">50% wide</div><!--
   --><div class="half">50% wide</div>
   
   <style type="text/css">
     .half { display: inline-block;
             width: 50%; }
   </style>
   ```

   