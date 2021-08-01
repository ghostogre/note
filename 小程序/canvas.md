## base64 和 getImageInfo

> 下面涉及到的 `wx.` 的 API 在 Taro 中都有对应的 API

在使用 taro-plugin-canvas 插件的时候，发现绘制图片的时候需要使用 `wx.getImageInfo` 获取图片大小信息才能保证正确的绘制图片。但是如果是 base64 的图片，`wx.getImageInfo` 是会报错的。

base64 格式图片数据，无法被 getImageInfo 直接调用，以下是**解决方案**：

1. 首先使用 `wx.base64ToArrayBuffer` 将 base64 数据转换为 ArrayBuffer 数据（**注意**：这里传入 base64 数据的时候，需要去掉`data:image/jpeg;base64`的开头）
2. 使用 `FileSystemManager.writeFile` 数据写为本地用户路径的二进制图片文件
3. 此时的图片文件路径在 `wx.env.USER_DATA_PATH` 中（或者使用`Taro.env.USER_DATA_PATH`），` wx.getImageInfo` 接口能正确获取到这个图片资源并 drawImage 至 canvas 上。

```js
const fsm = wx.getFileSystemManager();
// 自定义的文件名称
const FILE_BASE_NAME = 'tmp_base64src';

const base64src = function(base64data) {
  return new Promise((resolve, reject) => {
    const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
    if (!format) {
      reject(new Error('ERROR_BASE64SRC_PARSE'));
    }
    const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}.${format}`;
    const buffer = wx.base64ToArrayBuffer(bodyData);
    fsm.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success() {
        resolve(filePath);
      },
      fail() {
        reject(new Error('ERROR_BASE64SRC_WRITE'));
      },
    });
  });
};

export default base64src;
```

