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

19. `loading.effects['login/login']`：

    **dva-loading** 的代码

20. antd 的权限管理

21. umi 的 redux 由 dva 管理，使用 hooks 和 props 获取 dispatch 方法以外，还可以使用 `import { getDvaApp } from 'umi'`获取到 dva 实例，获取到 dva 的 store （`getDvaApp()._store.dispatch`），全局的调用 dispatch。

