<script  setup>
import { onMounted, reactive, ref} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from "moment"
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import { useMStore } from "../stores/m_cloud"
import { useI18n } from "vue-i18n"
import { useRouter } from 'vue-router'
const router = useRouter()
const { t } = useI18n()
const MStore = useMStore()
const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = ref([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)])
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorDataAll = reactive([])
const ocppErrorDataOri = reactive([])

const ocppErrorData = reactive([])
const company_filter_item = reactive([])
const cur_page = ref(1)
const item_count = ref()
const max_page = ref()
const tableRef = ref()

const convertErrorCode = (item) => {
  switch (item) {
    case 'OtherError':                  return t('other_error')
    case 'NoError':                     return t('no_error')
    case 'ControlBoardNotConnect':      return t('control_board_not_connect')
    case 'InternalError':               return t('internal_error')
    case 'GroundFailure':               return t('ground_failure')
    case 'EVCommunicationError':        return t('ev_communication_error')
    case 'PowerSwitchFailure':          return t('power_switch_failure')
    case 'OverCurrentFailure':          return t('over_current_failure')
    case 'OverVoltage':                 return t('over_voltage')
    case 'UnderVoltage':                return t('under_voltage')
    case 'HighTemperature':             return t('high_temperature')
    case 'IllegalCharging':             return t('illegal_charging')
    case 'EmergencyButtonTriggered':    return t('emergency_button_triggered')
    case 'PileFault':                   return t('pile_fault')
    case 'UIError':                     return t('ui_error')
    case 'CamError':                    return t('cam_error')
    case 'GFCIInitialFault':            return t('gfci_initial_fault')
    case 'GFCIFault1':                  return t('gfci_fault1')
    case 'GFCIFault2':                  return t('gfci_fault2')
    case 'FirmwareUpdateChecksumFault': return t('firmware_update_checksum_fault')
    case 'DownloadFailed':              return t('download_failed')
    case 'InstallationFailed':          return t('installation_failed')
    default: return item
  }
}

const select_date = async() => {
  await getEVSEOCPPLogs()
  await getPageData()
  tableRef.value.sort('created_date_str', 'ascending')
}

const getEVSEOCPPLogs = async() => {
  if (select_time.value?.[1] == undefined) {
    select_time.value[1] = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  }
  let queryData = {
    "database": "CPO", "collection": "EVSEOCPPLogs", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$created_date", { "$dateFromString": { "dateString": select_time.value?.[0] } }] },
              { "$lte": ["$created_date", { "$dateFromString": { "dateString": select_time.value?.[1] } }] }]
          }
        }
      },
      { "$project": { "_id": 0, 'created_date': 1, 'evse_id': 1, 'ocpp_errorCode': 1, 'vendorErrorCode': 1, 'ocpp_firmware_status':1, "byCompany":1} }
    ]
  }
  isLoading.value = true
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    ocppErrorDataAll.splice(0, ocppErrorDataAll.length)
    ocppErrorDataOri.splice(0, ocppErrorDataOri.length)
    Object.assign(ocppErrorDataAll, response.data.result)
    Object.assign(ocppErrorDataOri, response.data.result)
  }
  else {
    console.log(response.data)
  }
  for (let i = 0; i < ocppErrorDataAll.length; i++) {

    let localEndTime =  new Date( (new Date(ocppErrorDataAll[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    
    ocppErrorDataAll[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    ocppErrorDataAll[i].ocpp_errorCode_str = convertErrorCode(ocppErrorDataAll[i].ocpp_errorCode)
    ocppErrorDataAll[i].syetem_error_code_str = convertErrorCode(ocppErrorDataAll[i].vendorErrorCode)
    ocppErrorDataAll[i].ocpp_firmware_status_str = convertErrorCode(ocppErrorDataAll[i].ocpp_firmware_status)

    if (ocppErrorDataAll[i].byCompany !== undefined) {
      for (let j = 0; j < company_filter_item.length; j++)
        if (ocppErrorDataAll[i].byCompany === company_filter_item[j].value) {
          ocppErrorDataAll[i].byCompany_str = company_filter_item[j].text
        }
    }
  }

  isLoading.value = false
}

const download = () => {
  let tHeader = ['EVSE ID', 'Error Code', 'System Error Code', 'FW Error Info', 'Created Time']
  let filterVal = ['evse_id', 'ocpp_errorCode_str', 'syetem_error_code_str', 'ocpp_firmware_status_str','created_date_str']
  if (MStore.permission.isMSI) {
    tHeader = ['Company', 'EVSE ID', 'Error Code', 'System Error Code', 'FW Error Info', 'Created Time']
    filterVal = ['byCompany_str', 'evse_id', 'ocpp_errorCode_str', 'syetem_error_code_str', 'ocpp_firmware_status_str', 'created_date_str']
  }
  const data = ocppErrorDataAll.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'OCPP Error' })
}

const getPageData = async() => {
  let table_body_height = window.innerHeight - 250 - 45
  item_count.value = Math.floor(table_body_height / 45)
  max_page.value = Math.ceil(ocppErrorDataAll.length / item_count.value) * 10

  let count = item_count.value
  ocppErrorData.length = 0
  if (cur_page.value * 10 === max_page.value) {
    count = ocppErrorDataAll.length - (cur_page.value-1) * item_count.value
  }
  else if (max_page.value === 0) {
    count = 0
  }
  for (let i=0; i<count; i++) {
    ocppErrorData.push(ocppErrorDataAll[(cur_page.value - 1) * item_count.value + i])
  }
}

const tableSort = async(column) => {
  let target = column.prop
  let order = column.order
  ocppErrorDataAll.sort(function (a, b) {
    if (a[target] === undefined) {
      a[target] = ''
    }
    else if (b[target] === undefined) {
      b[target] = ''
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
  ocppErrorDataAll.length = 0
  if(filters.company_filter !== undefined) {
    if (filters.company_filter.length === 0) {
      Object.assign(ocppErrorDataAll, ocppErrorDataOri)
    }
    else {
      const filteredArray = ocppErrorDataOri.filter(item => filters.company_filter.includes(item.byCompany))
      Object.assign(ocppErrorDataAll, filteredArray)
    }
  }
  getPageData()
  tableRef.value.sort('start_date_local_time', 'ascending')
}

const detail_info = async (evse_id) => {
  let queryData = {
    database: 'OCPI',
    collection: 'EVSE',
    pipelines: [
    { $match: { evse_id: { $eq: evse_id } } },  
    { $project: { uid: 1 } }],
  }
  let response = await MsiApi.mongoAggregate(queryData)
  router.push({ name: 'evseDetail', query: {  evse_id: response.data.result[0].uid }})
}

onMounted(async() => {
  let queryData = {
    database: 'CPO',
    collection: 'CompanyInformation',
    pipelines: [{ $project: { _id: 1, name: 1 } }],
  }
  let response = await MsiApi.mongoAggregate(queryData)

  let company_filter_item1 =  response.data.result.map(item => {
    return {
      text: item.name,
      value: item._id,
    }
  })
  Object.assign(company_filter_item, company_filter_item1)

  await getEVSEOCPPLogs()
  await getPageData()

  window.addEventListener("resize", function () {
    getPageData()
  })
  tableRef.value.sort('created_date_str', 'ascending')
})

</script>

<template>
	<div class="ocpp-error">
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
          <p class="total-count box-shadow"> {{ t('total_count') + ' : ' + ocppErrorDataAll.length  }}</p>
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
            :data="ocppErrorData"
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
            <el-table-column v-if="MStore.permission.isMSI"
              prop="byCompany_str"
              :label="t('company')"
              :column-key="'company_filter'"
              align="center"
              :filters="company_filter_item"
              min-width="200"
            />
            <el-table-column :label="t('evse_id')" align="center" sortable="custom" min-width="200">
              <template #default="scope">
                <el-button class="btn-secondary border-0" @click="detail_info(scope.row.evse_id)">
                  {{ scope.row.evse_id }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column
              prop="ocpp_errorCode_str"
              :label="t('error_code')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="syetem_error_code_str"
              :label="t('system_error_code')"
              align="center"
              sortable="custom"
              min-width="220"
            />
            <el-table-column
              prop="ocpp_firmware_status_str"
              :label="t('fw_error_info')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="created_date_str"
              :label="t('created_time')"
              align="center"
              sortable="custom"
              min-width="200"
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
.ocpp-error {
  .download-btn {
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
  }
  .vendorErrorCode-container {
    position: relative;
    .question-icon {
      position: absolute;
      top: -1.1rem;
      right: -6.2rem;
    }
  }
  .total-count {
    line-height: 40px;
    background-color: var(--blue-200);
    border-radius: 2rem;
    padding: 0 2rem;
    cursor: default;
  }
  .el-dialog {
    tr {
      height: 25px;
    }
    td {
      padding-right: 10px;
    }
  }
  :deep(.cell) {
      overflow: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  :deep(.el-table__inner-wrapper::before) {
    height: 0px;
  }
  :deep(.el-dialog__headerbtn) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 1rem;
    height: 3rem;
    width: 3rem;
  }
}

</style>