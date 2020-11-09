## 目标

重构中通积分项目，原项目使用`wepy`开发，在百万数据量的时候会产生大量框架报错，难以debug。项目页面没有细分组件，所有代码集中在一个页面，并且存在大量的if else判断。目标是使用Taro进行重构小程序。

1. 抽出组件，不能与现有业务逻辑耦合。请求接口和页面相关的全都放到页面里，页面全部抽出组件，组件可插拔。
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
11. 雪碧图：只有同一页面的切图，而且不经常变动的图标，需要做成雪碧图。经常变化的图片最好是后台可配置。

### 难点

1. TabBar的滚动透明:

   ```markdown
   **目标**：滚动之前透明，滚动之后不透明吸顶。
   1. 外层scrollView包裹，通过它的滚动事件获取滚动距离，然后和设定的最大滚动距离（一般小于页面顶部背景图高度）比较运算，然后设置背景透明度。**注：**Taro的入口文件render不能写逻辑，所以我们只能在每个页面引入scrollView。假如使用scrollView，那么久无法使用页面的触底钩子等，只能用scrollView相应的钩子，这样代码复用性有问题。
   2. 利用小程序的onPageScroll（usePageScroll）钩子，按照他返回的scrollTop控制显示。缺点是，这个钩子做了防抖处理，毕竟频繁触发并不合适。
   ```

2. 多个弹窗顺序弹出：每个弹框肯定都是不同的变量控制显示，可以将每个弹框的打开方法（比如说setState）放到一个数组里，然后每次进入下一个弹框就推出数组的第一个。

3. **弹层图片问题**：加载的图片是后台配置的，加载完成后宽高改变（**网络图片事先无法知道高度**），会有一个明显的闪烁。

   - 目标：需要实现图片加载完成后再弹出（类似拼多多的弹出方式），解决其实就是**预加载**。

   - **H5：**可以使用`Image`对象的`onload`预加载。

   - **小程序：**

     - 没有`Image`对象，但是小程序的`Image`组件有onload方法，可以隐藏Image去预加载图片（`display:none`和`visiblity: hidden`其实都会加载图片），只要URL不改变之后都会使用本地的缓存。其实和H5里的Image对象是一样的思路（都是预加载），只不过这里需要一个隐藏的节点代替小程序里没有的Image对象而已。如果好几张图，就用一个数组遍历依次赋值给预加载Image。

       > onload的`e.detail`里面只有宽高，可以通过`e.currentTarget.dataset.src`获取（当然你要在模板上设置`data-src`）

     - 或者`Taro.getImageInfo`(`wx.getImageInfo`)可以去**预加载**图片，在option的success回调里返回值res里的path（图片的本地路径），网络图片需先配置download域名才能生效。

     - 让后台接口直接返回宽高字段，然后使用懒加载就好了。本身后台上传图片，视频之类的媒体的时候，都需要上传宽高字段。这是比较通用的方案。**缺点：**还是会有图片加载的过程，但是简单很多。

     - 给图片加动效，掩耳盗铃的方法。

   - **预加载的思考**：网速慢预加载失败了怎么办，一般来说就是用一个错误的图片代替他，不过说实在的你网速慢获取不到图片不是应该的吗，其他方法也是一样的。
   
4. 一次加载整张列表的方案：在本项目里可以使用`intersectionObserver`设置不在视窗内只渲染列表外部容器（也就是说列表项内容不渲染）

5. `scrollView`横向滚动需要设置内部元素为`inline-block`。

6. 多Tab的列表需要考虑：

   - 多tab的列表，列表渲染会阻塞tab切换动画效果的表现，会出现掉帧现象，所以需要在tab切换完成以后渲染列表（比如骨架屏，加载状态等）。1.0 的处理方法是用`setTimeout`延迟200ms请求，然后切换的时候使用`van-skeleton`。
   - tab较多的情况下，要么就是每次切换都是重新渲染（也就是下面tab列表项没有滚动效果，每次切换tab就重新渲染而已）。
   - 使用虚拟列表的思路，tabContent考虑做成横向的虚拟列表。
   - jd的处理分类页面多个tab的方法是，实际上只渲染一个tabContent，在content里切换数据，每次切换的时候给tabContent容器元素逐渐显示的css效果（`transition: opacity .2s linear 0s `），或者说用一个loading在加载过程里显示（京东超市）。
   - 得物的处理是：第一次点击tab的时候加载，之后的切换不会重新加载列表，但是当缓存的列表比较多的时候，再切换的时候重新加载也就是说缓存列表太多就会回收资源。

7. 元素通过设置padding来保持内容对齐会有问题，在小程序中假如是奇数的padding可能最后转化以后会出现很小的偏差，所以最好使用指定宽度和`margin: 0 auto;`。

8. **Taro升级**（2.2.4 -> 3.0.8）

   - react的api和Taro的api分开。
   - 2.0+的版本里只能在render函数里使用jsx，比如想用条件判断渲染返回不同的jsx会报错无法编译。3.0更加自由，能够使用react里的各种语法。
   - Taro Next 在底层会维护一个精简的 DOM 系统，在框架中使用 `ref` 链接到的是一个 Taro Element 实例，因此直接可以使用 [`HTMLElement`](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement) 的部分方法直接操作它。
   - 如果需要引入taro-ui，需要`"taro-ui": "^3.0.0-alpha.3"`及以上的版本。
   - 可以按照命令行配置生成demo来对照配置和语法。
   - 3.0+会为每个页面都生成一个`.map`文件，上传会出现包过大的问题，最好使用`NODE_ENV=production`设置成生产环境再上传。
   - 组件和页面不再区分开，所以组件内的生命周期无效了。而且组件的CSS会和页面的CSS一起打包，需要避免命名重复，也就说需要使用`css module`。
   - this指向了react，现在不存在自定义组件了，相当于直接拷贝到了页面上。
   - 分享内容，需要在配置文件里配置自定义分享
   - 同一个页面里的重复组件需要加key，否则会出现数据混乱。

### 注意

1. map循环的时候的return有多个render（比如if else判断返回），会无法通过编译，但是我们可以在return后面使用三元运算符等（例如`return condition ? <A/> : <B/>`）来解决条件渲染的问题。**要求使用一致的 return 语句 (consistent-return)。**

2. 总结出的预编译css（`less`，`sass`）的写法是：

   ```less
   .className {
       &_module {
           &--list {
               .listItem {
                   // ...
                   &_title {
                       // ...
                   }
                   &_content {
                       // ...
                   }
               }
           }
       }   
   }
   ```

   将外层容器到具体的某一块使用`&`来嵌套，这样实际上生成的只有一个类。到了具体某一块（这一块里面可能还可以使用bem写法），我们不用`&`继续继承类名，使用类嵌套。在这个块里面，我们再继续使用BEM的写法和`&`嵌套，这样的话，最终生成的css就不会有很多嵌套，而且也可以避免bem写法又臭又长。

   bem说白了就是使用类名去表达元素的嵌套关系，我这种思路就是将bem分层。

   sass的嵌套写法是为了更好的可读性和减少写css的重复。

3. 项目里的自定义的Img组件其实是一个块包裹Image。利用`onError`和`onLoad`能够实现报错时候显示错误图标和图片加载完成前的过渡效果（平时我们加载图片都是从上到下，图片逐渐出现）。使用`Img.externalClasses = ['custom-class']`使用外部样式。如果是margin之类的样式类，可以直接使用外层包裹的容器上设置。

4. enterList导航一般都是图标大小长宽比都是一致的，给图片同样的大小就可以了。因为图标不同所以图片有很多透明留白的来保证图片宽高比一样，在设计稿上因为是透明的看起来非透明部分是宽高比不一样的。最好是切图也切在设计稿上这样可以看得出来图标的大小。

5. 有的时候需要给使用的组件再做一层封装才能符合我们的需求，这时候传给组件的props要多经历一层传递才能到组件的props上。我们的props需要我们导入组件库类型声明文件里的类型，才能和组件库的类型保持一致。

   > `keyof`：typescript，返回接口的key值的组合类型

   

6. 页面中有很多卡片式的楼层结构，一般是做成card组件进行处理。本项目不同的是，相同的标题结构出现频率很高，但是本项目里卡片标题不一定在卡片顶部，而且标题还有可能出现不同的背景样式，所以不能直接把卡片写成组件。所以我们可以把楼层的标题单独做一个组件。

   ```jsx
           <View className='cardTitle'>
               <View className='cardTitle--left'>
                   <Text className='cardTitle--left_title'>{title}</Text>
                   {
                       children || (
                           <Text className='cardTitle--left_subtitle'>{subtitle}</Text>
                       )
                   }
               </View>
               {
                   showMore && (
                       <View className='cardTitle--right'>
                           <Text>更多</Text>
                           <AtIcon value='chevron-right' size={12} />
                       </View>
                   )
               }
           </View>
   ```

7. 使用`repeat-linear-gradient`可以实现斑马纹的进度条效果，但是倾斜的斑马纹用这种方法实现，在微信开发者工具里会出现明显的锯齿。所以还是该用斑马纹的图片作为`backgroundd-image`来实现。

8. Taro 不能使用三元运算符去返回children（因为 Taro 最终转换成字符串，三元运算符里用children他不知道这是个变量还是其他什么的）

9. 吸顶效果：当红包倒计时划过页面的时候，实现一个吸顶效果。难点：红包倒计时在一个卡片中，而且样式与设计稿中吸顶红包倒计时不同，所以需要实现的是一个滚动然后展示吸顶navbar的效果。

   - 方案一：使用`intersectionObserver`这个API，在微信小程序里我们可以使用这个 api 实现按需渲染和资源回收。但是在支付宝小程序使用中我们发现有时候这个api并不符合我们的使用预期，而且如果在useEffect（依赖数组为空数组），useDidShow等钩子里永远只会触发一次监听回调。向上滚动不会触发，需要多次向上滚动才会触发监听回调。

     因为本身`intersectionObserver`是在一点时间间隔内执行，做按需渲染很合适，但是类似吸顶，看上去会有延迟，效果不是很好。

     在h5中使用`IntersectionObserver`，上下滚动都是会触发监听回调的。

     > 支付宝小程序中使用`intersectionObserver`：
     >
     > ```js
     > // 链式调用，必须写relativeToViewport，observe的回调监听才会生效
     > // 组件中使用的时候，需要给createIntersectionObserver传入this(函数组件也是)
     > Taro.createIntersectionObserver().relativeToViewport({ top: 0 }).observe('className', function () {
     >   // 回调
     > })
     > ```

   - 方案二：使用`postion:sticky`，把卡片里的红包倒计时设置成`sticky`，滚动的时候让卡片里的红包倒计时吸顶，而不是再去控制一个吸顶栏的显示与否。

     **使用条件**：

     1. 父元素不能设置 `overflow:hidden;` 或者 `overflow:auto;`  属性；
     2. 必须制定 `top`、`bottom` 、`left` 、 `right` 4个值之一，否则只会处于相对定位；
     3. 父元素的高度不能低于sticky 元素的高度；
     4. sticky 元素仅在其父元素内生效；(也就是说只有在父元素内才表现为吸顶，当父元素被滚动隐藏，sticky元素会随着父元素滚动隐藏)

     由此，我们可以知道sticky不适合解决这个问题。

   - 方案三：使用`usePageScroll`钩子（相当于onPageScroll事件）,滚动的时候根据`scrollTop`进行判断显示或者隐藏。

10. `formId`只能在真机里获取，开发工具里永远是undefined。

11. 类似`./images/ads.png`这样的首页活动广告，其实应该全部都是图片，由后台进行配置。

12. Tabbar：可以在fixed的tabbar外层包裹一层固定高度的元素作为占位，然后写成组件，就不用在容器里写占位了。

13. 多行省略要加`/*! autoprefixer: off */`来关闭自动前缀。padding 的内容依然会显示，边距最好用 margin 或者多包裹一层来设置。

14. 按钮最好添加点击反馈，比如只要给button或者商品item设置按钮阴影，按下的时候取消阴影，就会给用户一种下沉的反馈。

15. 滚动监听我们使用intersectionObserve的话，代码逻辑最好放到hoc里面，因为页面上并不是都做成组件，所以还是需要通过hoc的children。

16. TabBar中间的tab点击后凸起一块的样式（两侧还有弧度），凸起可以通过负margin解决，但是两侧凹下去的弧度，通用的方法是通过切图解决。

    我自己的想法是利用`border-radius`和`border`设定伪元素为一段圆弧边框（控制宽高就能设置不同的弧度，然后通过设置border-left等可以获取其中一段），边框颜色和背景色相同就可以达到效果了。但是这种方法，阴影不好设置，而且因为TabBar不定宽，背景和图片的定位很困难，圆弧弧度也很难和设计稿保持一致。

    最佳方法还是切图解决，既能保证弧度一致，阴影也可以直接切图。

17. 字体渐变背景色：

    ```css
    width:252px;
    height:50px;
    font-size:36px;
    font-family:HYYakuHei-HEW,HYYakuHei;
    font-weight:normal;
    color:rgba(252,90,0,1);
    line-height:50px;
    background:linear-gradient(117deg, rgba(249,121,10,1) 0%, rgba(253,40,68,1) 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    ```

18. 一个项目里，商品列表元素组件标题图片样式大多数是一样的，所以可以写成组件。但是可能tag标签和价格box会不一样。所以我们可以将他们做成`render props`传入，这样的话上面的点击事件也可以不用传入，比起传入字符串去判断显示不同内容，我们可以将显示不同内容的控制交给父组件。

19. 自动 margin：父元素设置`display: flex`（替换成 `display: inline-flex | grid | inline-grid` 也是可以的），子元素设置`margin: auto`就能水平和垂直同时居中。

    传统BFC中，如果 `margin-top` 和 `margin-bottom` 都是 auto，则他们的值都为 0。

    所以要使单个元素使用 `margin: auto` 在垂直方向上能够居中元素，需要让该元素处于 FFC(flex formatting context)，或者 GFC(grid formatting context) 上下文中。在 flex 格式化上下文中，设置了 `margin: auto` 的元素，在通过 `justify-content`和 `align-self` 进行对齐之前，任何正处于空闲的空间都会分配到该方向的自动 margin 中去。

    





