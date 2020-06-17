// 异位字符串相等，使用字符串的api
export default function (a, b) {
  const arr1 = a.split('')
  const arr2 = b.split('')
  const sortFn = (a, b) => (a.charCodeAt() - b.charCodeAt())
  arr1.sort(sortFn)
  arr2.sort(sortFn)
  return arr1.join('') === arr2.join('')
}
