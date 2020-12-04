# 根据Taro重新封装的useRequest

## useAsync

内部使用**newstFetchKey**记录这次请求的key（来源于options的fetchkey，没有设置fetchkey就使用默认的key，使用默认的key的时候就是单次请求），每次初始化fetches（fetches是state）的时候，从本地缓存获取fetches然后遍历执行返回新的fetches列表。每次run（这个run是钩子里的run方法）都会把新的fetch修改到fetches里，fetches改变会触发更新fetches到本地缓存，然后执行当前fetch的run方法（这里的run是fetch对象里的run方法）。

### refresh

```ts
 return {
    loading: (ready && !manual) || defaultLoading,
    data: initialData,
    error: undefined,
    params: [],
    cancel: notExecutedWarning('cancel'),
    refresh: notExecutedWarning('refresh'), // 默认的refresh，实际上是console.warn打印警告 - “第一次请求执行不能调用refresh”
    mutate: notExecutedWarning('mutate'),
	
    /** 最终返回的是fetch.state里面的具体实现和参数 */
    ...((fetches[newstFetchKey.current] as FetchResult<U, P> | undefined) || {}),
    run,
    fetches,
    reset,
  } as BaseResult<U, P>;
```

useAsync最终返回的是`FetchResult`里的refresh方法，而这个fresh指向的是Fetch里方法。我们在useRequest里面调用的refresh实际上就是当前fetch对象里的refresh方法（第一次的时候是notExecutedWarning方法，因为第一次请求不能refresh）

```ts
class Fetch {
    state: FetchResult<R, P> = {
        loading: false,
        // ...
        refresh: this.refresh.bind(this.that),
    };
    
    refresh() {
        return this.run(...this.state.params);
    }
} 
```



## useLoadMore

说白了就是在useAsync上面再包一层。每一次请求的时候从本地缓存里获取list和上一次非loading请求的数据（为什么是非loading呢，因为存在loadingDelay还有useAsync中每次run方法执行的时候就把fetches更新到缓存，需要确保这里不是loading状态中）。

钩子内部使用`d => d?.list.length || 0`作为fetchkey，传给useAsync。所以使用loadmore的时候，不能再传入fetchkey了，否则警报。

loadMore 场景下，如果 refreshDeps 变化，调用reload重置到第一页。

## 常用的Options

### reload和refresh

reload是触发重新加载，refresh是重置fetches然后重新请求。

#### reload

```ts
const reload = useCallback(() => {
  /** 调用useAsync钩子返回的reset和run */
  reset(); // 根据useAsync中代码，是清空整个fetches
  pageNo.current = 1
  run({list: [], pageNo: 1})
}, [run, reset, params])
```

### refreshDeps

`refreshDeps` 变化，会清空当前数据，并重新发起请求。当 `refreshDeps` 变化时，会使用之前的 params 重新执行 service。

### refreshOnWindowFocus

在屏幕重新获取焦点或重新显示时，是否重新发起请求。默认为 `false`，即不会重新发起请求。监听`visibilitychange`和`focus`页面事件来实现。

### ready

只有当 `options.ready` 变为 true 时, 才会发起请求，基于该特性可以实现串行请求，依赖请求等。

```ts
const hasTriggeredByReady = useRef(false)
/** ready只会在第一次变成true的时候发起请求（但是假如ready一开始就是true那就不会触发） */
useUpdateEffect(() => {
    if (ready) {
      // 在 run 里判断没有 ready, 记录请求参数，等 ready 后，发起请求用readyMemoryParams.current
      if (!hasTriggeredByReady.current && readyMemoryParams.current) {
        runRef.current(readyMemoryParams.current);
      }else if(!hasTriggeredByReady.current && defaultParams){
        runRef.current(defaultParams)
      }
      hasTriggeredByReady.current = true;
    }
}, [ready]);
/** 其他地方也有ready进行判断 */
```

