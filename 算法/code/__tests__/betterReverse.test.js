import betterReverse from '../src/str/betterReverse'

test('-13579 翻转成 -97531 欧几得', () => {
  expect(betterReverse(-13579)).toBe(-97531)
})
