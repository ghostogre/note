## admin

1. 使用 umi 的指令直接搭建 antd pro + ts 项目（[antd pro 文档](https://pro.ant.design/docs/)）。

2. 项目中使用 umi 包装过的 useIntl（内部使用react-intl）进行国际化。pro 通过 umi 插件 @umijs/plugin-locale 来实现全球化的功能，并且默认开启。 @umijs/plugin-locale 约定 在 `src/locales` 中引入 相应的 js。如果想删除 pro 自带的全球化，可以通过 `npm run i18n-remove`，移除默认的一些国际化代码。

3. antd pro 文档不包含组件信息，组件信息在 [procomponent](https://procomponents.ant.design/) 这个文档里。

4. antd pro 页面title和页面布局的配置在 config 目录和 layout 目录下。routes 路由和布局也在 config 目录下。

5. ProForm 自带了数量可观的表单项, 这些组件本质上是 Form.Item 和 组件的结合。

6. ProLayout 与 PageContainer 配合使用可以自动生成面包屑，页面标题。

   - getPageTitle 封装了根据 menuData 上生成的 title 的逻辑。

7. favicon.ico 存在于 public 目录下，直接替换该目录下的图标即可替换标题图标。

8. antd pro 使用的是 umi 的 umi-request api。除了 umi-request ，umi hooks 中还包含了一个名字长得很像的 useRequest，查看文档就会知道 [umi hooks](https://hooks.umijs.org/zh-CN/hooks/async) 实际和 ahooks 基本一致。

   ```ts
   import { extend } from "umi-request";
   const request = extend({
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

   umi-request 不能直接获取到 response 的 data，需要显式调用 json() 将其转化成 json 数据。

9. import type

