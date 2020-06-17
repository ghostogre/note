export default function (num) {
  if (typeof num !== 'number') {
    return 0
  }
  // 边界值
  const MAX = Number.MAX_SAFE_INTEGER
  const MIN = Number.MIN_SAFE_INTEGER
  // 取正数
  let rset = Math.abs(num)
  let result = 0

  while (rset > 0) {
    result = (rset % 10) + (result * 10)
    rset = Math.floor(rset / 10)
  }

  if (num < 0) {
    result *= -1
  }

  if (MAX < result || MIN > result) {
    // 超出边界
    return 0
  }

  return result
}
