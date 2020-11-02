### 要点

1. 用户浏览器版本不一样，antd pro要求浏览器版本较高，假如版本较低的浏览器需要给用户一个升级提示。

2. less的使用（之前不熟悉的）

   ```markdown
   ## mixin 混合
   
   ​```
   .mixin {
     // ...
   }
   
   .mixined {
     .mixin();
   }
   ​```
   
   ## @规则嵌套和冒泡
   
   ## 函数（Functions）
   
   Less 内置了多种函数用于转换颜色、处理字符串、算术运算等。
   
   ## 循环
   
   ​```
   .loop(@n, @i: 1) when (@i =< @n) {
       .primary-@{i} {
           background: mix(@primary, #fff, 10%*@i);
       }
       .secondary-@{i} {
           background: mix(@secondary, #fff, 10%*@i);
       }
   
       .loop(@n, (@i + 1));
   }
   
   .loop(10);
   ​```
   ```

   

3. 例如antd的`Table`组件，假如某些列（复数）需要可编辑（需要配置render方法）。这时候我们要在columns（Table的列配置）里，给所有可编辑列设置相似的render函数？

   解决方法：可以抽取公共逻辑到函数里。但是这样还是要多次重复写公共函数，antd在官方示例里用的是先给需要设置可编辑的列对象加一个字段，然后对columns数组进行map循环处理，在循环里根据该字段进行判断然后进行处理。
   
4. 在antd里使用栅格来布局**搜索条件**表格，为了适应页面变化，最好是放在一个Row行下面，然后设置列`{ xl: 6, lg: 12, md: 24 }`。

5. 组件options数据类型和接口返回结果类型不一样，给其他库里的组件包裹一层的时候，可以使用库里的类型然后进行继承。

6. 定义在function或者class外的变量，方法。

7. ts类型每次都需要多次import，如何解决？

   - `*.d.ts`：声明文件

   - `declare`：表示声明作用。

   - `namespace`：namespace 可以在多个文件中声明，同名的namespace里的类型会合并。现在` modules` 才是推荐的组织代码结构的方式。

   - `///`：三斜线指令是包含单个XML标签的单行注释。 注释的内容会做为编译器指令使用。

     TypeScript 引入声明文件语法格式：

     ```ts
     /// <reference path = " runoob.d.ts" />
     // 它用于声明文件间的_依赖_。
     // 三斜线引用告诉编译器在编译过程中要引入的额外的文件。
     ```

     ```ts
     /// <reference path = " runoob.d.ts" />
     export = API // API - namespace - 这样就可以在全部文件里直接使用了
     ```

     

8. useRequest使用了合并类型，泛型默认值是any类型，假如类型错误，也就会使用默认的泛型。

   例如，在该项目中我在formatResult返回的`response.totalCount`是可选类型（可选类型相当于`YourType || undefined`），useRequest里`total`是必选，导致类型推断失败。useRequest的类型合并最终是根据传入的类型推断的，推断失败导致一直报错。

   泛型可以不需要显式使用`<T>`，编译器会通过**类型参数推断**的方式告知编译器我们使用了哪种类型作为类型T（隐式）。useRequest中就是这样，根据类型参数推断获得泛型类型，假如都不符合就都用any。
   
   tips：定义声明合并的时候，`export`导出不能只类似`export default function () { /** 具体实现 */ }`，否则类型不会一起导出。
   
9. 使用块注释`/** */`才能在vscode里有相应的文字提示。

10. 组件的全局类型定义：假如是class组件的直接就可以给全局定义class的类型，但是如果是函数组件该如何全局定义呢？还是说依然在组件里定义类型，或者从专门的ts文件导入类型。

11. react-window虚拟列表：`https://github.com/bvaughn/react-window`

12. `Upload`图片墙改造拖拽：`https://www.jianshu.com/p/c453904cd55e`

       **要点：**

       - `Upload`图片墙在鼠标移上去的时候，会显示操作浮层。使用全局属性修改遮罩到底部，防止浮层阻碍拖拽。

       - 使用`querySelectorAll`获取节点列表，然后绑定drag事件进行拖拽（h5）。这里有个技巧，因为获取到的是Nodelist对象而不是数组，所以遍历处理的时候使用`Array.forEach.call`来处理。

       - 删除和新增图片操作会触发`getFieldValue("fileList")`变更时，实际图片列表dom没有立即同步

         1. 删除操作时：dom上的class 的变更是和`getFieldValue("fileList")`同步的。可以通过class来计算出那些图片成员是正在删除的。
         2. 新增时：dom的新增会快于`getFieldValue("fileList")`的新增。

    - 拖拽的api要实现顺利的拖拽 draggerover 必须要`e.preventDefault()`，ondrop才能顺利获得setData的内容。

    - 当上传图片后`getFieldValue('files')`发生变化，但是还没有异步获取上传图片路径时，此时DOM没有变化，通过监听图片dom长度再次触发useEffect，监听新增的图片dom。

       - h5中 draggable 属性规定元素是否可拖动。

         **拖动事件：**

         1. dragstart：在元素开始被拖动时触发
         2. dragend：在拖动操作完成时触发
         3. drag：在元素被拖动时触发

         **释放区事件：**

         1. dragenter：被拖动元素进入到释放区所占据得屏幕空间时触发
         2. dragover：当被拖动元素在释放区内移动时触发
         3. dragleave：当被拖动元素没有放下就离开释放区时触发
         4. drop：当被拖动元素在释放区里放下时触发
         
         dataTransfer 对象用于保存拖动并放下过程中的数据。这个对象可以从所有拖动事件 drag events 的 dataTransfer 属性上获取。

13. **Form**

       - antd中如果需要使用Form来托管数据修改，需要组件提供`value`和`onChange`事件。

         自定义或第三方的表单控件，也可以与 Form 组件一起使用。只要该组件遵循以下的约定：

         > - 提供受控属性 `value` 或其它与 `valuePropName`的值同名的属性。
         > - 提供 `onChange` 事件或 `trigger` 的值同名的事件。
         > - 必须给`Form.Item`设置`name`，数据同步才会被 Form 接管

         

       - 使用`Form.List`可以动态增加、减少表单项。动态增减嵌套字段需要对 `field` 进行拓展，将 `field.name` 和 `field.fieldKey` 应用于控制字段。

       - `V4` 没有 `getFieldDecorator`，可以直接在`Form.Item`上面设置rules了，`getFieldDecorator`类似于v4的`noStyle`无样式绑定组件（可以在外面套一个没有name属性的`Form.Item`组件作为布局作用）

14. Form表单支持嵌套动态添加，所以类似商品内部的规格，可以使用简单的`Form.List`代替Table。这样不仅能使用Form的校验，而且代码量也更少。

15. Upload组件限制长度可以在`onChange`或者`getFieldFromEvent`事件里，用一个单独的state控制长度。

16. 开启CSS Modules之后默认的样式都为局部样式，使用`:global {}`定义全局样式

17. 使用use-immer的时候遍历数组的代码很想复用

18. 函数的参数，除非内联无法判断类型。

19. antd tree在数据较多的情况下（包含折叠的数据，稍微多点就会卡）卡顿

       - 据说设置`height`固定高度能解决部分卡顿（启动虚拟滚动）
       - 使用`loadData`进行异步加载，即使是一次给了所有数据（children）

20. **支付宝小程序分包**：

       主包只保留最常用的核心页面（首页、tabBar 页面和其他公共资源），将小程序中不经常使用的页面放到多个分包中，启动时只加载主包，使用时按需下载分包，不要一次性下载整个代码包，以提升首页启动速度。

[react-antd-admin](https://github.com/WinmezzZ/react-antd-admin)