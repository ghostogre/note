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

