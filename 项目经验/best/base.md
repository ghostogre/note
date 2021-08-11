## 静态页面项目开发流程

大致了解了将静态 HTML 放在后端目录下开发的流程（无关业务代码）

采取的是 js + html 的形式，在 html 引入对应的 js 文件，common.js 和 jQuery 文件。类似侧边搜索栏的通用操作放到 common.js 里。

在使用 jQuery 的时候，大多通过 jQuery 的 selector 获取到对应的元素，然后获取到他里面的值（可以是存在 dom 的 attribute 里，或者说 innerText， 也可以是 `$('').val()`）。

