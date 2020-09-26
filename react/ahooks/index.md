# ahooks

阿里巴巴的react自定义钩子库

## useRequest.ts

第一个参数不是自定义请求方法的时候直接调用fetch API，如果是对象的话根据对象的属性进行自定义请求，如果是函数则执行自定义的请求逻辑（`axios`, `umi-request`等）。

钩子内部主要是对第一个传参进行不同的处理，调用不同的异步请求，最终返回的是`useAsync`/`usePaginated`/`useLoadMore`（根据options的`paginated`和`loadmore`决定）。

> option中可以设置ready，ready为true的时候才会发起请求。
>
> 使用ready的时候，注意ready为true的时候，发起的请求参数会是之前缓存的参数。

## useAsync.ts

里面分别定义了Fetch类和useAsync钩子函数。  

### useAsync钩子

在钩子函数里使用useState创建一个fetches对象（类型为对象），在这个state上使用key-value来保存`Fetch.state`（Fetch将run等方法放到了它的state上）。然后将这个state赋值给fetchRef的current，执行请求就是运行Ref上的fetches对象的run方法。

使用Ref是因为当run或者reset的时候，如果reset设置fetches新值后，在run方法里用state会取到旧值。而Fetch类内部的`subscribe`方法是由钩子函数内定义的`subscribe`方法（里面执行的是`setFetches`更新fetches）传入的，`subscribe`主要是用来**感知请求更新**的。所以需要一个Ref和一个state同时来维护fetches。

run方法分为Fetch类上的和钩子函数内的，钩子函数的run主要是做了从cache中取值（在`useUpdateEffect`钩子里将fetches进行缓存`setCache`，然后在run里面取出缓存`getCache`。这样的话reset方法就是将fetches和`fetchRef.current`设置为空对象），最终调用当前key对应的fetch对象的run方法。

在fetch对象的run方法里，判断config配置，最后决定直接使用`_run`，还是`debounceRun`（防抖）和`throttleRun`（这两个方法其实是`lodash`里的方法，根据配置config有没有设置防抖节流的时间来判断是否开启）。

```js
// 卸载组件触发
useEffect(() => () => {
	Object.values(fetchesRef.current).forEach((f) => {
		f.unmount();
	});
}, []);
```

### utils（工具和钩子）

1. `usePersistFn`：内部用一个ref保存这个函数（`fn`），然后返回一个`useCallback`处理的函数名叫`persist`，`persist`就是从ref上取出`fn`进行调用。`presisit useCallback`的依赖只有这个ref。（持久化非state只有使用ref）

2. `useUpdateEffect`：就是包装后的`useEffect`，内部也是维护一个ref - `isMounted`。每当传入的依赖数组变化，判断`isMounted`是否为true，然后决定执行传入的回调（假如为true），还是设置`isMounted`为true。**如名字所述，这个是只在update的时候执行的useEffect，普通useEffect在第一次页面加载的时候也会执行一次**。（这个在小程序开发很有用，因为如果在`useDidShow`里也进行了加载操作，就会重复执行两次加载。至于为什么用ref保存`isMounted`呢？因为如果和页面渲染无关的state不会及时更新，而普通变量没有记录上一次的值的能力）

3. `cache`（工具函数）：用一个Map去进行缓存，key-value的形式。value值包括data，timer（定时器，根据传入的缓存期限到期删除这个key-value），staleTime（数据新鲜时间）。

4. `limit`：利用闭包保证同时只运行一个函数。

5. `index`：`isDocumentVisible` ：document是否显示。`isOnline`：是否离线状态。

6. `windowFocus`：返回一个`subscribe`函数，这个函数运行时候会将传入的回调加入到一个数组`listeners`，最终返回一个`unsubscribe`函数（内部使用`splice`删除对应index的回调）。使用`window.addEventListener`绑定页面的`visiblechange`和`focus`事件，每次触发事件依次调用listeners数组里的回调函数。

   其中使用了一个`eventBinded`布尔变量使得绑定事件只绑定一次。

7. `windowVisble`：基本上如`windowFocus`一样，但是不绑定监听`focus`事件。

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

