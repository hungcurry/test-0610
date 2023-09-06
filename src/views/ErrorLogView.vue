<script  setup>
import { onMounted, reactive, ref} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from "moment"
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import { useMStore } from "../stores/m_cloud"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = ref([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)])
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorDataAll = reactive([])

const ocppErrorData = reactive([])
const cur_page = ref(1)
const item_count = ref()
const max_page = ref()
const tableRef = ref()

const convertErrorCode = () => {
  for (let j=0; j<ocppErrorDataAll.length; j++) {
    switch (ocppErrorDataAll[j].ocpp_errorCode) {
      case 'OtherError':
      ocppErrorDataAll[j].ocpp_errorCode_str = t('other_error')
        break;
      case 'NoError':
      ocppErrorDataAll[j].ocpp_errorCode_str = t('no_error')
        break;
      case 'InternalError':
      ocppErrorDataAll[j].ocpp_errorCode_str = t('internal_error')
        break;
      case 'UnderVoltage':
      ocppErrorDataAll[j].ocpp_errorCode_str = t('under_voltage')
        break;
      case 'GroundFailure':
      ocppErrorDataAll[j].ocpp_errorCode_str = t('ground_failure')
        break;
      default:
      ocppErrorDataAll[j].ocpp_errorCode_str = ocppErrorDataAll[j].ocpp_errorCode
        break;
    }

    switch (ocppErrorDataAll[j].vendorErrorCode) {
      // Error Code
      case '-1':
      ocppErrorDataAll[j].syetem_error_code_str = t('control_board_not_connect')
        break;
      case '1':
      ocppErrorDataAll[j].syetem_error_code_str = t('internal_error')
        break;
      case '5':
      ocppErrorDataAll[j].syetem_error_code_str = t('ground_failure')
        break;
      case '6':
      ocppErrorDataAll[j].syetem_error_code_str = t('ground_failure')
        break;
      case '8':
      ocppErrorDataAll[j].syetem_error_code_str = t('ev_communication_error')
        break;
      case '18':
      ocppErrorDataAll[j].syetem_error_code_str = t('power_switch_failure')
        break;
      case '19':
      ocppErrorDataAll[j].syetem_error_code_str = t('power_switch_failure')
        break;
      case '20':
      ocppErrorDataAll[j].syetem_error_code_str = t('power_switch_failure')
        break;
      case '21':
      ocppErrorDataAll[j].syetem_error_code_str = t('power_switch_failure')
        break;
      case '22':
      ocppErrorDataAll[j].syetem_error_code_str = t('over_current_failure')
        break;
      case '24':
      ocppErrorDataAll[j].syetem_error_code_str = t('over_voltage')
        break;
      case '25':
      ocppErrorDataAll[j].syetem_error_code_str = t('under_voltage')
        break;
      case '26':
      ocppErrorDataAll[j].syetem_error_code_str = t('high_temperature')
        break;
      case '27':
      ocppErrorDataAll[j].syetem_error_code_str = t('high_temperature')
        break;
      case '28':
      ocppErrorDataAll[j].syetem_error_code_str = t('high_temperature')
        break;
      case '30':
      ocppErrorDataAll[j].syetem_error_code_str = t('illegal_charging')
        break;
      case '33':
      ocppErrorDataAll[j].syetem_error_code_str = t('emergency_button_triggered')
        break;
      case '64':
      ocppErrorDataAll[j].syetem_error_code_str = t('pile_fault')
        break;
      // System Error Code
      case '2':
      ocppErrorDataAll[j].syetem_error_code_str = t('gfcl_initial_fault')
        break;
      case '3':
      ocppErrorDataAll[j].syetem_error_code_str = t('gfcl_fault1')
        break;
      case '4':
      ocppErrorDataAll[j].syetem_error_code_str = t('gfcl_fault2')
        break;
      case '14':
      ocppErrorDataAll[j].syetem_error_code_str = t('firmware_update_checksum_fault')
        break;
      case 'CAM_ERROR':
      ocppErrorDataAll[j].syetem_error_code_str = t('cam_error')
        break;
      case 'UI_ERROR':
      ocppErrorDataAll[j].syetem_error_code_str = t('ui_error')
        break;
    
      default:
        if (ocppErrorDataAll[j].ocpp_firmware_status === 'DownloadFailed') {
          ocppErrorDataAll[j].ocpp_firmware_status_str = t('download_failed')
        }
        else if (ocppErrorDataAll[j].ocpp_firmware_status === 'InstallationFailed') {
          ocppErrorDataAll[j].ocpp_firmware_status_str = t('installation_failed')
        }
        break;
    }
  }
}

const select_date = async() => {
  await getEVSEOCPPLogs()
  await getPageData()
  tableRef.value.sort('created_date_str', 'ascending')
}

const getEVSEOCPPLogs = async() => {
  if (select_time.value?.[1] === undefined) {
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
      { "$project": { "_id": 0, 'created_date': 1, 'evse_id': 1, 'ocpp_errorCode': 1, 'vendorErrorCode': 1, 'ocpp_firmware_status':1} }
    ]
  }
  isLoading.value = true
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    ocppErrorDataAll.splice(0, ocppErrorDataAll.length)
    Object.assign(ocppErrorDataAll, response.data.result)
  }
  else {
    console.log(response.data)
  }
  for (let i = 0; i < ocppErrorDataAll.length; i++) {

    let localEndTime =  new Date( (new Date(ocppErrorDataAll[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    
    ocppErrorDataAll[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    
  }
  convertErrorCode()

  isLoading.value = false
}

const download = () => {
  const tHeader = ['EVSE ID', 'Error Code', 'System Error Code', 'FW Error Info','Created Time']
  const filterVal = ['evse_id', 'ocpp_errorCode', 'vendorErrorCode', 'ocpp_firmware_status','created_date_str']
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

onMounted(async() => {
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
          >
            <el-table-column
              prop="evse_id"
              :label="t('evse_id')"
              align="center"
              sortable="custom"
              min-width="200"
            />
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