1. easyui 的tabs在没有切换选中的tab是在不可见的情况下渲染的，这时候如果tabs里面嵌套的tabs里面有 datagrids 数据网格（也就是有个切换页面的tabs，然后 tab panel 里面有一个切换数据网格的tabs的多重嵌套结构），会因为获取不到可见的父容器宽高而无法设置大小，导致显示成一个很小的点。解决办法：在切换到对应tabs的时候再渲染，或者切换tab的时候使用下面代码重新加载页面。

   ```js
   document.getElementById(iframeId).contentWindow.location.reload(true)
   ```

   

2. easyui tabs 内 datagrids 需要显示的时候才渲染，datagrid的columns必须配齐field，title等属性才能正常使用，可以传空字符串但是不能不传否则报错。

3. json parse 解析字符串的时候遇到单引号会报错，当然一般`JSON.stringfy`也不会有单引号返回。

4. [datagrids 的 valueType](https://blog.csdn.net/weixin_44101779/article/details/103304881)

