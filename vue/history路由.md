1. 前端设置`mode: history`。

2. nginx: 

   ```
   location / {
     try_files $uri $uri/ /index.html;
   }
   
   当用户请求 http://localhost/example 时，这里的 $uri 就是 /example。 
   try_files 会到硬盘里尝试找这个文件。如果存在名为 /$root/example（其中 $root 是项目代码安装目录）的文件，就直接把这个文件的内容发送给用户。 
   显然，目录中没有叫 example 的文件。然后就看 $uri/，增加了一个 /，也就是看有没有名为 /$root/example/ 的目录。 
   又找不到，就会 fall back 到 try_files 的最后一个选项 /index.html，发起一个内部 “子请求”，也就是相当于 nginx 发起一个 HTTP 请求到 http://localhost/index.html。 
   ```

   要在服务端增加一个覆盖所有情况的候选资源：如果 URL 匹配不到任何静态资源，则应该返回同一个 `index.html` 页面，这个页面就是你 app 依赖的页面。

3. 其他的也可以在vue-router官网找到。