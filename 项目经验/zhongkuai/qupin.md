1. `@tarojs/cli`2.0+使用yarn和npm全局安装可能会出现问题，yarn和npm安装会有路径问题，导致类似打包后上传出现”系统出错，正在排查“这种问题。3.0无此问题。
2. 组件显示不同内容，最好使用props传入的形式，组件内部`if else`难维护。
3. 组件内部触底钩子和页面触底钩子会合并了，要注意组件内的钩子不要重复使用。
4. H5 项目不支持Taro的`createIntersectionObserver`和`Taro.nextTick`API，需要使用h5自身的API。Taro的`IntersectionObserver`相关API本身就放在`WXML`下面。
5. 类似拼多多的用户中奖每三秒显示一个用户：
   - animation：可以指定多个动画，所以我们可以先淡入，然后淡出都用animation实现。
   - animation-fill-mode：如果想要动画结束保持最后一帧，需要设置`both`（动画有延迟的话）和`forwards`
6. **图片高度不固定**：显示图片可以做一些动效，展开高度（`translate3d(.3, .3. .3)` => `translate3d(0, 0, 0)`），然后 渐入（`opacity`和`translate`）。图片较大的，页面也可以做一点淡入效果。
7. `taro-ui`里假如想自定义modal内容那就不能使用props传递title和content，即使你使用了`AtModalContent`，如果用了title props就不会生效，应该使用的是`AtModalHeader`设置标题。
8. 展开收起可以通过`fadeInDown`（animate.css）来实现，控制列表项的display，给每个列表元素都加上`fadeInDown`动效就能实现很好的展开效果。启发了我，很多组件都没有那么复杂，只需要简单的动效组合也能。`ease-in-out`能设置进入和离开的过渡动效。
9. 保证列表元素的间隔可以使用父级包裹元素的`padding`和列表元素的单边margin来实现（这个并不难理解，但是我之前习惯了负margin和space-between，忽略了某些场合这是最简单的方法）
10. taro配置`babel-plugin-import`可以直接在`babel.config.js`里配置，也可以在`.babelrc`里配置。官方建议在`babel.config.js`里配置。

