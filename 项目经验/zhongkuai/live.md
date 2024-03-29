微信小程序直播主要还是使用“小程序直播”这个小程序进行直播，我们商家客户端只是使用内置组件打开这个小程序，观众和主播都是依托这个直播小程序进行操作。

除此之外，还有配置直播的后台端（直播计划，商品入库，上架直播间等）和主播使用的直播端。

> [小程序直播产品使用指南](https://docs.qq.com/slide/DSkN3dXRoam5ycGFV)

可以通过分享消息卡片，复制链接，房间码和公众号进入直播，也可以后台设置不能分享直播间。还可以在小程序里展示直播入口，能够实现开播消息推送。

## 前端

> [文档](https://developers.weixin.qq.com/miniprogram/dev/framework/liveplayer/live-player-plugin.html)

1. 在小程序后台申请开通直播
2. 需要在代码里引入直播代码包进行开发（live-player-plugin，**注：直播组件不计入代码包体积**），并且提审小程序。

**版本限制**：微信客户端版本 7.0.7 及以上（基础库版本2.9.x及以上支持同层渲染）可以观看直播及使用直播间的功能

### 如何使用

直接通过链接地址跳转到直播组件页面（即为进直播间页面）。链接地址需要带上直播房间 id。

```js
let roomId = [直播房间id] // 填写具体的房间号，可通过下面【获取直播房间列表】 API 获取
let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/index/index', pid: 1 })) // 开发者在直播间页面路径上携带自定义参数（如示例中的path和pid参数），后续可以在分享卡片链接和跳转至商详页时获取
wx.navigateTo({
    url: `plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=${roomId}&custom_params=${customParams}`
})
// 其中wx2b03c6e691cd7370是直播组件appid
```

具体直播间ID可以通过获取直播间列表接口（组件提供的接口）获取到。

### 接口

分为组件接口和服务器接口，微信提供的接口用于获取直播的信息，直播状态，直播商品等。

组件接口直接调用组件封装好的API就行，服务器接口需要调用具体URL。

### 要点

1. 设计稿要求实现导航栏右侧显示编辑按钮，但是这是实现不了的，因为小程序导航栏右侧是胶囊，这个胶囊是没法隐藏或者遮挡的。

2. 主播编辑商品上传图片需要实现拖动调整图片顺序：PC端是有拖拽实现相关逻辑的。移动端需要引入手势库（拖动调整图片顺序在移动端很少见这样的逻辑，值得斟酌）

   （不使用手势库）移动端的拖拽有以下几种实现方案：

   - 将元素设置为固定定位 fixed，然后在拖拽的时候修改其定位，实现拖拽的效果。
   - 使用 transform 中的平移 translate 属性实现拖拽。
   - **微信小程序**中存在`moveable-area`和`moveable-view`两个标签。`moveable-view`的宽高跟图片一致，也是动态设置，初始状态是隐藏的，当图片被长按时才会显示。当长按要排序的图片的时候，记录它的 url ，并赋值给`moveable-view`的 image。

   监听手指移动改变图片位置，拖拽结束判断当前位置，然后更新数组移动图片。

3. 点击保存生成**推广海报**并且保存：包装一个组件 CanvasDrawer ，render 返回 canvas。封装绘制图片，文本等的方法，然后通过 props 传入对象数组（通过配置type来渲染不同类型的图案，x，y 设置渲染位置，zIndex 设定渲染层级）依次进行渲染。

4. 商品详情：有上传视频的话，首张主图上显示视频可播放按钮，点击播放主播上传的视频。难点：在于轮播图上播放视频。实现：在轮播图 SwiperItem 里添加播放图标，点击切换显示图片和视频组件。

## 瀑布流商品列表

目前实现瀑布流方式有 multi-column , grid , flexbox 三种。从兼容性及易用性综合考虑，还是推荐使用 Flexbox的布局方案。

### flex 方案

例如两列的瀑布流布局，瀑布流容器的 flex 设置横向布局，列容器为纵向布局。然后将列表数据分为左右两个新的列表进行渲染。

**怎么做一个高性能，高体验的H5双列瀑布流？**

先选定一个使用场景，技术实现上选用 Flexbox 实现布局，数据加载方面要求无限向下滚动加载。

准确来说，在双列瀑布流的使用场景中，围绕元素卡片高度是否固定，顺序是否严格固定，可以分为元素高度分化场景、顺序分化场景，具体如下：

元素高度分化场景：

- A1场景：每个元素高度固定；
- A2场景：每个元素高度不固定，但是可以数据类型估算自身相对于屏幕宽度的百分比高度；
- A3场景：元素高度不固定，且无法预估高度，只能等渲染之后才可以确定高度；

顺序分化场景：（结合无限加载为前提）

- B1场景：元素的相对顺序严格一致
- B2场景：元素的相对顺序宽泛性一致

**具体分析**

- A1 场景之下，数据排列方式就可以简单做成左右交替排列，这也是最简单一种方式（也就是直接按照奇数偶数index分配到左右数组）。

- A2场景下，需要在给左右两列分配元素时，要根据当前高度差来动态分配，简单来说就是哪一列短，就分配到对应的那一列。同时这种方式也能够满足B1的场景。

  ```js
  function computeRatioHeight (data) {  
    // 计算当前元素相对于屏幕宽度的百分比的高度 
    // 设计稿的屏幕宽度  
    const screenWidth = 375;  
    //设计稿中的元素高度，也可以前端根据类型约定  
    const itemHeight = data.height;   
    return Math.ceil(screenWidth / itemHeight * 100);
  }
  function formatData(data) {
    let diff = 0; 
    const left = []; 
    const right = []; 
    let i = 0; 
    while(i < data.length) {  
      if (diff <= 0) {    
        left.push(data[i]);   
        diff += computeRatioHeight(data[i]);  
      } else {    
        right.push(data[i]);   
        diff -= computeRatioHeight(data[i]); 
      }    
      i++; 
   } 
   return { left, right }
  }
  ```

- A3 场景下是相对难处理的，我们无法预知真实渲染后的高度，那么在参差不齐的情况，我们无法科学的进行排列的，这种情况常见于图片瀑布流场景，由于图片高宽信息缺失或者不准确，需要img标签自然展开，这种情况下建议转换成A2情况，例如预先获取图片真实高宽，当然这么做有一定的性能损耗。

  ```js
  function getImgInfo(url) { 
   return new Promise((resolve, reject) => { 
     // 创建对象   
     const img = new Image();  
     // 改变图片的src  
     img.src = img_url;  
     // 判断是否有缓存  
     if (img.complete) {   
       resolve({ width: img.width, height: img.height });  
     } else {     
       img.onload = () => {   
          resolve({ width: img.width, height: img.height }); 
       };  
     } 
    })
  }
  ```

## 进阶优化

### 误差矫正

在 A2 场景中，每个卡片的高度并不能像预想的高度去精确渲染，特别是在移动端 H5 中使用 Rem 单位、适配不同的设备类型的场景中，计算的精度差，渲染的像素误差，都会给计算左右高度差时带来误差一定的误差，在无限滚动的基础上，这种误差会持续累积，最终导致布局策略的失败。因此需要对左右高度差在每次加载数据后进行矫正。

这里采用的方式比较简单，可以**在左右列容器的尾部增加一个高度为 0px 的隐藏锚点元素**，每次渲染结束后获取锚点元素的 offsetTop 的值，更新左右两侧的高度差。

### 通过DP算法获取最优排列

在 A2 场景下，通过计算高度差向高度低的一列添加元素，实际并不是完美方案，因为在极端场景下，例如最后一个元素过高，会导致底部左右的高度差过大，甚至超过一个常见元素的高度，一方面没有合理使用屏幕高度，另外一方面巨大的高度差也会给用户体验带来负面影响。

为了解决这种问题，我们引入简单的 DP算法来解决这个问题。假如已知所有待排列元素的高度，就可以计算出这些元素的真实占据的高度-记为总高度 H，假如不考虑卡片不可分割的特性，将两个列容器想想成联通的两个水柱，那么其元素总高度 H / 2 就是其最佳占据高度，由于很难出现左右排列高度一致的情况，因此获取最靠近 H / 2 的排列高度即为最佳排列高度，进而转换成背包问题就是在 H / 2 容量的背包里，如何放置尽可能使用其空间体积的题目，下面就按照这个思路来解决如何获取最优的问题。

```js
resetLayoutByDp: function (couponList) {  
  const { left, right, diffValue } = this.data;   
  const heights = couponList.map(item => (item.height / item.width * 160 + 77));  
  const bagVolume = Math.round(heights.reduce((sum, curr) => sum + curr, diffValue) / 2);  
  let dp = [];  
  //......省略部分代码 
  // 具体的DP算法可以自行查阅相关资料  
  const rightIndex = dp[heights.length - 1][bagVolume].indexes;  
  const nextDiff = heights.reduce((target, curr, index) => {   
    if (rightIndex.indexOf(index) === -1) {    
     target += heights[index];  
    } else {     
    target -= heights[index];   
    }    
    return target;  
  }, 0);   
  const rightData = rightIndex.map(item => couponList[item]);   
  const leftData = couponList.reduce((target, curr, index) => {   
    if (rightIndex.indexOf(index) === -1) {    
     target.push(couponList[index]);   
    }    
    return target;  
  }, []);  
  this.setData({    
    left: [...left, ...leftData],  
    right: [...right, ...rightData],   
    diffValue: diffValue + nextDiff,  
  }, () => {     
    // 更新左右间距差  
    const query = wx.createSelectorQuery();   
    console.log('计算高度差');   
    query.select('#left-archer').boundingClientRect();   
    query.select('#right-archer').boundingClientRect();   
    const { diffValue } = this.data;    
    query.exec((res) => {     
      console.log(res[0].top - res[1].top, diffValue);   
      this.setData({      
        diffValue: res[0].top - res[1].top,    
      });  
    });  
  });
}
```

### 优化列容器中的排列

在实际业务场景中，常常会对排列顺序有要求，常见于广告和推荐的算法中，这里前端也可以做一些优化。这里的手段主要列容器内部的排序和不同列容器的相同元素的置换，尽可能保证高优先级的元素出现靠前的位置。

### 项目中的解决方案

1. 在图片加载的时候使用最小高度，监听图片加载完成后整个商品块 0.3 秒的逐渐显示效果，加载完成之前不显示。这样的话就不会有高度突变的效果。
2. 因为图片大小虽然不固定但是说不会有差别特别大的图片尺寸，所以我们不需要考虑出现一遍过长或者一边太短的情况。

## 生成海报

使用 taro-plugin-canvas 进行海报的绘制，这个插件默认绘制到屏幕外。如果我们需要显示可以使用手动绘制DOM（展示的DOM是我们自己写的，操作的图片是 canvas 根据我们配置绘制的，因为canvas的图展示的时候可能因为缩小而导致模糊。而且如果是多个海报类型供其横向滑动选择的情况下，我们不能每次都绘制好再展示），也可以使用组件 onCreateSuccess 事件返回的图片URL直接进行展示，实际保存图片和操作图片操作的其实是 canvas。

PS. 配置绘制 text 的时候，设置 width 就可以实现超出省略，假如设置 lineNum 可以达到设置多行溢出省略的效果。

