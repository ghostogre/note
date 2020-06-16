const reverse = (num) => {
  if (typeof num !== 'number') {
    return 0
  }
  const MAX = Number.MAX_SAFE_INTEGER
  const MIN = Number.MIN_SAFE_INTEGER
  const reset = num > 0 ? String(num).split('').reverse().join('') : String(num).slice(1).split('').reverse().join('')
  // 添加符号位
  const result = num > 0 ? parseInt(reset, 10) : 0 - parseInt(reset, 10)

  if (MAX < result || MIN > result) { // 边界处理
    return 0
  }

  return result
}

console.log(reverse(987654321))
