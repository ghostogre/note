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
   
     - 解决方案：在x触发的`useEffect`里进行优惠券的获取和计算，总价不使用`useState`而不是`useMemo`，在选择购物车商品的时候，在副作用里改变优惠券ID和计算总价。
     - 触发渲染，说白了就是将这个函数组件的函数，再执行一次

