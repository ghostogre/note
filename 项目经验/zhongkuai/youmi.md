## admin

1. 使用 umi 的指令直接搭建 antd pro + ts 项目（[antd pro 文档](https://pro.ant.design/docs/)）。

2. 项目中使用 umi 包装过的 useIntl（内部使用react-intl）进行国际化。pro 通过 umi 插件 @umijs/plugin-locale 来实现全球化的功能，并且默认开启。 @umijs/plugin-locale 约定 在 `src/locales` 中引入 相应的 js。如果想删除 pro 自带的全球化，可以通过 `npm run i18n-remove`，移除默认的一些国际化代码。

3. antd pro 文档不包含组件信息，组件信息在 [procomponent](https://procomponents.ant.design/) 这个文档里。

4. antd pro 页面title和页面布局的配置在 config 目录和 layout 目录下。routes 路由和布局也在 config 目录下。

5. ProForm 自带了数量可观的表单项, 这些组件本质上是 Form.Item 和 各种表单组件 的结合。

   - ProCard 组件用于页面各种分块，可以将页面切分为多个个白色带 padding 的 div 块。

   - ProFormText 的 required 属性只能给 label 添加前面红色的星号，输入框校验还是需要 rules 里配置 `required: true`。ProForm 实际上是整合了 antd 的Form.Item 和 Input 的组件。

     ```ts
     ({ getFieldValue }) => ({
       validator(_, value) {
         if (!value || getFieldValue('password') === value) {
           return Promise.resolve();
         }
         return Promise.reject(new Error('The two passwords that you entered do not match!'));
       },
     })
     ```

6. ProLayout 与 PageContainer 配合使用可以自动生成面包屑，页面标题。

   - getPageTitle 封装了根据 menuData 上生成的 title 的逻辑。

7. favicon.ico 存在于 public 目录下，直接替换该目录下的图标即可替换标题图标。

8. antd pro 使用的是 umi 的 umi-request api。除了 umi-request ，umi hooks 中还包含了一个名字长得很像的 useRequest，查看文档就会知道 [umi hooks](https://hooks.umijs.org/zh-CN/hooks/async) 实际和 ahooks 基本一致。

   ```ts
     prefix: "xxx", //相当于baseurl 
     timeout: 10000,
     errorHandler,
     suffix: ".json",
     headers: {
       "Content-Type": "multipart/form-data"
     },
     params: {
       token: "xxx" // 所有请求默认带上 token 参数
     },
   });
   function errorHandler(error) {
    	// ...
   }
   // request拦截器, 改变url 或 options.
   request.interceptors.request.use((url, options) => {
     return {
       url,
       options: { ...options, interceptors: true },
     };
   });
   
   // 局部拦截器使用
   request.interceptors.response.use(async (response, options) => {
     console.log(await response.clone().json())
     return response;
   });
   
   // 中间件
   request.use(async (ctx, next) => {
     console.log("b1");
     await next();
     console.log("b2");
   });
   ```

   umi-request 引入了**中间件机制**，类似 koa 的洋葱模型。

   默认使用的是 fetch 发起请求，不能直接获取到 response 的 data，需要显式调用 json() 将其转化成 json 数据，拦截器里获取到的 response 是一个 promise，需要使用 async 才能获取到 `await response.clone().json()`。

9. 使用 useRequest 的时候，返回数据 data 的类型需要在我们的返回数据外侧包裹一层 data 结构的才能正确的推断出来。（最好的方法是定义一个格式化类型，在调用请求方法的时候，将我们的具体返回类型作为泛型传入其中。）useRequest 显示声明 formatResult 也能正常推断出正确的类型，这时候不需要设置 data 包裹。

   ```ts
   function useRequest<R extends ResultWithData = any, P extends any[] = any>(
     service: CombineService<R, P>,
     options?: BaseOptions<R['data'], P>,
   ): BaseResult<R['data'], P>;
   
   function useRequest<R extends LoadMoreFormatReturn = any, RR = any>(
     service: CombineService<RR, LoadMoreParams<R>>,
     options: LoadMoreOptionsWithFormat<R, RR>,
   ): LoadMoreResult<R>;
   export interface LoadMoreOptionsWithFormat<R extends LoadMoreFormatReturn, RR> extends Omit<BaseOptions<R, LoadMoreParams<R>>, 'loadMore'> {
       loadMore: true;
       formatResult: (data: RR) => R;
       ref?: RefObject<any>;
       isNoMore?: (r: R | undefined) => boolean;
       threshold?: number;
   }
   
   const { data } = useRequest(
   	doApi,
     {
       formatResult: () => {}
       // 只要显示声明，就算 formatResult 是一个空函数
       // 也能正常通过 formatResult 即将获得的传参推断出data的类型
     }
   )
   
   /** ts能够正确推断返回类型的类型 */
   interface dataCond {
       data: {
          /** 具体返回数据 */
       }
   }
   
   /** 结果format类型 */
   interface Result<T> {
       data: T
   }
   
   /** 在调用请求方法的时候，将我们的具体类型作为泛型传入 */
   const requestMethod = () => request<Result<OurType>>({})
   ```

   

10. **import type**：在 umi 命令下生成的 antd 项目里出现了`import type {xxx} from 'xxx'`这样的引入。这个是 flow 工具的一个语法，虽然项目中已经使用了 typescript，使得脚本生成的代码可以兼容 JS。import type 作用就是从另一个模块中导入数据类型（包含`export tyoe xxx`的模块），引入一个类（class）的目的，只是想使用他的类型标注（type annotation），那么你就可以使用这个import type语法。

11. **antd 表单**

    - 表单提交只要返回的是一个 promise ，提交按钮自动呈现 loading 状态，这样便不需要节流（事实上之前的经验来看，即使做了节流也只是推迟了执行的时间，点击多次节流时间结束后依然会连续触发）。
    - 浮层表单 ModalForm 集成了触发按钮的位置。
    - 类似浮层弹浮层的功能，最好使用分布表单或者说侧滑表单来实现。
    - 表单数据异步加载或者动态改变需要手动刷新。

12. 布局 layout：

    - SecurityLayout 里嵌套一层授权校验组件，配置自己的登录认证规则。

13. `{ ...undefined }`不会报错，结果是空对象。

14. **jsencrypt** 本地 cookie 保存密码时（记住密码功能）使用 jsencrypt 为密码进行加密。

15. 在 antd 自动生成的项目里，类似表单列 columns 这样的数组是直接定义在了组件外面。给 ProTable 初始化配置的时候，是用一个定义在组件外的 config 对象初始化一个 state，然后再`<ProTable {...config}>`这样就能一次性把属性设置到组件上去了。这样的话，重新初始化和修改其中的配置就很方便。

16. 在 antd pro 项目里，有`<ModalForm<T, U>>`这样的写法，这样的写法可以把自己项目的类型传入到组件里去。

17. ProTable 里面 request 实现了将 useRequest 托管请求的方法，相当于整合了 useRequest 和 Table。

18. 在 4.0 之后，Button 的 danger 成为一种按钮属性而不是按钮类型。

19. 在connect 中看到`isLoading: loading.effects['xxx/xxx']`这样的代码：

    这是过渡组件**dva-loading** 的代码，该组件仅仅监听异步加载状态。loading 在异步请求发出那一刻会持续监听该异步请求方法的状态，在异步请求结束之前 isLoading 的值一直是 true，当此次异步请求结束时 isLoading 的值变成 false，同时 loading 对象停止监听。

    dva 项目的 index.js 文件：

    ```jsx
    import createLoading from 'dva-loading';
    
    const app = dva();
    
    app.use(createLoading());
    ```

    配置完成后，在任何一个 dva 的 routes 组件中就都会有一个 loading 对象，如果你对 dva 稍有了解的话，应该不难知道它在哪。比如下面这行代码中的 loading 对象就是由于上面的配置。

    ```jsx
    export default connect(({ app, loading }) => ({ app, loading }))(App);
    ```

    打印一下 loading 对象，可看到内容如下：

    ```css
    loading: {
      global: false,
      models: {app: false},
      effects: {app: false}
    }
    ```

    loading 有三个方法，其中 `loading.effects['user/query']` 为监听单一异步请求状态，当页面处于异步加载状态时该值为 true，当页面加载完成时，自动监听该值为 false。

    如果同时发出若干个异步请求，需求是当所有异步请求都响应才做下一步操作，可以使用 `loading.global()` 方法，该方法监听所有异步请求的状态。

20. antd 的**权限管理**（`components/Authorized/...`）

    - `index.tsx`：组件判断逻辑，返回`RenderAuthorize(Authorized)`。
    - `renderAuthorize.ts`：实际上是`(Authorized) => (currentAuthority) => { ... }`，最终返回的还是`Authorized`组件。根据 currentAuthority 的不同类型导出 CURRENT 。
    - `Authorized.tsx`：调用 checkPermission 返回不同的渲染结果。
    - `CheckPermissions.tsx`：判断当前组件权限和当前用户的权限是否匹配。
    - `AuthorizedRoute.tsx`：返回 Authorized 组件包裹的 Route 组件。
    - `PromiseRender.tsx`：异步过程中显示加载动画。
    - V4 的权限不能阻止直接输入URL进入页面，需要依靠后端返回权限路由才能实现，或者使用V5版本。

21. umi 的 redux 由 dva 管理，使用 hooks 和 props 获取 dispatch 方法以外，还可以使用 `import { getDvaApp } from 'umi'`获取到 dva 实例，获取到 dva 的 store （`getDvaApp()._store.dispatch`），全局的调用 dispatch。

22. antd pro 的浮层等是渲染在 root 节点以外的，所以不能用页面类名包裹起来。

23. ProCard 如果包装成组件，那么外部的 ProCard 的布局无法对组件内的 ProCard 生效。

24. **ProCard.Group**：属性同 ProCard，会取消卡片内容边距，用于将多个卡片进行分组。直接用 ProCard 包裹卡片列表，会有内边距。

25. **复制图片/保存图片**：

- **QRCode.js** 是一个用于生成二维码的 JavaScript 库。主要是通过获取 DOM 的标签,再通过 HTML5 Canvas 绘制而成,不依赖任何库。

  ```ts
  new QRCode(document.getElementById("qrcode"), "http://www.runoob.com");  // 设置要生成二维码的链接
  ```

- 要在前端生成图片，自然会想到利用Canvas技术来做，但是如何利用Canvas在团队内有两种思路：第一种是完全自己封装Canvas API来作图，第二种是直接使用开源库，比如流行的 **html2canvas** 库（`html2canvas(element, { useCORS: true, allowTaint: false // 允许跨域 })`返回一个promise，then的参数是一个 htmlCanvasElement）。html2canvas库的工作原理并不是真正的“截图”，而是读取网页上的目标DOM节点的信息来绘制canvas，所以它并不支持所有的css属性，而且期望**使用的图片跟当前域名同源**，不过官方也提供了一些方法来解决跨域图片的加载问题。

- 在前端开发中，HTML中的 `img` 标签是默认支持跨域的，但是这个规则canvas不认。使用html2canvs转换canvas的时候，如果使用了不同域的图片就会报错。

- 使用方法很简单，引入 html2canvas 库以后，拿到目标 dom 调用一下 html2canvas 方法就能生成canvas对象了，由于我们的目标是生成图片，所以还需要再调用 `canvas.toDataURL()` 方法生成`<img>`标签的可用数据（`HTMLCanvasElement.toDataURL()` 方法返回一个包含图片展示的 data URI ）。

- Data URLs 由四个部分组成：前缀(`data:`)、指示数据类型的MIME类型、如果非文本则为可选的`base64`标记、数据本身：`data:[<mediatype>][;base64],<data>`。

  ```ts
  		let arr = dataUrl.split(',');
      const matchResult = arr[0].match(/:(.*?);/)
      if (!!matchResult) {
        let mime = matchResult[1];
        let bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
  		}
  ```

- **base64**：

  由于HTTP协议是文本协议，所以在HTTP协议下传输二进制数据需要将二进制数据转换为字符数据。然而直接转换是不行的。因为网络传输只能传输可打印字符。

  问： 什么是“可打印字符”呢？
  答： 在ASCII码中规定，0~31、128这33个字符属于控制字符，32~127这95个字符属于可打印字符，也就是说网络传输只能传输这95个字符，不在这个范围内的字符无法传输。

  问： 那么该怎么才能传输其他字符呢？
  答： 其中一种方式就是使用Base64。Base64一般用于在HTTP协议下传输二进制数据。

  HTML规范中已经规定了base64转换的API，window对象上可以访问到base64编码和解码的方法，直接调用即可。

  ```ts
  window.atob() // 对base64编码过的字符串进行解码
  window.btoa() // 对ASCII编码的字符串进行base64编码（不支持汉字，汉字可通过URIencode预处理后再编码）
  ```

  **Uint8Array**

  **`Uint8Array`** 数组类型表示一个8位无符号整型数组，创建时内容被初始化为0。创建完后，可以以对象的方式或使用数组下标索引的方式引用数组中的元素。

  

  **URL.createObjectURL()**

  **`URL.createObjectURL()`** 静态方法会创建一个 [`DOMString`](https://developer.mozilla.org/zh-CN/docs/Web/API/DOMString)，其中包含一个表示参数中给出的对象的URL。这个 URL 的生命周期和创建它的窗口中的 [`document`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document) 绑定。这个新的URL 对象表示指定的 [`File`](https://developer.mozilla.org/zh-CN/docs/Web/API/File) 对象或 [`Blob`](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) 对象。简单的理解一下就是将一个`file`或`Blob`类型的对象转为`UTF-16`的字符串，并保存在当前操作的`document`下。

  `URL.createObjectURL(file)`得到本地内存容器的`URL`地址，方便预览，多次使用需要注意手动释放内存的问题，性能优秀。 `FileReader.readAsDataURL(file)`胜在直接转为`base64`格式，可以直接用于业务，无需二次转换格式。

  

  **复制文案**：

- **选择图片 - Window.getSelection**：返回一个 Selection 对象，表示用户选择的文本范围或光标的当前位置。如果想要将 selection 转换为字符串，可通过连接一个空字符串（""）或使用 toString() 方法。

  ```ts
  function foo() {
      let selObj = window.getSelection();
      console.log(selObj);
      let selRange = selObj.getRangeAt(0);
    	var selectedText = selObj.toString();
  }
  ```

  在Firefox, Edge (非 Chromium 版本) 及 Internet Explorer 中没有这个API。

  ```ts
  if (window.getSelection) {
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNode(targetNode);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy')
  }
  ```

- 在IE等浏览器中：

  ```ts
  if (document.body.createTextRange) {
      //ie
      var range = document.body.createTextRange(); // 该属性是IE专有的。尽管IE很好地支持它，但大部分其它浏览器已经不支持该属性。
      range.moveToElementText(targetNode); // 使区域包含指定元素的文本
      range.select();
  }
  ```


- 保存图片：

  ```ts
  		let a = document.createElement('a');
      document.body.scrollTop = document.documentElement.scrollTop = 0
      html2canvas(canvasID,{
        useCORS: true
      }).then(canvas => {
        const dom = document.body.appendChild(canvas);
        dom.style.display = 'none';
        a.style.display = 'none';
        document.body.removeChild(dom);
        const blob = dataURLToBlob(dom.toDataURL('image/png'));
        // URL.createObjectURL(blob) 会产生一个类似 blob:d3958f5c-0777-0845-9dcf-2cb28783acaf 这样的URL字符串
        // 可以像使用普通 URL 那样使用它，比如用在 img.src 上。
        a.setAttribute('href', URL.createObjectURL(blob));
        //这块是保存图片操作  可以设置保存的图片的信息
        a.setAttribute('download', imgText + '.png');
        document.body.appendChild(a);
        a.click();
        // URL.revokeObjectURL() 静态方法用来释放一个之前已经存在的
        // 通过调用 URL.createObjectURL() 创建的 URL 对象。
        URL.revokeObjectURL(blob);
        document.body.removeChild(a);
      });
  ```

26. [编译打包](https://umijs.org/zh-CN/guide/boost-compile-speed#%E6%9F%A5%E7%9C%8B%E5%8C%85%E7%BB%93%E6%9E%84)：antd pro 项目是使用 umi 创建的，`config/conifg`里的配置对应了 `.umirc.js`里的配置，优化打包的时候大部分不需要我们自己修改。antd pro 默认使用了esbuild进行编译。antd中的DatePicker组件使用了moment.js作为时间相关的工具库，moment.js在代码中占了344.98KB，这其中还包括语言相关的文件287.42KB，antd pro默认配置了`ignoreMomentLocale: true`，帮我们删除了moment的locale相关文件。我们可以配置 external 实现 cdn 引入 react 和 reactDom。
27. 

