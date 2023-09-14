<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const parkingDataAll = reactive([])
const all_visible = ref(true)
const isLoading = ref(false)
const parkingData = reactive([])
const cur_page = ref(1)
const item_count = ref()
const max_page = ref()
const tableRef = ref()
const hideImage = (row) => {
  row.show = false
}
const downloadImage = (row) => {
  row.show = true
}
const show_all = async () => {
  let queryData = {}
  if (all_visible.value === true)
    queryData = { 
      "database": 'Parking', 
      "collection": 'ParkingCarData', 
      "pipelines": [
        {
          $project: { _id: 0 } 
        }
      ]
    }
  else
    queryData = { 
      "database": 'Parking', 
      "collection": 'ParkingCarData', 
      "pipelines": [
        {
          $match: {
            end_date_time: {
              $exists: false
            }
          }
        },
        {
          $project: { _id: 0 } 
        }
      ]
    }
  
  await getParkingData(queryData)
  await getPageData()
  tableRef.value.sort('end_date_local_time', 'ascending')
}
const getParkingData = async(queryData) => {
  let response = await MsiApi.mongoAggregate(queryData)
  parkingDataAll.length = 0
  Object.assign(parkingDataAll, response.data.result)

  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 1, name: 1 } }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result

  for (let i = 0; i < parkingDataAll.length; i++) {
    let localStartTime = new Date(
      new Date(parkingDataAll[i].start_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingDataAll[i].start_date_local_time = moment(localStartTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    let localEndTime = new Date(
      new Date(parkingDataAll[i].end_date_time).getTime() + MStore.timeZoneOffset * -60000
    )
    parkingDataAll[i].end_date_local_time = moment(localEndTime).format(
      'YYYY-MM-DD HH:mm:ss'
    )

    for (let j = 0; j < locationData.length; j++) {
      if (parkingDataAll[i].locationPk === locationData[j]._id) {
        parkingDataAll[i].station_str = locationData[j].name
      }
    }
  }
}
const getPageData = async() => {
  let table_body_height = window.innerHeight - 220 - 56
  item_count.value = Math.floor(table_body_height / 56)
  max_page.value = Math.ceil(parkingDataAll.length / item_count.value) * 10

  let count = item_count.value
  parkingData.length = 0
  if (cur_page.value * 10 === max_page.value) {
    count = parkingDataAll.length - (cur_page.value-1) * item_count.value
  }
  for (let i=0; i<count; i++) {
    parkingData.push(parkingDataAll[(cur_page.value - 1) * item_count.value + i])
  }
}
const tableSort = async(column) => {
  let target = column.prop
  let order = column.order
  parkingDataAll.sort(function (a, b) {
    if (order === 'ascending') {
      return a[target] > b[target]? -1 : 1
    }
    else {
      return a[target] > b[target]? 1 : -1
    }
  })

  getPageData()
}
onMounted(async () => {
  let queryData = { 
    "database": 'Parking', 
    "collection": 'ParkingCarData', 
    "pipelines": [
      {
        $project: { _id: 1, sensor_type: 0, model_lp_ver: 0, model_cr_ver: 0, paymentHistoryInfo: 0, updated_date: 0, created_date: 0,  } 
      }
    ]
  }

  await getParkingData(queryData)
  await getPageData()
  window.addEventListener("resize", function () {
    getPageData()
  })
  tableRef.value.sort('end_date_local_time', 'ascending')
})
</script>

<template>
  <div class="parking">
    <div class="container lg">
      <div class="overflow-x-auto ">
        <div class="pb-40px mt-80px">
          <el-table
            ref="tableRef"
            :data="parkingData"
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe
            size="large"
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
            @sort-change="tableSort"
          >
            <el-table-column
              prop="station_str"
              :label="t('station')"
              align="center"
              sortable="custom"
              min-width="150"
            />
            <el-table-column
              prop="station_id"
              :label="t('evse_id')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="car_num"
              :label="t('license_plate')"
              align="center"
              sortable="custom"
              min-width="170"
            />
            <el-table-column
              prop="start_date_local_time"
              :label="t('start_time')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="end_date_local_time"
              :label="t('end_time')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="car_lp_pic"
              :label="t('pic')"
              align="center"
              min-width="250"
            >
              <template #default="scope">
                <template v-if="!scope.row.show">
                  <el-button class="btn-info" @click="downloadImage(scope.row)"> {{ t('preview') }} </el-button>
                </template>
                <template v-else>
                  <div class="img-container">
                    <img class="img" :src="scope.row.car_lp_pic" alt="" />
                    <img src="@/assets/img/station_edit_close.png" class="close-btn w-20px h-20px" @click="hideImage(scope.row)">
                  </div>
                </template>
              </template>
            </el-table-column>
  
          </el-table>
          <el-pagination 
            class="justify-center"
            layout="prev, pager, next" 
            :total="max_page" 
            v-model:current-page="cur_page" 
            @current-change="getPageData" 
          />
        </div>
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
.img-container {
  width: 20rem;
  position: relative;
  margin: auto;
  padding: 20px 0 0 0;
}
.close-btn {
  position: absolute;
  background-color: var(--blue-1100);
  border-radius: 50%;
  padding: 2px;
  top: 5px;
  right: -15px;
}
:deep(.el-table__inner-wrapper::before) {
  height: 0px;
}
</style>
