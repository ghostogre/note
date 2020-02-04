node-sass当node版本和npm变化后会出现和环境不匹配，所以需要

```
npm rebuild node-sass
npm update
```

node-sass需要node-gyp，这个包不完全支持python3.0以上

所以我们使用windows-build-tools

```
npm i --global --production window-build-tool
npm config set python "C:\Users\yingjh\.windows-build-tools\python27\python.exe"
yarn config set python "C:\Users\yingjh\.windows-build-tools\python27\python.exe"
```

windows-build-tools会给我们安装python，我们需要给npm和yarn配置一下到windows-build-tools下的python路径