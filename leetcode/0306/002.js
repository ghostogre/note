// 现在有一个特殊的排名系统，依据参赛团队在投票人心中的次序进行排序，每一个投票者都需要按从高到低的顺序对参与排名的所有团队进行排位。
// 排名规则如下：
// 参赛团队的排名次序依照其所获「排位第一」的票的多少决定。如果存在多个团队并列的情况，将继续考虑其「排名第二」的票的数量。以此类推，直到不存在并列的情况。
// 如果在考虑完所有投票情况后仍然出现并列的情况，则根据团队字母的顺序进行排名。
// 给你一个字符串数组 votes 代表全体投票者给出的排位情况，请你根据上述排位规则对所有的参赛团队进行排名。
// 请你返回能表示按排名系统排序后所有参赛团队的排名的字符串。

const rankTeams = votes => {
  const record = new Map()
  for (let i = 0, len = votes.length; i < len; i++) {
    let item = votes[i]
    for (let j = 0, sublen = item.length; j < sublen; j++) {
      let name = item[j]
      if (!record.has(name)) {
        record.set(name, Array(26).fill(0)) // 最多26个队伍
      } else {
        let temp = record.get(name)
        temp[j]++
      }
    }
  }
  const list = Array.from(record.entries) // Map 的遍历顺序就是插入顺序
  list.sort((a, b) => {
    for (let i = 0; i < 26; i++) {
      if (a[1][i] !== b[1][j]) {
        return b[1][i] - a[1][i]
      }
    }
    // javascript字符串在进行大于(小于)比较时，会根据第一个不同的字符的ascii值码进行比较
    return b[0] < b[0]
  })

  return list.map(item => item[0]).join(',')
}
