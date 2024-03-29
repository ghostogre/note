## WebGL 是什么

 WebGL 技术旨在帮助我们在不使用插件的情况下在任何兼容的网页浏览器中开发交互式 2D 和 3D 网页效果，我们可以将其理解为一种帮助我们开发 3D 网页的绘图技术，当然底层还是 JavaScript API。

## WebGL 中的基本概念

WebGL 运行在电脑的 GPU 中，因此需要使用能在 GPU 上运行的代码，这样的代码需要提供成对的方法，每对方法中的一个叫顶点着色器而另外一个叫做片元着色器，并且使用 GLSL 语言。将顶点着色器和片元着色器连接起来的方法叫做着色程序。

**顶点着色器**：顶点着色器的作用是计算顶点的位置，即提供顶点在裁剪空间中的坐标值

**片元着色器**：片元着色器的作用是计算图元的颜色值，我们可以将片元着色器大致理解成网页中的像素

### 数据获取方式

顶点着色器和片元着色器这两个方法的运行都需要有对应的数据。

- 属性和缓冲：缓冲是发送到 GPU 的一些二进制数据序列，通常情况下缓冲数据包括位置、方向、纹理坐标、顶点颜色值等。当然你可以根据自己的需要存储任何你想要的数据。属性用于说明如何从缓冲中获取所需数据并将它提供给顶点着色器。
- 全局变量：全局变量在着色程序运行前赋值，在运行过程中全局有效。全局变量在一次绘制过程中传递给着色器的值都一样。
- 纹理：纹理是一个数据序列，可以在着色程序运行中随意读取其中的数据。一般情况下我们在纹理中存储的大都是图像数据，但你也可以根据自己喜欢存放除了颜色数据以外的其它数据
- 可变量：可变量是一种顶点着色器给片元着色器传值的方式

### 小结

WebGL 只关心两件事：裁剪空间中的坐标值和颜色值。使用 WebGL 只需要给它提供这两个东西。因此我们通过提供两个着色器来做这两件事，一个顶点着色器提供裁剪空间坐标值，一个片元着色器提供颜色值。

