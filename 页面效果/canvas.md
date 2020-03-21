## canvas下雪

```javascript
//IIFE
(function () {
	'use strict';
	
	var canvas,ctx;
	var points = [];
	var maxDist = 100;

	function init () {
		//Add on load scripts
		canvas = document.getElementById("canvas");
		ctx = canvas.getContext("2d");
		resizeCanvas();
		generatePoints(700);
		pointFun();
		setInterval(pointFun,25);
		window.addEventListener('resize', resizeCanvas, false);
	}
	// 雪花对象生成
	function point () {
		this.x = Math.random()*(canvas.width+maxDist)-(maxDist/2);
		this.y = Math.random()*(canvas.height+maxDist)-(maxDist/2);
		this.z = (Math.random()*0.5)+0.5;
		this.vx = ((Math.random()*2)-0.5)*this.z;
		this.vy = ((Math.random()*1.5)+1.5)*this.z;
		this.fill = "rgba(255,255,255,"+((0.5*Math.random())+0.5)+")";
		this.dia = ((Math.random()*2.5)+1.5)*this.z;
		points.push(this);
	}
	// 生成复数的雪花
	function generatePoints (amount) {
		var temp;
		for (var i = 0; i < amount; i++) {
			temp = new point();
		};
		console.log(points);
	}
	// 画雪花
	function draw (obj) {
		ctx.beginPath();
		ctx.strokeStyle = "transparent";
		ctx.fillStyle = obj.fill;
		ctx.arc(obj.x,obj.y,obj.dia,0,2*Math.PI);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}
	//	更新雪花的位置
	function update (obj) {
		obj.x += obj.vx;
		obj.y += obj.vy;
		if (obj.x > canvas.width+(maxDist/2)) {
			obj.x = -(maxDist/2);
		}
		else if (obj.xpos < -(maxDist/2)) {
			obj.x = canvas.width+(maxDist/2);
		}
		if (obj.y > canvas.height+(maxDist/2)) {
			obj.y = -(maxDist/2);
		}
		else if (obj.y < -(maxDist/2)) {
			obj.y = canvas.height+(maxDist/2);
		}
	}
	// 绘制雪花
	function pointFun () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < points.length; i++) {
			draw(points[i]);
			update(points[i]);
		};
	}

	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		pointFun();
	}

	//Execute when DOM has loaded
	document.addEventListener('DOMContentLoaded',init,false);
})();
```

## 离屏渲染

利用`document.createElement('canva')`创建一个离屏的canvas元素，将一些复杂的图形绘制到上面，之后绘制只需要绘制这个canvas替代了绘制图形，避免每次都需要重复地执行绘制图形。可以比喻成把一个需要绘制的图形我们先给他变成一种特殊的图片（canvas元素），然后就不需要每次都绘制复杂的图形，取而代之的是把这张图片绘制到canvas。

假如绘制的图形，具有很多属性的差别的话不应该使用离屏缓存。不然比起不使用离屏还多了缓存。。。

当时用 `drawImage` 绘制同样的一块区域：

1. 若数据源（图片、canvas）和 `canvas` 画板的尺寸相仿，那么性能会比较好；
2. 若数据源只是大图上的一部分，那么性能就会比较差；因为每一次绘制还包含了裁剪工作

也就是说如果说不需要裁剪的图片的话，直接就可以绘制到画布上。如果图片需要裁剪操作的话还是可以使用离屏缓存的。

## canvas的使用技巧

#### 1. 使用多层画布绘制复杂场景

分层的目的是降低完全不必要的渲染性能开销。

> 即：将变化频率高、幅度大的部分和变化频率小、幅度小的部分分成两个或两个以上的 `canvas` 对象。也就是说生成多个 `canvas` 实例，把它们重叠放置，每个 `Canvas` 使用不同的 `z-index` 来定义堆叠的次序。

```html
<canvas style="position: absolute; z-index: 0"></canvas>
<canvas style="position: absolute; z-index: 1"></canvas>
```

#### 2. 使用 requestAnimationFrame 制作动画

`requestAnimationFrame` 相对于 `setinterval` 处理动画有以下几个优势：

1. 经过浏览器优化，动画更流畅
2. 窗口没激活时，动画将停止，省计算资源
3. 更省电，尤其是对移动终端

这个 API 不需要传入动画间隔时间，这个方法会告诉浏览器以最佳的方式进行动画重绘。

#### 3. 清除画布尽量使用 clearRect

一般情况下的性能：`clearRect` > `fillRect` > `canvas.width = canvas.width;`

#### 4. 使用离屏绘制进行预渲染

#### 5. 尽量少调用 `canvasAPI` ，尽可能集中绘制

tips: 写粒子效果时，可以使用方形替代圆形，因为粒子小，所以方和圆看上去差不多。有人问为什么？很容易理解，画一个圆需要三个步骤：先 `beginPath`，然后用 `arc` 画弧，再用 `fill`。而画方只需要一个 `fillRect`。当粒子对象达一定数量时性能差距就会显示出来了。

#### 6. 像素级别操作尽量避免浮点运算

> 进行 `canvas` 动画绘制时，若坐标是浮点数，可能会出现 `CSS Sub-pixel` 的问题.也就是会自动将浮点数值四舍五入转为整数，在动画的过程中就可能出现抖动的情况，同时也可能让元素的边缘出现抗锯齿失真情况。

虽然 javascript 提供了一些取整方法，像 `Math.floor`，`Math.ceil`，`parseInt`，但 `parseInt` 这个方法做了一些额外的工作（比如检测数据是不是有效的数值、先将参数转换成了字符串等），所以，直接用 `parseInt` 的话相对来说比较消耗性能。

可以直接用以下巧妙的方法进行取整：

```js
function getInt(num){
    var rounded;
    rounded = (0.5 + num) | 0;
    return rounded;
}
```

> 另 for 循环的效率是最高的，感兴趣的可以自行实验。