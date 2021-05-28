JQuery 实现重新渲染采用最简单粗暴的办法就是重新构建DOM替换旧DOM，问题也很明显：

- 性能消耗高
- 无法保存状态(聚焦,滚动等)

## Virtual DOM

实际也是操作Dom树进行渲染更新,但是它只是针对修改部分进行局部渲染,将影响降到最低,虽然实现方式各有不同,但是大体步骤如下:

1. 用Javascript对象结构描述Dom树结构,然后用它来构建真正的Dom树插入文档
2. 当状态发生改变之后,重新构造新的Javascript对象结构和旧的作对比得出差异
3. 针对差异之处进行重新构建更新视图

无非就是利用Js做**一层映射比较**，操作简单并且速度远远高于直接比较Dom树

## 基础工具函数

```js
function type(obj) {
  return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, "");
}

function isArray(list) {
  return type(list) === "Array";
}

function isObject(obj) {
  return type(obj) === "Object";
}

function isString(str) {
  return type(str) === "String";
}

function isNotEmptyObj(obj) {
  return isObject(obj) && JSON.stringify(obj) != "{}";
}

function objForEach(obj, fn) {
  isNotEmptyObj(obj) && Object.keys(obj).forEach(fn);
}

function aryForEach(ary, fn) {
  ary.length && ary.forEach(fn);
}

function setAttr(node, key, value) {
  switch (key) {
    case "style":
      node.style.cssText = value;
      break;
    case "value":
      var tagName = node.tagName || "";
      tagName = tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        node.value = value;
      } else {
        // if it is not a input or textarea, use `setAttribute` to set
        node.setAttribute(key, value);
      }
      break;
    default:
      node.setAttribute(key, value);
      break;
  }
}

function toArray(data) {
  if (!data) {
    return [];
  }
  const ary = [];
  aryForEach(data, item => {
    ary.push(item);
  });

  return ary;
}

export {
  isArray,
  isObject,
  isString,
  isNotEmptyObj,
  objForEach,
  aryForEach,
  setAttr,
  toArray
};
```

## Javascript对象结构描述

```js
import {
  isObject,
  isString,
  isArray,
  isNotEmptyObj,
  objForEach,
  aryForEach
} from "./util";
import { NOKEY } from "./common";

class Element {
  constructor(tagName, props, children) {
    // 解析参数
    this.tagName = tagName;
    // 字段处理,可省略参数
    this.props = isObject(props) ? props : {};
    this.children =
      children ||
      (!isNotEmptyObj(this.props) &&
        ((isString(props) && [props]) || (isArray(props) && props))) ||
      [];
    // 无论void后的表达式是什么，void操作符都会返回undefined
    this.key = props ? props.key : void NOKEY;

    // 计算节点数
    let count = 0;
    aryForEach(this.children, (item, index) => {
      if (item instanceof Element) {
        count += item.count;
      } else {
        this.children[index] = "" + item;
      }
      count++;
    });
    this.count = count;
  }

  render() {
    // 根据tagName构建
    const dom = document.createElement(this.tagName);

    // 设置props
    objForEach(this.props, propName =>
      dom.setAttribute(propName, this.props[propName])
    );

    // 渲染children
    aryForEach(this.children, child => {
      const childDom =
        child instanceof Element
          ? child.render() // 如果子节点也是虚拟DOM，递归构建DOM节点
          : document.createTextNode(child); // 如果字符串，只构建文本节点
      dom.appendChild(childDom);
    });
    return dom;
  }
}

// 改变传参方式,免去手动实例化
export default function CreateElement(tagName, props, children) {
  return new Element( tagName, props, children );
}
```

## diff算法

#### tree diff

传统 diff 算法的复杂度为 O(n^3)，但是一般Dom跨层级的情况是非常少见的。所以React **只针对同层级Dom节点做比较**，将 O(n^3) 复杂度的问题转换成 O(n) 复杂度的问题。

比较大的问题就是**当节点跨层级移动并不会进行移动而是直接替换整个节点**，所以切记这点性能问题

#### component diff

- 某个组件发生变化,会导致自其从上往下整体替换
- 同一类型组件会进行Virtual DOM进行比较
- React提供了一个`shouldComponentUpdate`决定是否更新

尽可能将动态组件往底层节点迁移,有利于提高性能

### element diff

元素操作无非就是几种，我们定义几个类型做状态标记

```js
const REPLACE = "replace";
const REORDER = "reorder"; // 重新排布
const PROPS = "props";
const TEXT = "text";
const NOKEY = "no_key"

export {
  REPLACE,
  REORDER,
  PROPS,
  TEXT,
  NOKEY
}
```

`NOKEY`就是专门给那些没有定义key的组件做默认，**React对同一层级的同组子节点，添加唯一 key 进行区分进行位移而不是直接替换**，这点对于整体性能尤为关键

```js
import { isString, objForEach, aryForEach, isNotEmptyObj } from "./util";
import { REPLACE, REORDER, PROPS, TEXT } from "./common";
import listDiff from "list-diff2";

/**
 *
 * @param {旧Dom树} oTree
 * @param {新Dom树} nTree
 * 返回差异记录
 */
function diff(oTree, nTree) {
  // 节点位置
  let index = 0;
  // 差异记录
  const patches = {};
  dfsWalk(oTree, nTree, index, patches);
  return patches;
}

function dfsWalk(oNode, nNode, index, patches) {
  const currentPatch = [];

  // 首次渲染
  if (nNode === null) return;

  // 都是字符串形式并且不相同直接替换文字
  if (isString(oNode) && isString(nNode)) {
    oNode !== nNode &&
      currentPatch.push({
        type: TEXT,
        content: nNode
      });
    // 同种标签并且key相同
  } else if (oNode.tagName === nNode.tagName && oNode.key === nNode.key) {
    // 至少一方有值
    if (isNotEmptyObj(oNode.props) || isNotEmptyObj(nNode.props)) {
      // 计算props结果
      const propsPatches = diffProps(oNode, nNode);
      // 有差异则重新排序
      propsPatches &&
        currentPatch.push({
          type: PROPS,
          props: propsPatches
        });
    }
    // children对比
    if (
      !(!isNotEmptyObj(nNode.props) && nNode.props.hasOwnProperty("ignore"))
    ) {
      (oNode.children.length || nNode.children.length) &&
        diffChildren(
          oNode.children,
          nNode.children,
          index,
          patches,
          currentPatch
        );
    }
  } else {
    // 都不符合上面情况就直接替换
    currentPatch.push({ type: REPLACE, node: nNode });
  }

  // 最终对比结果
  currentPatch.length && (patches[index] = currentPatch);
}
```

新旧节点的props属性比较

```js
/**
 *
 * @param {旧节点} oNode
 * @param {新节点} nNode
 */
function diffProps(oNode, nNode) {
  let isChange = false;
  const oProps = oNode.props;
  const nProps = nNode.props;
  // 节点属性记录
  const propsPatched = {};

  // 替换/新增属性
  // 遍历旧节点列表对比将改变的属性添加到 propsPatched 返回
  // 这里的代码只对比 nProps 里的属性
  // 无法得知需要删除的属性是哪些，具体更新props的时候再处理。
  objForEach(nProps, key => {
    if (nProps[key] !== oProps[key] || !oProps.hasOwnProperty(key)) {
      !isChange && (isChange = true);
      propsPatched[key] = nProps[key];
    }
  });

  return !isChange ? null : propsPatched;
}
```

新旧节点的子元素对比

```js
/**
 *  同级对比
 * @param {*} oChildren
 * @param {*} nChildren
 * @param {*} index
 * @param {*} patches
 * @param {*} currentPatch
 */
function diffChildren(oChildren, nChildren, index, patches, currentPatch) {
  // 得出相对简化移动路径
  // 其中的listDiff来自于list-diff，能通过关键属性获得最小移动量，其中moves属性就是给第三步更新视图做铺垫指示
  const diffs = listDiff(oChildren, nChildren, "key");

  // 保留元素
  nChildren = diffs.children;

  // 记录排序位移
  diffs.moves.length &&
    currentPatch.push({ type: REORDER, moves: diffs.moves });

  // 深度优先遍历
  let leftNode = null;
  let currentNodeIndex = index;
  aryForEach(oChildren, (_item, _index) => {
    const nChild = nChildren[_index];
    // children以数组形式存放树
    currentNodeIndex =
      leftNode && leftNode.count
        ? currentNodeIndex + leftNode.count + 1
        : currentNodeIndex + 1;
    // 递归调用 dfsWalk
    _item !== nChild && dfsWalk(_item, nChild, currentNodeIndex, patches);
    leftNode = _item;
  });
}
```

## 更新视图

```js
import {
  isString,
  isObject,
  objForEach,
  aryForEach,
  setAttr,
  toArray
} from "./util";
import { REPLACE, REORDER, PROPS, TEXT, NOKEY } from "./common";

function patch(node, patches) {
  const walker = { index: 0 };
  dfsWalk(node, walker, patches);
}

// 深度遍历更新
function dfsWalk(node, walker, patches) {
  const currentPatches = patches[walker.index];

  node.childNodes &&
    aryForEach(node.childNodes, item => {
      walker.index++;
      dfsWalk(item, walker, patches);
    });

  currentPatches && applyPatches(node, currentPatches);
}
```

针对不同标志做对应处理（调用不同的方法处理）

```js
// 更新类型
function applyPatches(node, currentPatches) {
  aryForEach(currentPatches, item => {
    switch (item.type) {
      case REPLACE:
        const nNode = isString(item.node)
          ? document.createTextNode(item.node)
          : item.node.render();
        node.parentNode.replaceChild(nNode, node);
        break;
      case REORDER:
        reorderChildren(node, item.moves);
        break;
      case PROPS:
        setProps(node, item.props);
        break;
      case TEXT:
        if (node.textContent) {
          // 使用纯文本
          node.textContent = item.content;
        } else {
          // 仅仅对CDATA片段，注释comment，Processing Instruction节点或text节点有效
          node.nodeValue = item.content;
        }
        break;
      default:
        throw new Error("Unknown patch type " + item.type);
    }
  });
}
```

先说简单的属性替换

```js
// 修改属性
function setProps(node, props) {
  objForEach(props, key => {
    setAttr(node, key, props[key]);
  });
  // 移除不需要的旧属性
  objForEach(node.props, key => {
    if (props[key] === void NOKEY) {
      // 假如没有对应的属性，直接删除node上面对应key的属性
      node.removeAttribute(key);
    }
  });
}
```

列表渲染

```js
// 列表排序渲染
function reorderChildren(node, moves) {
  const staticNodeList = toArray(node.childNodes);
  const maps = {};

  aryForEach(staticNodeList, node => {
    // Element
    if (node.nodeType === 1) {
      const key = node.getAttribute("key");
      key && (maps[key] = node);
    }
  });

  aryForEach(moves, move => {
    const index = move.index;
    // 0:删除 1:替换
    if (move.type === 0) {
      // 找到对应节点删除
      staticNodeList[index] === node.childNodes[index] &&
        node.removeChild(node.childNodes[index]);
      staticNodeList.splice(index, 1);
    } else if (move.type === 1) {
      let insertNode;
      if (maps[move.item.key]) {
        // 删除并返回节点
        insertNode = node.removeChild(maps[move.item.key]);
        // 获取删除节点位置
        staticNodeList.splice(Array.prototype.indexOf.call(node.childNodes, maps[move.item.key]), 1);
      } else {
        // 创建节点
        insertNode = isObject(move.item)
          ? move.item.render()
          : document.createTextNode(move.item);
      }
      // 同步staticNodeList信息
      staticNodeList.splice(index, 0, insertNode);
      // 操作Dom
      node.insertBefore(insertNode, node.childNodes[index] || null);
    }
  });
}

export default patch;
```

