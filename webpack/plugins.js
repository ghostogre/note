const { SyncHook } = require('tapable')

const hook1 = new SyncHook(['arg1', 'arg2', 'arg3'])

hook1.tap('hook1', (arg1, arg2, arg3) => {
  console.log(arg1, arg2, arg3)
})

hook1.call(1, 2, 3)
