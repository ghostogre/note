## 常用的Options

### reload和refresh

reload是触发重新加载，refresh是重置fetches然后重新请求。

### refreshDeps

`refreshDeps` 变化，会清空当前数据，并重新发起请求。当 `refreshDeps` 变化时，会使用之前的 params 重新执行 service。

### refreshOnWindowFocus

在屏幕重新获取焦点或重新显示时，是否重新发起请求。默认为 `false`，即不会重新发起请求。

