import isAnagram from '../src/str/isAnagram'

describe('异位字符串：', () => {
  it('sort 方法', () => {
    expect(isAnagram('anagram', 'nagaram')).toBe(true)
  })
})