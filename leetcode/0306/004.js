// 给你一个 m * n  的网格图 grid。grid 中每个格子都有一个数字，对应着从该格子出发下一步走的方向。grid[i][j] 中的数字可能有以下几种情况：
// 1、下一步往右走，也就是你会从 grid[i][j] 走到 grid[i][j + 1]。
// 2、下一步往左走，也就是你会从 grid[i][j] 走到 grid[i][j - 1]。
// 3、下一步往下走，也就是你会从 grid[i][j] 走到 grid[i + 1][j]。
// 4、下一步往上走，也就是你会从 grid[i][j] 走到 grid[i - 1][j]。
// 注意网格图中可能会有无效数字，因为它们可能指向 grid 之外的区域。
// 一开始，你会从最最左上角的格子 (0,0) 出发。我们定义一条有效路径为从格子（0，0）出发，每一步都顺着数字对应方向走，最终在右下角的格子（m - 1, n - 1）结束的路径。有效路径不需要是最短路径。
// 你可以花费 cost = 1 的代价修改一个格子中的数字，但每个格子中的数字只能修改一次。
// 请你返回让网格图至少有一条有效路径的最小代价。

const changeDistance = [
  [0, 1], // 向右
  [0, -1], // 向左
  [1, 0], // 向上
  [-1, 0] // 向下
]

const miniCost = grid => {
  const m = grid.length // 行数
  const n = grid[0].length // 列数
  const queue = [[0, 0, 0]]
  // 记录是否经过这个点
  const visited = new Set()
  while (queue.length) {
    const first = queue.shift()
    const [ cost, x, y ] = first
    if (visited.has(`${x}-${y}`)) {
      continue
    }
    visited.add(`${x}-${y}`)

    if (x === m - 1 && y === n - 1) {
      return cost
    }

    // 尝试四个方向
    for (let i = 0; i < 4; i++) {
      const x1 = x + changeDistance[i][1]
      const y1 = y + changeDistance[i][0]
      if (x1 < 0 || y1 < 0 || x1 >= m || y1 >= n) { // 超出范围
        continue
      }
      if (grid[x][y] === i + 1) { // 不需要修改
        queue.unshift([cost, x1, y1])
      } else { // 需要修改
        queue.push([cost + 1, x1, y1])
      } // 这样不需要修改的情况会在前面，需要修改的情况也会保留
    }
  }
  return 0
}

// JavaScript 数组的 unshift 和 shift 操作的成本是非常高的
// 单链表模拟
function Node (value) {
  this.value = value
  this.next = null
}

// 双端队列
function Deque (value) {
  const initNode = new Node(value)
  this.head = initNode
  this.rail = initNode
  this.length = 1
}

// 删除头部
Deque.prototype.pop = function () {
  const head = this.head
  if (this.length === 1) { // 只有一个元素的时候尾部也要删除引用
    this.tail = null
  }
  this.head = this.head.next
  this.length -= 1
  return head
}

// 首部插入
Deque.prototype.unshift = function (value) {
  const newNode = new Node(value)
  if (!this.length) { // 空队列
    this.head = newNode
    this.tail = newNode
  } else {
    newNode.next = this.head.next
    this.head = newNode
  }
  this.length++
}

// 尾部插入
Deque.prototype.push = function (value) {
  const newNode = new Node(value)
  if (!this.length) {
    this.head = newNode
    this.tail = newNode
  } else {
    this.tail.next = newNode
    this.tail = newNode
  }
  this.length++
}

const miniCostByDeque = grid => {
  const m = grid.length
  const n = grid[0].length
  const queue = new Deque([0, 0, 0])

  const visited = new Set()

  while (queue.length) {
    const first = queue.pop().value
    const [ cost, x, y ] = first
    if (visited.has(`${x}-${y}`)) {
      continue
    }
    visited.add(`${x}-${y}`)
    if (x === m - 1 && y === n - 1) {
      return cost
    }
    for (let i = 0; i < 4; i++) {
      const nx = x + changeDistance[i][1]
      const ny = y + changeDistance[i][0]
      if (nx < 0 || ny < 0 || nx >= m || ny >= n) {
        continue
      }
      if (grid[x][y] === i + 1) {
        queue.unshift(cost, nx, ny)
      } else {
        queue.push(cost + 1, nx, ny)
      }
    }
  }
}
