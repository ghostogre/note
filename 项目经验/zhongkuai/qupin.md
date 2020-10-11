1. `@tarojs/cli`2.0+使用yarn和npm全局安装可能会出现问题，yarn和npm安装会有路径问题，导致类似打包后上传出现”系统出错，正在排查“这种问题。3.0无此问题。
2. 组件显示不同内容，最好使用props传入的形式，组件内部`if else`难维护。
3. 组件内部触底钩子和页面触底钩子会合并了，要注意组件内的钩子不要重复使用。
4. H5 项目不支持Taro的`createIntersectionObserver`和`Taro.nextTick`API，需要使用h5自身的API。Taro的`IntersectionObserver相关API本身就放在`WXML`下面。
5. 类似拼多多的用户中奖每三秒显示一个用户：
   - animation：可以指定多个动画，所以我们可以先淡入，然后淡出都用animation实现。
   - animation-fill-mode：如果想要动画结束保持最后一帧，需要设置`both`（动画有延迟的话）和`forwards`

