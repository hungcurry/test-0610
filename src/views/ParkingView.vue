<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'

const MStore = useMStore()
const MsiApi = ApiFunc()
const parkingData = reactive([])
const all_visible = ref(true)
const isLoading = ref(false)

const downloadImage = (row) => {
  row.show = true
}
const show_all = async () => {
  let queryData = {}
  if (all_visible.value === true)
    queryData = { database: 'Parking', collection: 'ParkingCarData', query: {} }
  else
    queryData = {
      database: 'Parking',
      collection: 'ParkingCarData',
      query: { end_date_time: { $exists: false } },
    }
  let response = await MsiApi.mongoQuery(queryData)
  parkingData.length = 0
  Object.assign(parkingData, response.data.all)

  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 1, name: 1 } }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result

  for (let i = 0; i < parkingData.length; i++) {
    let localStartTime = new Date(
      new Date(parkingData[i].start_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingData[i].start_date_local_time = moment(localStartTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    let localEndTime = new Date(
      new Date(parkingData[i].end_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingData[i].end_date_local_time = moment(localEndTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    for (let j = 0; j < locationData.length; j++) {
      if (parkingData[i].locationPk === locationData[j]._id) {
        parkingData[i].station_str = locationData[j].name
      }
    }
  }
}
onMounted(async () => {
  let queryData = { database: 'Parking', collection: 'ParkingCarData', query: {} }
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(parkingData, response.data.all)

  // console.log(parkingData)


  // queryData = {
  //   database: 'Parking',
  //   collection: 'ParkingCarData',
  //   pipelines: [{ $project: { _id: 1} }],
  // }
  // console.log(queryData)
  // response = await MsiApi.mongoAggregate(queryData)
  // console.log(response)


  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 1, name: 1 } }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result

  for (let i = 0; i < parkingData.length; i++) {
    let localStartTime = new Date(
      new Date(parkingData[i].start_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingData[i].start_date_local_time = moment(localStartTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    let localEndTime = new Date(
      new Date(parkingData[i].end_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingData[i].end_date_local_time = moment(localEndTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    for (let j = 0; j < locationData.length; j++) {
      if (parkingData[i].locationPk === locationData[j]._id) {
        parkingData[i].station_str = locationData[j].name
      }
    }
  }
})
</script>

<template>
  <div class="parking">
    <div class="container lg">
      <div class="flex justify-start flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-checkbox v-model="all_visible" label="All" size="large" @change="show_all" />
      </div>
      <div class="overflow-x-auto pb-40px">
        <el-table
          :data="parkingData"
          class="white-space-nowrap text-primary"
          height="calc(100vh - 220px)"
          style="width: 100%"
          stripe
          size="large"
          :cell-style="msi.tb_cell"
          :header-cell-style="msi.tb_header_cell"
          v-loading.fullscreen.lock="isLoading"
          :default-sort="{ prop: 'start_date_local_time', order: 'ascending' }"
        >
          <el-table-column
            prop="station_str"
            label="Station"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="station_id"
            label="EVSE "
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="car_num"
            label="Car Num"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="start_date_local_time"
            label="Start Time"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="end_date_local_time"
            label="End Time"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="car_lp_pic"
            label="Pic"
            align="center"
            sortable
            min-width="200"
          >
            <template #default="scope">
              <template v-if="!scope.row.show">
                <el-button class="btn-info" @click="downloadImage(scope.row)"> preview </el-button>
              </template>
              <template v-else>
                <img class="img" :src="scope.row.car_lp_pic" alt="" />
              </template>
            </template>
          </el-table-column>

        </el-table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.el-checkbox.el-checkbox--large {
  height: auto;
}
.img {
  display: block;
  width: 20rem;
  max-width: 100%;
  margin: auto;
}
</style>
