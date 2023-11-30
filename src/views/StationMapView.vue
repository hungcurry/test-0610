<script setup>
import { onMounted, ref, reactive ,onUnmounted} from 'vue'
import * as echarts from 'echarts'
import { useRoute } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
const MsiApi = ApiFunc()
const route = useRoute()
const location_map = ref(null)
const station_id = route.query.id
let test = ''
let get_complete = false
const option = reactive({
        color:'#001100',
        tooltip: {
          triggerOn: 'click',
          
          formatter:(params,ticket,callback) =>{
            console.log(params)
            MsiApi.checkToken().then((res)=> {
              console.log(res)
              // test = res.data.message

              
              test = 'Location : ' + params.data.name + '<br>' +
                   'EVSE ID  : '+ params.data.evse_id + '<br>' +
                   'Start Time  : '+ params.data.evse_id + '<br>' +
                   'kWh  : '+ params.data.evse_id + '<br>'  +
                   'Price  : '+ params.data.evse_id + '<br>' +
                   'License Plate  : '+ params.data.evse_id + '<br>' 


            })
            
              setTimeout(() => {
  console.log('After 1000 milliseconds (1 second)');
  return test
}, 1000);
              
            
            console.log(222)
          }


            // formatter: async function (params, ticket, callback) {
            // await MsiApi.mongoAggregate(queryData1)('detail?name=' + params.name, function (content) {
            //   callback(ticket, toHTML(content));
            // })
            // return 'Loading';
            // }




            
            // return 'Location : ' + params.data.name + '<br>' +
            //        'EVSE ID  : '+ params.data.evse_id + '<br>' +
            //        'Start Time  : '+ params.data.evse_id + '<br>' +
            //        'kWh  : '+ params.data.evse_id + '<br>'  +
            //        'Price  : '+ params.data.evse_id + '<br>' +
            //        'License Plate  : '+ params.data.evse_id + '<br>' 
        },
        series: [
          {
            name: 'MSIS',
            type: 'map',
            map: 'LocationMap',
            roam: false,
            emphasis: { label: {show: false} },
            selectedMode: false,
            data: [
              { name: 'A1', itemStyle: { areaColor: '' } },
              { name: 'A2', itemStyle: { areaColor: '' }},
              { name: 'A3', itemStyle: { areaColor: '' }},
              { name: 'A4', itemStyle: { areaColor: '' }},
              { name: 'A5', itemStyle: { areaColor: '' }},
            ],
            
          }
          
        ],

      })
let interval 
const getStationInfo = () => {

}
onMounted(async () => {

  const myChart = echarts.init(location_map.value)
  option.series[0].data[0].value = 55

  let queryData1 = { "database":"OCPI", "collection":"Location", "pipelines": [ 
      { $match:  { "id": { "UUID" : station_id} } },
      { "$lookup": {"from":'EVSE', "localField": "evses", "foreignField": "_id", "as":"EVSES"}},
      { "$lookup": {"from":'Connector', "localField": "EVSES.connectors", "foreignField": "_id", "as":"Connector"}},
      { "$project": { 
                      "country_code": 0, "directions": 0, "party_id": 0, "last_updated": 0, "evses": 0,
                      "Connector.id": 0, "Connector.format": 0, "Connector.last_updated": 0, "Connector.max_amperage": 0,
                      "Connector.max_electric_power":0, "Connector.max_voltage":0, "Connector.power_type":0, "Connector.tariff_ids":0,
                      "address":0, "charging_when_closed":0, "time_zone": 0, "coordinates": 0, "publish" :0, "byCompany": 0, 
                    }
      }
    ]}
  let res = await MsiApi.mongoAggregate(queryData1)
  console.log(res.data.result[0].EVSES[0].evse_id)
  for (let i = 0; i < res.data.result[0].EVSES.length; i++) {
  
    option.series[0].data[i].evse_id = res.data.result[0].EVSES[i].evse_id
    // console.log(res.data.result[0].EVSES[i].status)
    if (res.data.result[0].EVSES[i].status === 'AVAILABLE') {
      option.series[0].data[i].itemStyle.areaColor = '#76bbf4'
    }
    else if (res.data.result[0].EVSES[i].status === 'CHARGING') {
      option.series[0].data[i].itemStyle.areaColor = '#94eadb'
    }
    else if (res.data.result[0].EVSES[i].status === 'OUTOFORDER') {
      option.series[0].data[i].itemStyle.areaColor = '#ef8879'
    }
    else if (res.data.result[0].EVSES[i].status === 'UNKNOWN') {
      option.series[0].data[i].itemStyle.areaColor = '#bcbcbc'
    }

    // let queryData = { "database": 'CPO', "collection": 'ChargePointInfo', 
    //   "pipelines": [{ $match: { "evse_id": res.data.result[0].EVSES[i].evse_id } },  
    //   { $project: { ocpp_info: 1, sessions:1} }]
    // }
    //   response = await MsiApi.mongoAggregate(queryData)

  }
  
  fetch("src/assets/svg/msi_station.svg")
    .then(response => response.text())
    .then(svg => {
      echarts.registerMap('LocationMap', { svg: svg })
      myChart.setOption(option);
    })
    interval = setInterval(getStationInfo, 5000) 
})

onUnmounted(async () => {
  clearInterval(interval) 

})

</script>

<template>
  <div class='station-map'>
    <div>
      <div id="main" style="width: 800px; height: 400px;" ref="location_map"></div>
    </div>
  </div>
</template>

