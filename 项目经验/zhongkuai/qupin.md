1. `@tarojs/cli`2.0+使用yarn和npm全局安装可能会出现问题，yarn和npm安装会有路径问题，导致类似打包后上传出现”系统出错，正在排查“这种问题。3.0无此问题。

2. 组件显示不同内容，最好使用props传入的形式，组件内部`if else`难维护。

3. 组件内部触底钩子和页面触底钩子会合并了，要注意组件内的钩子不要重复使用。

4. H5 项目不支持Taro的`createIntersectionObserver`和`Taro.nextTick`API，需要使用h5自身的API。Taro的`IntersectionObserver`相关API本身就放在`WXML`下面。

5. 类似拼多多的用户中奖每三秒显示一个用户：

   - animation：可以指定多个动画，所以我们可以先淡入，然后淡出都用animation实现。
   - animation-fill-mode：如果想要动画结束保持最后一帧，需要设置`both`（动画有延迟的话）和`forwards`
   - 进入时进行0.3秒的渐入，1.5秒延迟后淡出。每次显示存在空白间隔，当一个列表显示完成重新请求新的列表重新进行循环显示。

6. **图片高度不固定**：显示图片可以做一些动效，展开高度（`translate3d(.3, .3. .3)` => `translate3d(0, 0, 0)`），然后 渐入（`opacity`和`translate`）。图片较大的，页面也可以做一点淡入效果。

7. `taro-ui`里假如想自定义modal内容那就不能使用props传递title和content，即使你使用了`AtModalContent`，如果用了title props就不会生效，应该使用的是`AtModalHeader`设置标题。

8. 展开收起可以通过`fadeInDown`（animate.css）来实现，控制列表项的display，给每个列表元素都加上`fadeInDown`动效就能实现很好的展开效果。启发了我，很多组件都没有那么复杂，只需要简单的动效组合也能。`ease-in-out`能设置进入和离开的过渡动效。

9. 保证列表元素的间隔可以使用父级包裹元素的`padding`和列表元素的单边margin来实现（这个并不难理解，但是我之前习惯了负margin和space-between，忽略了某些场合这是最简单的方法）

10. taro配置`babel-plugin-import`可以直接在`babel.config.js`里配置，也可以在`.babelrc`里配置。官方建议在`babel.config.js`里配置。

11. h5中的`taro-ui`需要配置postcss处理`esnextModules: ['taro-ui']`，之后才能正确转换px。

12. 在h5中自定义TabBar的话，在配置文件`app.config.ts`里只设置`custom: true`是无效的。配置文件里的`list`（框架自带的TabBar的tab列表配置）列表项里的path不能是真的路径（不能在`pages`里找到对应的路径），否则Taro依然会渲染他的TabBar。而且list不能为空必须给至少2个列表项，才能编译正常。

13. taro 开发h5：无法使用`useRouter`获取到页面传参，需要使用h5的方法去获取路由参数（例如截取字符串）

14. setState一直获取的是旧的值：

    ```tsx
    /**
    * 问题：
    */
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    
    useEffect(() => {
      interval()
    }, [])
    
    /** timeout模拟interval */
    const interval = () => {
      setTimout(() => {
        if (currentIndex < 100) {
          console.log(currentIndex) // 打印的一直都是0
          setCurrentIndex(prev => (++prev))
        }            
      }, 1000)
    }
    
    /** 页面上能按照每秒+1更新，但是会一直执行定时器，永远也到达不了边界 */
    return (
    	<View>{currentIndex}</View>
    )
    ```

    **解决方法**：直接给`interval`传参传值，或者使用`useRef`。

    **原因**：函数里`currentIndex`指向的是旧的值。函数创建的时候是指向的是上一个值，因为hooks的值不是同步，他是异步修改。

15. **如何处理支付宝支付后端返回的html代码**

    可以利用以下方式，首先将后端返回的html代码插入到当前页面中，然后提交表单，在当前页面直接实现跳转至支付宝支付页面。

    ```ts
    const div = document.createElement('div');
    div.innerHTML = res.data; // html code
    document.body.appendChild(div);
    // 新标签页打开
    // document.forms.alipaysubmit.setAttribute('target', '_blank');
    document.forms.alipaysubmit.submit();
    
    // 这样确实实现了在新标签页打开支付页面，但是这样chrome浏览器会以其为弹窗进行拦截，所以这种方法是行不通的。
    // 可以通过改变异步为同步async: false来避免拦截。但某些ajax库是不支持修改为同步的。
    // 于是决定使用winow.open来打开一个新的窗口。
    // 但是window.open必须是用户手动触发才不会被拦截。
    
    // 如何解决弹窗被拦截的问题，可以先打开一个不被拦截的空窗口，在异步请求后将href替换。
    var btn = $('#btn');
    btn.click(function () {
        //打开一个不被拦截的新窗口
        var newWindow = window.open();
        $.ajax({
            url: 'ooxx',
            success: function (url) {
                //修改新窗口的url
                newWindow.location.href = url;
            }
        })
    });
    ```

16. 不能使用`useEffect` + `[]`替代`useDidShow`。切换页面再次进入的时候是不会触发`useEffect(callback, [])`。因为taro的navigate是会保留页面，不会进行卸载的（componentDidUnmount），再次进入也不会重新挂载。

17. 下单到确认订单传递商品信息，可以使用序列化商品信息对象然后作为传参从URL上传递。这样的话不需要担心刷新消失和使用本地缓存。

18. hooks的理念：最好把相关的东西放到一起，比如定义state不要集中一块放state，其实这还是class的做法。使用好类型推断，就不用写太多的类型定义。

19. canvas用于生成分享海报，例如分享海报上商品名称，图片位置不固定。

