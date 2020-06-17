import reverse from '../src/str/reverse'
import betterReverse from '../src/str/betterReverse'

describe('字符串翻转：', () => {
  // 使用it而不是test，test只会显示第一个测试的运行时间
  it('-13579 翻转成 -97531 欧几得', () => {
    expect(betterReverse(-13579)).toBe(-97531)
  })

  it('-13579 翻转成 -97531', () => {
    expect(reverse(-13579)).toBe(-97531)
  })
})
