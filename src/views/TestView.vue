<script setup>

import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const location_map = ref(null)
let option;

onMounted(async () => {

  const response = await fetch('port3000/api/users');
  const data = await response.json();
  console.log(data);

  const myChart = echarts.init(location_map.value)
  fetch('google10/msi-common/pic/pic2.svg')
    .then(response => response.text())
    .then(svg => {
      echarts.registerMap('LocationMap', { svg: svg })
      option = {
        tooltip: {},
        visualMap: {
          left: 'center',
          bottom: '10%',
          min: 5,
          max: 100,
          orient: 'horizontal',
          text: ['', 'Price'],
          realtime: true,
          calculable: true,
          inRange: {
            color: ['#dbac00', '#db6e00', '#cf0000']
          }
        },
        series: [
          {
            name: 'French Beef Cuts',
            type: 'map',
            map: 'LocationMap',
            roam: true,
            emphasis: {
              label: {
                show: false
              }
            },
            selectedMode: false,
            data: [
              { name: 'Queue', value: 15 },
              { name: 'Langue', value: 35 },
            ]
          }
        ]
      };
      myChart.setOption(option);
    });
})

</script>

<template>
  <div class='demo-app'>
    <div>
      <div id="main" style="width: 600px; height: 400px;" ref="location_map"></div>
    </div>
  </div>
</template>

