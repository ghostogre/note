### 屏幕录制权限开启

WeChat的是:

```bash
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.xinWeChat',0,1,1,NULL,NULL,NULL,'UNUSED',NULL,0,1585206453);"
```



QQ的是:

```bash
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.qq',0,1,1,NULL,NULL,NULL,'UNUSED',NULL,0,1585206581);"
```



腾讯会议的app 可能是这个, 那么就执行下面命令:

```bash
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.meeting',0,1,1,NULL,NULL,NULL,'UNUSED',NULL,0,1585206926);"
```

### 消息通知

升级系统后可能需要重新安装APP才能获取通知权限，否则通知中心都不会显示APP。

## 重置单独的软件

系统提供的 tccutil 不支持重置单独一个软件的隐私权限，其实隐私设置是一个存放在 `~/Library/Application\ Support/com.apple.TCC/TCC.db` sqlite3 数据库，可以用`SQL Pro for sqlite(lite)` 打开。

也可以用 `brew install tccutil` 获取一个 tccutil 新命令，可以列出当前隐私设置有哪些，对单独软件进行清楚，其实也是直接操作 TCC.db 数据库