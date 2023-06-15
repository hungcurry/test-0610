<template>
  <div class="log">
    <p class="total-count"> {{ 'Total Count : ' + OcpiSessionData.length  }}</p>
    <div class="date-picker">
      <el-date-picker v-model="select_time" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" :default-time="defaultTime" @change="select_date"/>
    </div>
    <el-button class="download" @click="download"> Download </el-button>

    <div class="log-list">
      <el-table :data="OcpiSessionData" style="width: 95%; height:95%" stripe  :cell-style=msi.tb_cell  :header-cell-style=msi.tb_header_cell size="large" v-loading = "isLoading">
        <el-table-column v-for="item in OcpiSessionTable" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable">
          </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/components/ApiFunc'
import  {export_json_to_excel}  from '@/components/Export2Excel'
import msi from '@/assets/msi_style'

import { useMStore } from "../stores/m_cloud";
import moment from "moment"
const MStore = useMStore()
const MsiApi = ApiFunc()
const OcpiSessionData = reactive([])
const now = new Date()
const isLoading = ref(false)
const OcpiSessionTable = [
  {label:'Status', value:'status', width:'60'}, 
  {label:'Station', value:'location_str', width:'80'}, 
  {label:'EVSE ID', value:'evse_str', width:'80'}, 
  {label:'kWh', value:'kwh', width:'80'}, 
  {label:'Pirce', value:'price_str', width:'80'}, 
  {label:'Start Time', value:'start_date_local_time', width:'80'}, 
  {label:'End Time', value:'end_date_local_time', width:'80'}, 
]

const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]

const download = () => {
  const tHeader = ['Status','Station','EVSE ID', 'kWh', 'Pirce', 'Start Time', 'End Time']
  const filterVal = ['status','location_str','evse_str', 'kwh', 'price_str', 'start_date_local_time', 'end_date_local_time']
  const data = OcpiSessionData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'Charge Session' })
}


const select_date = async () => {

  let queryData = { "database":"OCPI", "collection":"Session", "pipelines": [ 
    {
      "$match": {
        "$expr":{ "$and" : [ { "$gte" : [ "$start_date_time", { "$dateFromString": {"dateString":select_time.value[0]}}]},
                              { "$lte" : [ "$start_date_time", { "$dateFromString": {"dateString": select_time.value[1]}}] }
                            ]}
      }
    },
    { "$lookup": {"from":'Location', "localField": "location_id", "foreignField": "id", "as":"Location"}},
    { "$lookup": {"from":'EVSE', "localField": "evse_uid", "foreignField": "uid", "as":"EVSE"}},
    { "$project": { "status": 1,"total_cost": 1, "start_date_time": 1, "kwh": 1, "end_date_time": 1,"country_code":1,"currency":1,"Location.name":1, "EVSE.evse_id":1} },
  ]
  }
  isLoading.value = true
  let res = await MsiApi.mongoAggregate(queryData)
  OcpiSessionData.length = 0
  Object.assign(OcpiSessionData, res.data.result)
  
  for (let i = 0; i < OcpiSessionData.length; i++) {
    OcpiSessionData[i].price_str = OcpiSessionData[i]?.total_cost?.incl_vat
    OcpiSessionData[i].location_str = OcpiSessionData[i]?.Location[0]?.name
    OcpiSessionData[i].evse_str = OcpiSessionData?.[i]?.EVSE?.[0]?.evse_id

    let localStartTime =  new Date( (new Date(OcpiSessionData[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionData[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(OcpiSessionData[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionData[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }
  isLoading.value = false
}

onMounted( async() => {
  
  let queryData = { "database":"OCPI", "collection":"Session", "pipelines": [ 
    {
      "$match": {
        "$expr":{ "$and" : [ { "$gte" : [ "$start_date_time", { "$dateFromString": {"dateString": new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)}}]}]}
      }
    },
    { "$lookup": {"from":'Location', "localField": "location_id", "foreignField": "id", "as":"Location"}},
    { "$lookup": {"from":'EVSE', "localField": "evse_uid", "foreignField": "uid", "as":"EVSE"}},
    { "$project": { "status": 1,"total_cost": 1, "start_date_time": 1, "kwh": 1, "end_date_time": 1,"country_code":1,"currency":1,"Location.name":1, "EVSE.evse_id":1} },
  ]
  }
  isLoading.value = true
  let res = await MsiApi.mongoAggregate(queryData) 
  OcpiSessionData.length = 0
  Object.assign(OcpiSessionData, res.data.result)
  for (let i = 0; i < OcpiSessionData.length; i++) {
    OcpiSessionData[i].price_str = OcpiSessionData[i]?.total_cost?.incl_vat
    OcpiSessionData[i].location_str = OcpiSessionData[i]?.Location?.[0]?.name
    OcpiSessionData[i].evse_str = OcpiSessionData[i]?.EVSE?.[0]?.evse_id

    let localStartTime =  new Date( (new Date(OcpiSessionData[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionData[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(OcpiSessionData[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionData[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }
  isLoading.value = false
})

</script>

<style lang="scss">
.log {
  position: relative;
  width: 100%;
  height: 100%;
  .log-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left : 40px;
    position: absolute;
  }
  .charger-btn {
    top: 40px;
    left: 40px;
    position: absolute;
  }
  .database-btn {
    top: 40px;
    left: 160px;
    position: absolute;
  }

  .date-picker {
      top: 40px;
      right : 300px;
      position: absolute;
  }

  .download {
    width: 220px;
    height: 40px;
    top: 40px;
    right : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }

  .total-count {
    top: 40px;
    left : 40px;
    position: absolute;
  }
}

</style>