整个过程就是遍历`effectList`并调用`commitBeforeMutationEffects`函数处理。

> 这部分[源码在这里 (opens new window)](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2104-L2127)。示例代码中省略了不相关的逻辑

```js
// 保存之前的优先级，以同步优先级执行，执行完毕后恢复之前优先级
const previousLanePriority = getCurrentUpdateLanePriority();
setCurrentUpdateLanePriority(SyncLanePriority);

// 将当前上下文标记为CommitContext，作为commit阶段的标志
const prevExecutionContext = executionContext;
executionContext |= CommitContext;

// 处理focus状态
focusedInstanceHandle = prepareForCommit(root.containerInfo);
shouldFireAfterActiveInstanceBlur = false;

// beforeMutation阶段的主函数
commitBeforeMutationEffects(finishedWork);

focusedInstanceHandle = null;
```

我们重点关注`beforeMutation`阶段的主函数`commitBeforeMutationEffects`做了什么。

## [#](https://react.iamkasong.com/renderer/beforeMutation.html#commitbeforemutationeffects)commitBeforeMutationEffects