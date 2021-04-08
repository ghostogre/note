## 使div水平垂直居中

### flex 布局实现 （元素已知宽度）

```html
CSS 代码:
<style>        
    .box{            
        width: 300px;            
        height: 300px;           
        background-color: #ccc;            
        display: flex;            
        display: -webkit-flex;            
        justify-content: center;            
        align-items: center;        
    }        
    .box .a{            
        width: 100px;            
        height: 100px;            
        background-color: blue;        
    }    
</style>
HTML 代码：
<div class="box">        
    <div class="a"></div>    
</div>
```

### position （元素已知宽度）

父元素设置为：position: relative;

子元素设置为：position: absolute;

距上50%，据左50%，然后减去元素自身宽度的一半距离就可以实现

### position transform （元素未知宽度）

如果元素未知宽度，和上一条一样把减去元素自身宽度的一半距离替换成：**`transform: translate(-50%,-50%);`**

### position（元素已知宽度）（left，right，top，bottom为0，maigin：auto ）

```html
CSS 代码：
<style>        
    .box{            
        width: 300px;            
        height: 300px;           
        background-color: red;            
        position: relative;        
    }        
    .box .a{            
        width: 100px;            
        height: 100px;            
        background-color: blue;            
        position: absolute;            
        top: 0;            
        bottom: 0;            
        left: 0;            
        right: 0;            
        margin: auto;        
    }    
</style>
HTML 代码：
 <div class="box">        
    <div class="a">love</div>    
</div>
```

如果子元素不设置宽度和高度，将会铺满整个父级（应用：模态框）

### table-cell 布局实现

table 实现垂直居中，子集元素可以是块元素，也可以不是块元素

```html
<style>        
    .box{            
        width: 300px;            
        height: 300px;            
        background-color: red;            
        display: table-cell;            
        vertical-align: middle;                    
    }        
    .box .a{            
        margin-left: 100px;            
        width: 100px;            
        height: 100px;            
        background-color: blue;        
    }    
</style>

<div class="box">         
    <div class="a">love</div>    
</div>
```

`display：table-cell `会使元素表现的类似一个表格中的单元格td，利用这个特性可以实现文字的垂直居中效果。同时它也会破坏一些 CSS 属性，使用 table-cell 时最好不要与 float 以及 position: absolute 一起使用，设置了 table-cell 的元素对高度和宽度高度敏感，对margin值无反应，可以响 padding 的设置，表现几乎类似一个 td 元素。

