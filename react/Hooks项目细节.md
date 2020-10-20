1. 区分使用`useEffect`和`useMemo`的使用场景。

   - 问题：思考下面的代码是不是会出现`useMemo`触发两次的情况？

   - 场景：例如购物车在选择商品后，适用的优惠券有不同的ID，例如总价计算依赖优惠券和购物车选中商品（`useMemo`），当购物车选中列表改变后，优惠券也会改变，这样会触发两次。获取优惠券需要异步请求或者复杂计算，这样就不合适了。
   
   - 原因：`useMemo()` 是在 render 期间执行的，所以不能进行一些额外的副操作，比如网络请求等。`useEffect`是渲染后执行的，首先修改x，会先触发`useMemo`执行，然后x修改后的结果渲染到页面后，`useEffect`触发修改y，这样的话又会执行一次`useMemo`。这样`useMemo`会执行两次。
   
     ```jsx
       const [ x, setX ] = useState(true)
       const [ y, setY ] = useState(false)
       useEffect(() => { // 渲染后执行
         if (x) {
           setY(false)
         } else {
           setY(true)
         }
       }, [x])
     
       const toggle = () => {
         setX(!x)
       }
     
       const xy = useMemo(() => { // 渲染中执行
         console.log('useMemo') // toggle执行，这里会执行两次console
         return x + '|' + y
       }, [x, y])
       
       return (
       	<>
           {/* taro */}
           <View>X:{x}</View>
           <View>Y:{y}</View>
           <View>XY:{xy}</View>
           <Button onClick={toggle}>toggleX</Button>
         </>
       )
     ```
   
     - **解决方案**：
     
       1. 在购物车选中里触发的`useEffect`里进行优惠券的获取和计算，直接在选中商品触发的`useEffect`里改变优惠券ID和计算总价。这时候总价（xy）不能再使用`useMemo`计算的值，而是作为state值使用。
     
       2. **多个`useEffect`的执行顺序是按照代码顺序执行的**，按照顺序编写`useEffect(() => {...}, [x])`和`useEffect(() => {...}, [x, y])`来分离代码，本质上和1 是一样的。
     
       3. `useMemo`可以互相依赖，但是存在副作用（例如异步请求）最好使用`useEffect`。我们可以使用例如`const summary = useMemo(() => {...}, [carts]); const deductSummary = useMemo(() => {...}, [summary])`
     
          ```jsx
            const [x, setX] = useState(false)
            const y = useMemo(() => {
              return !x
            }, [x])
            const xy = useMemo(() => {
              console.log('useMemo xy') // 只会执行一次
              return x + '|' + y
            }, [x, y])
            
            return (
            	<>
                <View>X:{x}</View>
                <View>Y:{y}</View>
                <View>XY:{xy}</View>
                <Button onClick={() => {setX(!x)}}>toggleX</Button>
              </>
            )
          ```
     
          
     
     - 触发渲染，说白了就是将这个函数组件的函数，再执行一次。
     
     - Hooks 允许我们**根据它正在做的事情**而不是生命周期方法名称来拆分代码。React 将按照指定的顺序应用组件使用的每个 effect。
   
2. **useEffect Dependencies**

   例如：

   ```tsx
   function Counter() {
     const [count, setCount] = useState(0);
   
     useEffect(() => {
       const id = setInterval(() => {
         setCount(count + 1);
       }, 1000);
       return () => clearInterval(id);
     }, []);
   
     return <h1>{count}</h1>;
   }
   ```

   `setInterval` 我们只想执行一次，所以我们自以为聪明的向 React 撒了谎，将依赖写成 `[]`。由于 useEffect 符合 Capture Value 的特性（每次渲染，state和props都是独立的），拿到的 `count` 值永远是初始化的 `0`。**相当于 `setInterval` 永远在 `count` 为 `0` 的 Scope 中执行，你后续的 `setCount` 操作并不会产生任何作用。**

   但是如果你设置`count`到依赖里，那么每次触发都会重新清除和创建定时器。

   想要不依赖外部变量，可以使用函数回调设置值。

   同时依赖了两个 `state` 的情况：

   ```ts
   useEffect(() => {
     const id = setInterval(() => {
       setCount(c => c + step);
     }, 1000);
     return () => clearInterval(id);
   }, [step]);
   ```

   你会发现不得不依赖 `step` 这个变量。利用 `useEffect` 的兄弟 `useReducer` 函数，将更新与动作解耦就可以了：

   利用 `useEffect` 的兄弟 `useReducer` 函数，将更新与动作解耦就可以了：

   ```ts
   const [state, dispatch] = useReducer(reducer, initialState);
   const { count, step } = state;
   
   useEffect(() => {
     const id = setInterval(() => {
       dispatch({ type: "tick" }); // Instead of setCount(c => c + step);
     }, 1000);
     return () => clearInterval(id);
   }, [dispatch]);
   ```

   这就是一个局部 “Redux”，由于更新变成了 `dispatch({ type: "tick" })` **所以不管更新时需要依赖多少变量，在调用更新的动作里都不需要依赖任何变量。** 具体更新操作在 `reducer` 函数里写就可以了。

3. 如果函数定义不在 `useEffect` 函数体内，不仅可能会遗漏依赖，而且 `eslint` 插件也无法帮助你自动收集依赖。不过只要不依赖 Function Component 内变量的函数都可以安全的抽出去。

   **如果非要把 Function 写在 Effect 外面呢？**

   如果非要这么做，就用 `useCallback` 吧！

   由于函数也具有 Capture Value 特性，经过 `useCallback` 包装过的函数可以当作普通变量作为 `useEffect` 的依赖。`useCallback` 做的事情，就是在其依赖变化时，返回一个新的函数引用，触发 `useEffect` 的依赖变化，并激活其重新执行。









