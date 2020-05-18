## echarts.registerMap

注册可用的地图，必须在包括 [geo](https://echarts.apache.org/zh/option.html#geo) 组件或者 [map](https://echarts.apache.org/zh/option.html#series-map) 图表类型的时候才能使用。

`(mapName: string, geoJson: Object, specialAreas?: Object)`

- mapName：地图名称，在geo组件或者map图表里设置map的值就是这个

- gesJson：GeoJson的数据格式

  ```json
  {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [125.6, 10.1]
    },
    "properties": {
      "name": "Dinagat Islands"
    }
  }
  ```

- specialAreas：将地图中的部分区域缩放到合适的位置，可以使得整个地图的显示更加好看。

  ```js
  echarts.registerMap('USA', usaJson, {
    // 把阿拉斯加移到美国主大陆左下方
    Alaska: {
        // 左上角经度
        left: -131,
        // 左上角纬度
        top: 25,
        // 经度横跨的范围
        width: 15
    },
    // 夏威夷
    Hawaii: {
        left: -110,
        top: 28,
        width: 5
    },
    // 波多黎各
    'Puerto Rico': {
        left: -76,
        top: 26,
        width: 2
    }
  });
  ```

对应的还有`getMap(mapName)`。



