# ahooks

阿里巴巴的react自定义钩子库

## useRequest.ts

第一个参数是字符串的时候直接调用fetch API，如果是对象的话根据对象的属性进行自定义请求，如果是函数则执行自定义的请求逻辑（axios等）。

钩子内部主要是对第一个传参进行不同的处理，调用不同的异步请求，最终返回的是`useAsync`。

## useAsync.ts

里面分别定义了Fetch类和useAsync钩子函数。  

### useAsync钩子

在钩子函数里使用useState创建一个fetches对象（类型为对象），在这个state上使用key-value来保存`Fetch.state`（Fetch将run等方法放到了它的state上）。然后将这个state赋值给fetchRef的current，执行请求就是运行Ref上的fetches对象的run方法。

使用Ref是因为当run或者reset的时候，如果reset设置fetches新值后，在run方法里用state会取到旧值。而Fetch类内部的`subscribe`方法是由钩子函数内定义的`subscribe`方法（里面执行的是`setFetches`更新fetches）传入的，`subscribe`主要是用来**感知请求更新**的。所以需要一个Ref和一个state同时来维护fetches。

run方法分为Fetch类上的和钩子函数内的，钩子函数的run主要是做了从cache中取值（在`useUpdateEffect`钩子里将fetches进行缓存`setCache`，然后在run里面取出缓存`getCache`。这样的话reset方法就是将fetches和`fetchRef.current`设置为空对象），最终调用当前key对应的fetch对象的run方法。

在fetch对象的run方法里，判断config配置，最后决定使用`_run`，还是`debounceRun`（防抖）和`throttleRun`。

```js
// 卸载组件触发
useEffect(() => () => {
	Object.values(fetchesRef.current).forEach((f) => {
		f.unmount();
	});
}, []);
```

## useVirtualList

实现虚拟列表的钩子。返回list（最终显示的列表），scrollTo （跳转到某一条的方法）

传参是`itemHeight`行高，`overscan`额外展示的 dom 节点数量。

内部使用了`useSize`来监听DOM尺寸的变化。然后用`const [state, setState] = useState({ start: 0, end: 10 });`来控制渲染到页面的列表。

**计算起始范围方法：**

```js
  const calculateRange = () => {
    const element = containerRef.current;
    if (element) {
      // 固定高度 Math.floor(scrollTop / itemHeight) + 1
      // 高度不固定（itemHeight为函数）循环计算出offset
      const offset = getOffset(element.scrollTop); // 移动个数
      // 固定高度：Math.ceil(containerHeight / itemHeight)
      // 不固定高度：循环计算直到高度超出容器高度为止
      const viewCapacity = getViewCapacity(element.clientHeight);

      const from = offset - overscan;
      const to = offset + viewCapacity + overscan;
      setState({
        start: from < 0 ? 0 : from,
        end: to > list.length ? list.length : to,
      });
    }
  };

	// 设置到warpper的marginTop，滚过的距离用marginTop撑开
  const offsetTop = useMemo(() => getDistanceTop(state.start), [state.start]);
```



### useSize

useVirtualList 里：

```js
const containerRef = useRef<HTMLElement | null>();
const size = useSize(containerRef as MutableRefObject<HTMLElement>);
// ...
// 根据页面大小变化重新计算显示的列表范围
useEffect(() => {
    calculateRange();
}, [size.width, size.height]);
```

useSize内部实现：

```javascript
import { useState, useLayoutEffect } from 'react';
// 兼容使用ResizeObserver
import ResizeObserver from 'resize-observer-polyfill';
import { getTargetElement, BasicTarget } from '../utils/dom';

type Size = { width?: number; height?: number };

function useSize(target: BasicTarget): Size {
  const [state, setState] = useState<Size>(() => {
    const el = getTargetElement(target);
    return {
      width: ((el || {}) as HTMLElement).clientWidth,
      height: ((el || {}) as HTMLElement).clientHeight,
    };
  });

  // useEffect 在渲染时是异步执行，并且要等到浏览器将所有变化渲染到屏幕后才会被执行。 
  // useLayoutEffect 在渲染时是同步执行，其执行时机与 componentDidMount，componentDidUpdate 一致
  // useLayoutEffect 会阻塞浏览器渲染
  // 建议将修改 DOM 的操作里放到 useLayoutEffect 里，这样会一次渲染出来，而不会出现闪屏
  useLayoutEffect(() => {
    const el = getTargetElement(target);
    if (!el) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setState({
          width: entry.target.clientWidth,
          height: entry.target.clientHeight,
        });
      });
    });

    resizeObserver.observe(el as HTMLElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [typeof target === 'function' ? undefined : target]);

  return state;
}

export default useSize;
```

