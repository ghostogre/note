// 给你一个数组 nums，对于其中一个元素 nums[i]，请你统计数组中比它小的所有数字的数目。
// 换而言之m，对于每一个 nums[i] 你必须计算出有效的 j 的数量，其中 j 满足 j != i 且 nums[j] < nums[i]。
// 以数组的形式返回答案。
const getSmallCount = (nums) => {
  const len = nums.length
  if (len > 0) {
    const arr = []
    for (let i = 0; i < len; i++) {
      let sum = 0
      for (let j = 0; j < len; j++) {
        if (nums[j] < nums[i]) {
          sum++
        }
      }
      arr.push(sum)
    }
    return arr
  } else {
    return []
  }
}

console.log(getSmallCount([1, 1, 4, 3, 2, 4, 7, 7, 0, 9]))
