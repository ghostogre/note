## 目标

重构中通积分项目，原项目使用`wepy`开发，在百万数据量的时候会产生大量框架报错，难以debug。项目页面没有细分组件，所有代码集中在一个页面，并且存在大量的if else判断。目标是使用Taro进行重构小程序。

1. 抽出组件，不能与现有业务逻辑耦合。
2. 保证路由不能变，因为上线了的项目有的地址给到第三方了，所以不能改动或者缺少。

## 首页

1. 导航栏滚动渐变：一开始设置背景透明，滚动后从背景透明变成不透明。因为Taro只支持十六进制的颜色，而且只能设置导航栏颜色。所以只能设置`navigationStyle: 'custom'`，自己去实现导航栏，但是兼容性比较差。

2. 下拉加载都是常见的用一个布尔值去防抖。

3. 详情页面复用问题：

   - **问题**：很多页面都复用这个页面，区别只有页面的按钮事件或者局部UI不同。

   - 策略模式：

     ```js
     // 策略类
     const strategies = {
       A() {
         console.log("This is stragegy A");
       },
       B() {
         console.log("This is stragegy B");
       }
     };
     
     // 环境类
     const context = name => {
       return strategies[name]();
     };
     
     // 调用策略A
     context("A");
     // 调用策略B
     context("B");
     ```

   - 解决：

     ```jsx
     // utils/xxx.js[x]
     // 跳转前传给下一个页面
     export const CONSTANT = 'CONSTANT'
     
     // 根据传入判断
     export default {
         [CONSTANT]: () => {
             axios.get()
             return (
             	<>
                 	****
                 </>
             )
         }
     }
     ```

     ```js
     // Map
     const SearchSubmitTypeMap = new Map<SearchSumbitType, { title: string, okText: string }>([
         ['search', { title: '高级查询', okText: '确定' }]
     ])
     ```

     

### 页面组件抽离

1. 一些比较简单的页面结构，样式可以全局复用，而不用抽出组件。抽出组件可以减少模板编写，但是支付宝小程序会有层级性能问题（本项目为微信小程序）
2. 对于一些简单的列表元素其实可以不用组件化，直接列表循环。
10. loginModal降低耦合方法：loginModal仅展示组件，登录操作放到redux里，登录返回信息从缓存或者state里获取。
11. 雪碧图：只有同一页面的切图需要作成雪碧图。

### 难点

1. TabBar的滚动透明:

   ```markdown
   **目标**：滚动之前透明，滚动之后不透明吸顶。
   1. 外层scrollView包裹，通过它的滚动事件获取滚动距离，然后和设定的最大滚动距离（一般小于页面顶部背景图高度）比较运算，然后设置背景透明度。**注：**Taro的入口文件render不能写逻辑，所以我们只能在每个页面引入scrollView
   ```

   

