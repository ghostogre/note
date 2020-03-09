// 给你一颗 root 为根的二叉树和一个 head 为第一个节点的链表。
// 如果在二叉树中，存在一条一直向下的路径，且每个点的数值恰好一一对应以 head 为首的链表中每个节点的值，那么请你返回 True，否则返回 False。
// 一直向下的路径的意思是：从树中某个节点开始，一直连续向下的路径。

// 获得二叉树每个子树的根
const getTreeRecord = (root, record) => {
  if (!root) {
    return false
  }
  record.push(root)
  if (root.left) {
    getTreeRecord(root.left, record)
  }
  if (root.right) {
    getTreeRecord(root.right, record)
  }
}

const comparePath = (head, root) => {
  let trees = []
  getTreeRecord(root, trees)
  while (head) {
    const current = []
    for (const tree of trees) {
      if (tree && head.val === tree.val) {
        current.push(tree.left)
        current.push(tree.right)
      }
    }
    if (current.length === 0) {
      return false
    }
    trees = current
    head = head.next
  }
  return
}
