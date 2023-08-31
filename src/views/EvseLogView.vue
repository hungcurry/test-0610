<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import msi from '@/assets/msi_style'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import Calendar from '@/components/icons/IconCalendar.vue'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const OcpiSessionDataAll = reactive([])
const now = new Date()
const isLoading = ref(false)

const OcpiSessionData = reactive([])
const cur_page = ref(1)
const item_count = ref()
const max_page = ref()
const tableRef = ref()

const filters = [
  { text: t('completed'), value: t('completed') },
  { text: t('invalid'), value: t('invalid')},
  { text: t('active'), value: t('active') },
  { text: t('pending'), value: t('pending') },
]

const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]

const download = () => {
  const tHeader = ['Status','Station','EVSE ID', 'kWh', 'Pirce', 'Start Time', 'End Time']
  const filterVal = ['status','location_str','evse_str', 'kwh', 'price_str', 'start_date_local_time', 'end_date_local_time']
  const data = OcpiSessionDataAll.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'Charger Log' })
}


const select_date = async () => {
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
  OcpiSessionDataAll.length = 0
  Object.assign(OcpiSessionDataAll, res.data.result)
  
  for (let i = 0; i < OcpiSessionDataAll.length; i++) {
    OcpiSessionDataAll[i].price_str = OcpiSessionDataAll[i]?.total_cost?.incl_vat.toLocaleString()
    OcpiSessionDataAll[i].location_str = OcpiSessionDataAll[i]?.Location[0]?.name
    OcpiSessionDataAll[i].evse_str = OcpiSessionDataAll?.[i]?.EVSE?.[0]?.evse_id

    let localStartTime =  new Date( (new Date(OcpiSessionDataAll[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(OcpiSessionDataAll[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

    switch (OcpiSessionDataAll[i].status) {
      case 'COMPLETED':
        OcpiSessionDataAll[i].status = t('completed')
        break;
      case 'INVALID':
        OcpiSessionDataAll[i].status = t('invalid')
        break;
      case 'ACTIVE':
        OcpiSessionDataAll[i].status = t('active')
        break;
      case 'PENDING':
        OcpiSessionDataAll[i].status = t('pending')
        break;
      default:
        break;
    }
  }
  await getPageData()
  tableRef.value.sort('start_date_local_time', 'ascending')
  isLoading.value = false
}

const getPageData = async() => {
  let table_body_height = window.innerHeight - 250 - 45
  item_count.value = Math.floor(table_body_height / 45)
  max_page.value = Math.ceil(OcpiSessionDataAll.length / item_count.value) * 10

  let count = item_count.value
  OcpiSessionData.length = 0
  if (cur_page.value * 10 === max_page.value) {
    count = OcpiSessionDataAll.length - (cur_page.value-1) * item_count.value
  }
  else if (max_page.value === 0) {
    count = 0
  }
  for (let i=0; i<count; i++) {
    OcpiSessionData.push(OcpiSessionDataAll[(cur_page.value - 1) * item_count.value + i])
  }
}

const tableSort = async(column) => {
  let target = column.prop
  let order = column.order
  OcpiSessionDataAll.sort(function (a, b) {
    if (a[target] === undefined) {
      a[target] = ''
    }
    else if (b[target] === undefined) {
      b[target] = ''
    }

    if (target === 'price_str') {
      let a_num = parseFloat(a[target].replace(/,/g, ""))
      let b_num = parseFloat(b[target].replace(/,/g, ""))
      if (order === 'ascending')
        return a_num > b_num? -1 : 1
      else
        return a_num > b_num? 1 : -1
    }

    if (order === 'ascending') {
      return a[target] > b[target]? -1 : 1
    }
    else {
      return a[target] > b[target]? 1 : -1
    }
  })

  getPageData()
}
const tableFilter = async(filters) => {
  let filter_options = []
  if (filters.style.length === 0) {
    filter_options.push('COMPLETED')
    filter_options.push('INVALID')
    filter_options.push('ACTIVE')
    filter_options.push('PENDING')
  }
  else {
    for (let i=0; i<filters.style.length; i++) {
      if (filters.style[i] === t('completed')) {
        filter_options.push('COMPLETED')
      }
      else if (filters.style[i] === t('invalid')) {
        filter_options.push('INVALID')
      }
      else if (filters.style[i] === t('active')) {
        filter_options.push('ACTIVE')
      }
      else if (filters.style[i] === t('pending')) {
        filter_options.push('PENDING')
      }
    }
  }
  
  let queryData = { "database":"OCPI", "collection":"Session", "pipelines": [ 
    {
      "$match": {
        "$expr":{
          "$and" : [
            {
              "$gte" : [
                "$start_date_time", { "$dateFromString": {"dateString": new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)}}
              ]
            },
            {
              "$in" : [
                "$status", filter_options
              ]
            }
          ]
        },
      }
    },
    { "$lookup": {"from":'Location', "localField": "location_id", "foreignField": "id", "as":"Location"}},
    { "$lookup": {"from":'EVSE', "localField": "evse_uid", "foreignField": "uid", "as":"EVSE"}},
    { "$project": { "_id":0, "status": 1,"total_cost": 1, "start_date_time": 1, "kwh": 1, "end_date_time": 1,"Location.name":1, "EVSE.evse_id":1} },
  ]}
  let res = await MsiApi.mongoAggregate(queryData) 
  OcpiSessionDataAll.length = 0
  Object.assign(OcpiSessionDataAll, res.data.result)
  for (let i = 0; i < OcpiSessionDataAll.length; i++) {
    OcpiSessionDataAll[i].price_str = OcpiSessionDataAll[i]?.total_cost?.incl_vat.toLocaleString()
    OcpiSessionDataAll[i].location_str = OcpiSessionDataAll[i]?.Location?.[0]?.name
    OcpiSessionDataAll[i].evse_str = OcpiSessionDataAll[i]?.EVSE?.[0]?.evse_id

    let localStartTime =  new Date( (new Date(OcpiSessionDataAll[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(OcpiSessionDataAll[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

    switch (OcpiSessionDataAll[i].status) {
      case 'COMPLETED':
        OcpiSessionDataAll[i].status = t('completed')
        break;
      case 'INVALID':
        OcpiSessionDataAll[i].status = t('invalid')
        break;
      case 'ACTIVE':
        OcpiSessionDataAll[i].status = t('active')
        break;
      case 'PENDING':
        OcpiSessionDataAll[i].status = t('pending')
        break;
      default:
        break;
    }
  }
  getPageData()
  tableRef.value.sort('start_date_local_time', 'ascending')
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
  OcpiSessionDataAll.length = 0
  Object.assign(OcpiSessionDataAll, res.data.result)
  for (let i = 0; i < OcpiSessionDataAll.length; i++) {
    OcpiSessionDataAll[i].price_str = OcpiSessionDataAll[i]?.total_cost?.incl_vat.toLocaleString()
    OcpiSessionDataAll[i].location_str = OcpiSessionDataAll[i]?.Location?.[0]?.name
    OcpiSessionDataAll[i].evse_str = OcpiSessionDataAll[i]?.EVSE?.[0]?.evse_id

    let localStartTime =  new Date( (new Date(OcpiSessionDataAll[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].start_date_local_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))

    let localEndTime =  new Date( (new Date(OcpiSessionDataAll[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    OcpiSessionDataAll[i].end_date_local_time = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

    switch (OcpiSessionDataAll[i].status) {
      case 'COMPLETED':
        OcpiSessionDataAll[i].status = t('completed')
        break;
      case 'INVALID':
        OcpiSessionDataAll[i].status = t('invalid')
        break;
      case 'ACTIVE':
        OcpiSessionDataAll[i].status = t('active')
        break;
      case 'PENDING':
        OcpiSessionDataAll[i].status = t('pending')
        break;
      default:
        break;
    }
  }
  await getPageData()

  window.addEventListener("resize", function () {
    getPageData()
  })
  tableRef.value.sort('start_date_local_time', 'ascending')
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
            :start-placeholder="t('start_date')" 
            :end-placeholder="t('end_date')" 
            @change="select_date()"
            :default-time="defaultTime" 
            />
        </div>

        <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center">
          <p class="total-count box-shadow"> {{ t('total_count') + ' : ' + OcpiSessionDataAll.length  }}</p>
          <el-button class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow" @click="download">
            <span class="lg:hidden">{{ t('download') }}</span>
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
            ref="tableRef"
            :data="OcpiSessionData"
            class="white-space-nowrap text-primary"
            height="calc(100vh - 250px)"
            style="width: 100%" 
            stripe  
            size="large" 
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
            @sort-change="tableSort"
            @filter-change="tableFilter"
          >
            <el-table-column
              prop="status"
              :label="t('status')"
              align="center"
              :filters="filters"
              :column-key="'style'"
              min-width="200"
            />
            <el-table-column
              prop="location_str"
              :label="t('station')"
              align="center"
              sortable="custom"
              min-width="300"
            />
            <el-table-column
              prop="evse_str"
              :label="t('evse_id')"
              align="center"
              sortable="custom"
              min-width="250"
            />
            <el-table-column
              prop="kwh"
              :label="t('kwh')"
              header-align="center"
              align="right"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="price_str"
              :label="t('price')"
              header-align="center"
              align="right"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="start_date_local_time"
              :label="t('start_time')"
              align="center"
              sortable="custom"
              min-width="250"
            />
            <el-table-column
              prop="end_date_local_time"
              :label="t('end_time')"
              align="center"
              sortable="custom"
              min-width="250"
            />
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
:deep(.el-table__inner-wrapper::before) {
  height: 0px;
}
</style>