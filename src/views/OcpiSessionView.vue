<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import msi from '@/assets/msi_style'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import Calendar from '@/components/icons/IconCalendar.vue'
const MStore = useMStore()
const MsiApi = ApiFunc()
const OcpiSessionData = reactive([])
const now = new Date()
const isLoading = ref(false)

const filters = [
  { text: 'Completed', value: 'COMPLETED' },
  { text: 'Invalid', value: 'INVALID' },
  { text: 'Active', value: 'ACTIVE' },
  { text: 'Pending', value: 'PENDING' },
]
const filterTag = (value, rowData) => {
  return rowData.status === value
}
const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]

  if (bt === undefined) {
    return -1
  }
  if (at > bt) {
    return -1
  }
}

const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]

const download = () => {
  const tHeader = ['Status','Station','EVSE ID', 'kWh', 'Pirce', 'Start Time', 'End Time']
  const filterVal = ['status','location_str','evse_str', 'kwh', 'price_str', 'start_date_local_time', 'end_date_local_time']
  const data = OcpiSessionData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'Charge Session' })
}


const select_date = async () => {

  if (select_time.value === null) 
    select_time.value = [new Date(1970, 1, 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)]
  if (select_time.value?.[0] === undefined) {
    select_time.value[0] = [new Date(1970, 1, 1, 0, 0, 0) ,]
  }
  if (select_time.value?.[1] === undefined) {
    select_time.value[1] = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  }

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
    { "$project": { "_id":0, "status": 1,"total_cost": 1, "start_date_time": 1, "kwh": 1, "end_date_time": 1,"Location.name":1, "EVSE.evse_id":1} },
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
    { "$project": { "_id":0, "status": 1,"total_cost": 1, "start_date_time": 1, "kwh": 1, "end_date_time": 1,"Location.name":1, "EVSE.evse_id":1} },
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

<template>
  <div class="log">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <div class="date-picker w-full blue-1100">
          <el-date-picker 
            v-model="select_time" 
            class="mr-16px rounded-full"
            type="datetimerange" 
            range-separator="-"
            :prefix-icon="Calendar"
            start-placeholder="Start Date" 
            end-placeholder="End Date" 
            @change="select_date()"
            :default-time="defaultTime" 
            />
        </div>

        <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center">
          <p class="total-count box-shadow"> {{ 'Total Count : ' + OcpiSessionData.length  }}</p>
          <el-button class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow" @click="download">
            <span class="lg:hidden">Download</span>
            <img
              class="w-24px h-24px ml-10px lg:ml-0"
              src="@/assets/img/station_download.png"
              alt="station_download"
            />
          </el-button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="log-list pb-40px">
          <el-table 
            :data="OcpiSessionData"
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
              prop="status"
              label="Status"
              align="center"
              :filters="filters"
              :filter-method="filterTag"
              min-width="200"
            />
            <el-table-column
              prop="location_str"
              label="Station"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'location_str')"
              min-width="300"
            />
            <el-table-column
              prop="evse_str"
              label="EVSE ID"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'evse_str')"
              min-width="250"
            />
            <el-table-column
              prop="kwh"
              label="kWh"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'kwh')"
              min-width="200"
            />
            <el-table-column
              prop="price_str"
              label="Price"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
              min-width="200"
            />
            <el-table-column
              prop="start_date_local_time"
              label="Start Time"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'start_date_local_time')"
              min-width="250"
            />
            <el-table-column
              prop="end_date_local_time"
              label="End Time"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'end_date_local_time')"
              min-width="250"
            />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log {
  .download-btn {
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
  }
  .total-count {
    line-height: 40px;
    background-color: var(--blue-200);
    border-radius: 2rem;
    padding: 0 2rem;
    cursor: default;
  }
}



:deep(.el-table-filter__list) {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table-filter__bottom) {
  order: 2;
}

:deep(.el-table-filter__confirm) {
  order: 1;
}

.el-table-filter__bottom,
:deep(.el-table-filter__confirm) {
  margin-left: 8px; /* 為了在按鈕之間增加一些間距 */
}
</style>