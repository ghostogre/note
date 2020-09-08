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

