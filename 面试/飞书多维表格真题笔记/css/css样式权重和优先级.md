# css样式权重和优先级

**权重记忆口诀**：*从0开始，一个行内样式+1000，一个id选择器+100，一个属性选择器、class或者伪类+10，一个元素选择器，或者伪元素+1，通配符+0。*

## 样式重复多写情况

在css样式表中，同一个CSS样式你写了两次，后面的会覆盖前面的，在开发中基本没用。

## 不同的权重，权重值高则生效

### !important(提升样式优先级)

`!important`的作用是提升样式优先级，如果加了这句的样式的优先级是最高的。**!important最好不要使用。**

当两个样式都使用`!important`时，权重值大的优先级更高

## !important 应用于简写样式

如果!important被用于一个简写的样式属性，那么这条简写的样式属性所代表的子属性都会被作用上!important。

例如`background: blue !important;`，`background-color`等都相当于添加了 `!important`。

> PS：background 这种复合性样式不建议大量使用，如果里面的属性大多数是可以用到的，还是可以写复合性样式的。使用复合写法的时候，它不光只加载了背景颜色样式，还加载了其它一些样式，性能会变差。

## 内联和外联样式优先级

**内联样式和外联样式的优先级和加载顺序有关**

***!important > 行内样式 > 内联样式 and 外联样式***

内联样式：使用 style 标签直接写在 html 里面的。

## 样式应用于非目标标签时

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>样式应用于非目标标签时</title>
		<style>
			div p{color: red};
			#box{color: blue}
		</style>
	</head>
	<body>
		<!-- 选中非目标元素的情况下，离目标越近者优先 -->
		<div id="box">
		  <p>
		    <span>神来之笔</span>
		  </p>
		</div>
	</body>
</html>
```

选中非目标元素的情况下，离目标越近者优先。

## 权重相等的情况下

同等权重下，靠近目标的优先。

