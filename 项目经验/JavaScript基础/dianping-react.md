1. `position: absolute`：如果子元素设置了定位，但是没有设置`top`, `left`等，那么仅仅是将其从标准流脱离了。父元素的`margin`和`padding`依然能影响其位置。如果设置了`left top`的值，那就是以static定位以外的其他父元素为定位基准。

