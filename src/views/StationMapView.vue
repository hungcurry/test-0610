<script setup>
import { onMounted, ref, reactive ,onUnmounted} from 'vue'
import * as echarts from 'echarts'
import { useRoute } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { useMStore } from '@/stores/m_cloud'
import moment from "moment"
const MStore = useMStore()
const MsiApi = ApiFunc()
const route = useRoute()
const location_map = ref(null)
const station_id = route.query.id

const testFunc = async(params) => {
  console.log(params.data)
    let queryData = { "database": 'CPO', "collection": 'ChargePointInfo', 
      "pipelines": [{ $match: { "evse_id": {$eq:params.data.evse_id }} },  
      { $project: { ocpp_info: 1, sessions:1} }]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    console.log(response)
    let idtag = response?.data?.result?.[0]?.ocpp_info[0]?.idTag
    queryData = { "database": 'OCPI', "collection": 'Session', 
      "pipelines": [
      { $match:  { "_id": {"ObjectId": response?.data?.result?.[0]?.sessions?.[0] } }},  
      { $project: { 111: 0} }]
    }
    response = await MsiApi.mongoAggregate(queryData)   
    let start_time = response?.data?.result?.[0]?.start_date_time
    let kwh = response?.data?.result[0]?.kwh
    let cost = response?.data?.result?.[0]?.total_cost?.incl_vat
    let start_time_str = new Date(new Date(start_time).getTime() + MStore.timeZoneOffset * -60000)
    start_time_str = moment(start_time_str).format('YYYY-MM-DD HH:mm:ss'),
    queryData = { 
      "database": 'CPO', "collection": 'RFIDUserData', "pipelines": [
        {
          $unwind: "$rfids"
        },
        { 
          $match: { 
            $and: [
              { "rfids.rfid": idtag?.toUpperCase() },
            ]
          },
        },
        {
          $project: {tag_id: 1} 
        }
      ]
    },
    response = await MsiApi.mongoAggregate(queryData)
    let tag_id = response?.data?.result[0]?.tag_id
    let txt = 'Location : ' + params.data.name + '<br>' +
              'EVSE ID : ' + params.data.evse_id + '<br>' + 
              'Start Time : '+ start_time_str + '<br>' +
              'kWh : '+ kwh + '<br>' +
              'Cost : '+ cost + '<br>' +
              'Tag ID : ' + tag_id 
              // 'License Plate  : '+ params.data.evse_id + '<br>' +
    return txt
}

const option = reactive({
        color:'#001100',
        tooltip: {
          triggerOn: 'click',
          formatter:  (params,ticket,callback) => {
            setTimeout( async  () => {
              callback(ticket, await testFunc(params))
            }, 0)
            return 'loading';
        }
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
              { name: 'A1', itemStyle: { areaColor: '#000000' }},
              { name: 'A2', itemStyle: { areaColor: '#000000' }},
              { name: 'A3', itemStyle: { areaColor: '#000000' }},
              { name: 'A4', itemStyle: { areaColor: '#000000' }},
              { name: 'A5', itemStyle: { areaColor: '#000000' }},
              { name: 'A6', itemStyle: { areaColor: '#000000' }},
              { name: 'A7', itemStyle: { areaColor: '#000000' }},
              { name: 'A8', itemStyle: { areaColor: '#000000' }},
              { name: 'A9', itemStyle: { areaColor: '#000000' }},
              { name: 'A10', itemStyle: { areaColor: '#000000' }},
              { name: 'A11', itemStyle: { areaColor: '#000000' }},
              { name: 'A12', itemStyle: { areaColor: '#000000' }},
              { name: 'A13', itemStyle: { areaColor: '#000000' }},
              { name: 'A14', itemStyle: { areaColor: '#000000' }},
              { name: 'A15', itemStyle: { areaColor: '#000000' }},
            ],
          }
        ],
      })
let interval 

onMounted(async () => {
  const myChart = echarts.init(location_map.value)
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
  let evse_arr = res.data.result[0].EVSES
  evse_arr.sort(function(a, b) {
    return a.evse_id.localeCompare(b.evse_id);
  })
  for (let i = 0; i < res.data.result[0].EVSES.length; i++) {
    option.series[0].data[i].evse_id = res.data.result[0].EVSES[i].evse_id
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
  }
  fetch("msi_station.svg")
    .then(response => response.text())
    .then(svg => {
      echarts.registerMap('LocationMap', { svg: svg })
      myChart.setOption(option);
    })
})

onUnmounted(async () => {
  clearInterval(interval) 

})

</script>

<template>
  <div class='station-map'>
    <div>
      <div id="main" style="width: 1600px; height: 800px;" ref="location_map"></div>
    </div>
  </div>
</template>

