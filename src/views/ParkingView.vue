<script setup>

import { ref, reactive, onMounted} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from "moment"
import { useMStore } from "../stores/m_cloud";
const MStore = useMStore();
const MsiApi = ApiFunc()
const parkingData = reactive ([])
const all_visible = ref(true)
const downloadImage = (row) => {
  row.show = true
}

const show_all = async() => {
  let queryData = {}
  if (all_visible.value === true)
    queryData = { "database":"Parking", "collection":"ParkingCarData", "query": { }}
  else 
    queryData = { "database":"Parking", "collection":"ParkingCarData", "query": {"end_date_time": {"$exists": false} }}
    let response = await MsiApi.mongoQuery(queryData)
  parkingData.length = 0
  Object.assign(parkingData, response.data.all)

  queryData = { "database":"OCPI", "collection":"Location", "pipelines": [
  { "$project": {"_id": 1, "name": 1 }}]}
  response = await MsiApi.mongoAggregate(queryData)
  let  locationData = response.data.result

  for (let i = 0; i < parkingData.length; i++) {
    let localStartTime =  new Date( (new Date(parkingData[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    parkingData[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(parkingData[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    parkingData[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

    for (let j = 0; j < locationData.length; j++) {
      if (parkingData[i].locationPk === locationData[j]._id) {
        parkingData[i].station_str = locationData[j].name
      }
    }
  }
}

onMounted( async () => {

  let queryData = { "database":"Parking", "collection":"ParkingCarData", "query": {}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(parkingData, response.data.all)

  queryData = { "database":"OCPI", "collection":"Location", "pipelines": [
  { "$project": {"_id": 1, "name": 1 }}]}
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result

  for (let i = 0; i < parkingData.length; i++) {
    let localStartTime =  new Date( (new Date(parkingData[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    parkingData[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(parkingData[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    parkingData[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

    for (let j = 0; j < locationData.length; j++) {
      if (parkingData[i].locationPk === locationData[j]._id) {
        parkingData[i].station_str = locationData[j].name
      }
    }
  }
})

</script>

<template>
  <div class="parking" style="height:85vh;">
    <el-checkbox v-model="all_visible" label="All" size="large" @change="show_all"/>
    <el-table :data="parkingData" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
      <el-table-column prop="station_str" label="Station" min-width="80"/>
      <el-table-column prop="station_id" label="EVSE " min-width="80"/>
      <el-table-column prop="car_num" label="Car Num" min-width="60"/>
      <el-table-column prop="start_date_local_time" label="Start Time" min-width="80"/>
      <el-table-column prop="end_date_local_time" label="End Time" min-width="80"/>
      <el-table-column prop="car_lp_pic" label="Pic" min-width="100">
        <template #default="scope">
          <template  v-if="!scope.row.show">
            <el-button @click="downloadImage(scope.row)"> preview </el-button>
          </template>
          <template v-else>
            <img :src=scope.row.car_lp_pic alt="" width="250">
          </template>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="created_date" label="created_date" min-width="80"/> -->
      <!-- <el-table-column prop="model_cr_ver" label="model_cr_ver" min-width="80"/>
      <el-table-column prop="model_lp_ver" label="model_lp_ver" min-width="80"/> -->
      <!-- <el-table-column prop="paymentHistoryInfo" label="paymentHistoryInfo" min-width="80"/> -->
      <!-- <el-table-column prop="sensor_type" label="sensor_type" min-width="80"/> -->
      <!-- <el-table-column prop="updated_date" label="updated_date" min-width="80"/> -->
      <!-- <el-table-column prop="_id" label="_id" min-width="80"/> -->
    </el-table>
  </div>
</template>

<style scoped>
.parking {
  padding-top: 20px;
  padding-left: 20px;
}
</style>