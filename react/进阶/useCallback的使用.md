最开始使用 useCallback 的理由中，只有「需要保存一个函数闭包结果，如配合 debounce、throttle 使用」这个是真正需要使用 useCallback 的，其他的都可能带来风险。

当 useCallback 和 useEffect 组合使用时，由于 useCallback 的依赖项变化也会导致 useEffect 执行，这种隐式依赖会带来BUG或隐患。因为在编程中，函数只是一个工具，但现在一旦某个函数使用了 useCallback ，当这个函数的依赖项变化时所有直接或间接调用这个 useCallback 的都需要回归。

