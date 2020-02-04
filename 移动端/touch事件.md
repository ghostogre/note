## 移动触屏事件

### 1、事件类型

`touchstart`: 手指触摸屏幕时触发

`touchmove`: 手指在屏幕上移动时触发

`touchend`: 手指离开屏幕时触发

`touchcancel`: 手指要移动的事件中，touchmove事件被打断的时候触发（比如突然来了个弹框等）

**细节：**

touch 事件的触发，必须保证元素有大于0的宽高值，否则无法触发。（比如 ul 下 li 有宽高，ul 会被撑开，有了宽高，但是当 li 浮动起来后，ul 的宽还在， 高为0，此时无法对 ul 触发 touch 事件。）

### 2、触摸的 event 对象

event 事件对象是手指触摸屏幕时触发的事件对象，在这个对象中，我们主要关注三个对象数组。

`touches`：指屏幕上所有的触摸的手指列表

`targetTouched`：当前目标上所有的触摸的手指列表

`changedTouches`：指当前屏幕上变换的手指对象。在 touchstart 时为新接触屏幕的手指，在 touchend 时为新离开屏幕的手指。

> PS：没有对比出 touches 同 targetTouches 的差异，推荐使用 targetTouches。

示例：手指拖动小球box



![img](https://user-gold-cdn.xitu.io/2019/12/11/16ef4f5320d4903c?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)



### 3、targetTouches 对象

targetTouches 对象中有几个坐标值值得我们关注：

`screenX/screenY`：手指的触摸点相对屏幕左上角的距离。

`clientX/clientY`：手指的触摸点相对视口（移动端屏幕左上角）的距离。

`pageX/pageY`：手指的触摸点相对当前页面的左上角的距离（当前页面可能有滚动条，所以距离包含滚动的距离）。

而，一般当我们在移动端设置了 `content="width=device-width, initial-scale=1.0, user-scalable=no"` 之后，clientX/clientY 的距离和 pageX/pageY 的距离是相同的了。所以一般使用 clientX/clientY。

