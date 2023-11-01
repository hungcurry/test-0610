<script setup>

import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import ApiFunc from '@/composables/ApiFunc'

const MsiApi = ApiFunc()
const location_map = ref(null)
let option;

const get_edoc = async() => {
  let sendData = {filename: 'new_file'}   // filename: ''
  let res = await MsiApi.get_edoc(sendData)
  if (res.status === 200) {
    var fileURL = window.URL.createObjectURL(new Blob([res.data]))
    var fileLink = document.createElement('a')
    
    fileLink.href = fileURL
    fileLink.setAttribute('download', 'new_file.csv')
    document.body.appendChild(fileLink)
    fileLink.click()

    // await patch_edoc()
  }
  else {
    console.log("File Not Found !")
  }
}
const patch_edoc = async() => {
  console.log(await MsiApi.patch_edoc())
}

onMounted(async () => {
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
    <el-button @click="get_edoc">Download List</el-button>
    <el-button @click="patch_edoc">Update List</el-button>
  </div>
</template>

