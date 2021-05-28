### 预加载

在**微信小程序**、**支付宝小程序**和**QQ轻应用**中，从调用 `Taro.navigateTo` 或 `Taro.redirectTo` 后，到页面触发 componentWillMount 会有一定延时。因此一些网络请求可以提前到发起跳转前一刻去请求。

## 2.x里的预加载

```js
// 传入单个参数
// A 页面
// 调用跳转方法前使用 this.$preload
this.$preload('key','val')
Taro.navigateTo({ url:'/pages/B/B'})
// B 页面
// 可以于 this.$router.preload 中访问到 this.$preload 传入的参数
componentWillMount (){
  console.log('preload: ',this.$router.preload.key)
}
```

Taro 提供了 `componentWillPreload` 钩子，它接收页面跳转的参数作为参数。可以把需要预加载的内容通过 `return` 返回，然后在页面触发 componentWillMount 后即可通过 `this.$preloadData` 获取到预加载的内容。

注意：调用跳转方法时需要使用**绝对路径**，相对路径不会触发此钩子。

### 在小程序中，可以使用 this.$preload 函数进行页面跳转传参

用法：`this.$preload(key: String | Object, [ value: Any ])`

之所以命名为 $preload，因为它也有一点预加载数据的意味。

如果觉得每次页面跳转传参时，需要先把参数 stringify 后加到 url 的查询字符串中很繁琐，可以利用 `this.$preload` 进行传参。

另外如果传入的是下一个页面的数据请求 promise，也有上一点提到的“预加载”功能，也能够绕过 componentWillMount 延时。不同点主要在于代码管理，开发者可酌情使用。

```js
// 传入单个参数

// A 页面
// 调用跳转方法前使用 this.$preload
this.$preload('key', 'val')
Taro.navigateTo({ url: '/pages/B/B' })

// B 页面
// 可以于 this.$router.preload 中访问到 this.$preload 传入的参数
componentWillMount () {
  console.log('preload: ', this.$router.preload.key)
}
```

```js
// 传入多个参数

// A 页面
this.$preload({
  x: 1,
  y: 2
})
Taro.navigateTo({ url: '/pages/B/B' })

// B 页面
componentWillMount () {
  console.log('preload: ', this.$router.preload)
}
```

## 3.x的预加载

Taro 3 不再支持 `componentWillPreload`、`$preload` API，改为: `Taro.preload()`

```jsx
/** webView */
function Webview() {
  const { params: { url = '' } } = useRouter()
  function getUrl() {
    const url = Taro.Current.preloadData?.url
    Taro.preload({})
    return url
  }
  return (
    <WebView
      src={ getUrl() || decodeURIComponent(url || '')}
      onLoad={(e) => {
        console.log(e);
      }}
    ></WebView>
  )
}

/** 跳转页面 */
Taro.preload({
  url: ourUrl
})

Taro.navigateTo({
  url: '/pages/webView/index'
})
```

Taro 3 文档里目前没有 `Taro.preload` 的文档页面，只能去源码里查看：

### packages/taro-api/src/index.js

```js
import {
  ...
  getPreload,
  ...
} from './tools'
import {
  Current,
  ...
} from '@tarojs/runtime'

const Taro = {
  ...
  Current,
  ...
}

Taro.initPxTransform = getInitPxTransform(Taro)
Taro.preload = getPreload(Current)
Taro.pxTransform = getPxTransform(Taro)

export default Taro
```

### taro/packages/taro/types/taro.extend.d.ts

```ts
interface Current {
    app: AppInstance | null,
    router: RouterInfo | null,
    page: PageInstance | null,
    onReady: string,
    onHide: string,
    onShow: string,
    preloadData?: Record<any, any>
}
```

### preload

```js
export function getPreload (current) {
  return function (key, val) {
    if (typeof key === 'object') {
      current.preloadData = key
    } else if (key !== undefined && val !== undefined) {
      current.preloadData = {
        [key]: val
      }
    }
  }
}
```

