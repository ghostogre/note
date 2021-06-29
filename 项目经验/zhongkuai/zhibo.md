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