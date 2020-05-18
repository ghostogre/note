## echarts-for -react

```jsx
import ReactEcharts from 'echarts-for-react';
 
// render echarts option.
<ReactEcharts option={this.getOption()} />
```

### javascript

```jsx
import React from 'react';
import ReactEcharts from 'echarts-for-react';  // or var ReactEcharts = require('echarts-for-react');
 
<ReactEcharts
  option={this.getOption()}
  notMerge={true}
  lazyUpdate={true}
  theme={"theme_name"}
  onChartReady={this.onChartReadyCallback}
  onEvents={EventsDict}
  opts={} />
```

### typescript

```jsx
import * as React from "react";
import ReactEcharts from "echarts-for-react";
 
<ReactEcharts
  option={this.getOption()}
  notMerge={true}
  lazyUpdate={true}
  theme={"theme_name"}
  onChartReady={this.onChartReadyCallback}
  onEvents={EventsDict}
  opts={} />
```

手动导入echarts可以**减少打包**的大小。

```jsx
import React from 'react';
// 导入核心库
import ReactEchartsCore from 'echarts-for-react/lib/core';
 
// 导入echarts模块
import echarts from 'echarts/lib/echarts';
// import 'echarts/lib/chart/*'; 按需导入模块
import 'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
<ReactEchartsCore
  echarts={echarts}
  option={this.getOption()}
  notMerge={true}
  lazyUpdate={true}
  theme={"theme_name"}
  onChartReady={this.onChartReadyCallback}
  onEvents={EventsDict}
  opts={} />
```

------

## props

- **`option`** (required, object)：echart 配置选项
- **`notMerge`** (optional, object)：默认是`false`，当`setOption`，不合并data
- **`lazyUpdate`** (optional, object)：默认是`false`，当`setOption`，使用懒更新。
- **`style`** (optional, object)：echart的`div`上的`style`，默认是` {height: '300px'}`。
- **`className`** (optional, string)：echart的`div`上的`className`。
- **`theme`** (optional, string)：echarts的主题. `string`, 使用前应该先使用 `registerTheme` 

```jsx
// import echarts
import echarts from 'echarts';
...
// register theme object
echarts.registerTheme('my_theme', {
  backgroundColor: '#f4cccc'
});
...
// render the echarts use option `theme`
<ReactEcharts
  option={this.getOption()}
  style={{height: '300px', width: '100%'}}
  className='echarts-for-echarts'
  theme='my_theme' />
```

- **`onChartReady`** (optional, function)：这时候chart准备好了，传递echart对象给回调函数。

- **`loadingOption`** (optional, object)：显示加载动画效果。可以在加载数据前手动调用该接口显示加载动画。

- **`showLoading`** (optional, bool, default: false)：布尔类型，渲染的时候是否显示蒙版。

- **`onEvents`** (optional, array(string=>function) )：绑定事件

  ```jsx
  let onEvents = {
    'click': this.onChartClick,
    'legendselectchanged': this.onChartLegendselectchanged
  }
  ...
  <ReactEcharts
    option={this.getOption()}
    style={{height: '300px', width: '100%'}}
    onEvents={onEvents} />
  ```

- **`opts`** (optional, object)：`echarts.init`

## getEchartsInstance()

获取 echart 的实例对象，然后你可以在上面使用 echart 的API。

```jsx
// render the echarts component below with rel
<ReactEcharts ref={(e) => { this.echarts_react = e; }}
  option={this.getOption()} />
 
// then get the `ReactEcharts` use this.echarts_react
 
let echarts_instance = this.echarts_react.getEchartsInstance();
// then you can use any API of echarts.
let base64 = echarts_instance.getDataURL();
```

