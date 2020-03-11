1. 使用`localStorage`。

2. 使用插件`vuex-persistedstate`。

   ```javascript
   /**
    * vuex的入口文件
    */
   import Vue from 'vue'
   import Vuex from 'vuex'
   import createPersistedState from "vuex-persistedstate/index"
   
   Vue.use(Vuex);
   
   import {article} from "@/store/article";
   import {user} from "@/store/user";
   import {category} from "@/store/category";
   import {editor} from "@/store/editor";
   
   export default new Vuex.Store({
     modules: {
       article,
       user,
       editor,
       category
     },
     plugins: [createPersistedState({
         paths: ["user"] // 这里指定存储的模块
     })] // 默认存储所有的模块
   })
   ```

   