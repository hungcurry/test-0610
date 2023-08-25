<script  setup>
import { onMounted, reactive, ref} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from "moment"
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import { useMStore } from "../stores/m_cloud"
import { QuestionFilled } from '@element-plus/icons-vue'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = ref([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)])
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorDataAll = reactive([])
const ErrorCodeVisible = ref(false)

const ocppErrorData = reactive([])
const cur_page = ref(1)
const item_count = ref()
const max_page = ref()
const tableRef = ref()

const handleButtonClick = () => {
  ErrorCodeVisible.value = true
}

const getEVSEOCPPLogs = async() => {
  isLoading.value = true
  if (select_time.value === null) 
    select_time.value = [new Date(1970, 1, 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)]
  if (select_time.value?.[0] === undefined) {
    select_time.value[0] = [new Date(1970, 1, 1, 0, 0, 0) ,]
  }
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
            @change="getEVSEOCPPLogs()"
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
          >
            <el-table-column
              prop="evse_id"
              :label="t('evse_id')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="ocpp_errorCode"
              :label="t('error_code')"
              align="center"
              sortable="custom"
              min-width="200"
            />
            <el-table-column
              prop="vendorErrorCode"
              :label="t('system_error_code')"
              align="center"
              sortable="custom"
              min-width="220"
            >
              <template #header>
                <div class="vendorErrorCode-container">
                  <span>{{ t('system_error_code') }}</span>
                  <el-button type="text" size="large" @click.stop="handleButtonClick" class="question-icon">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
  
            <el-table-column
              prop="ocpp_firmware_status"
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
  
        <el-dialog 
          v-model="ErrorCodeVisible" 
          class="max-w-600px"
          :show-close="true"
          width="90%"
          destroy-on-close
          center
          >
          <template #header="{ titleId, titleClass }">
            <div class="py-2rem relative bg-blue-100">
              <h4
                :id="titleId"
                :class="titleClass"
                class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
              >
                {{ t('error_code_list') }}
              </h4>
            </div>
          </template>
          <div class="dialog-context">
            <table>
              <tr>
                <td class="text-right">-1</td>
                <td>{{ t('no_communication_between_charging_board_and_hmi') }}</td>
              </tr>
              <tr>
                <td class="text-right">1</td>
                <td>{{ t('initial_setting_fault') }}</td>
              </tr>
              <tr>
                <td class="text-right">2</td>
                <td>{{ t('initial_leakage_current_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">3</td>
                <td>{{ t('high_leakage_current_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">4</td>
                <td>{{ t('low_leakage_current_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">5</td>
                <td>{{ t('ground_fault_protection_by_delta_type') }}</td>
              </tr>
              <tr>
                <td class="text-right">6</td>
                <td>{{ t('ground_fault_protection_by_y_type') }}</td>
              </tr>
              <tr>
                <td class="text-right">8</td>
                <td>{{ t('control_pilot_status_is_abnormal') }}</td>
              </tr>
              <tr>
                <td class="text-right">14</td>
                <td>{{ t('fw_update_checksum_is_abnormal') }}</td>
              </tr>
              <tr>
                <td class="text-right">15</td>
                <td>{{ t('fw_update_size_is_abnormal') }}</td>
              </tr>
              <tr>
                <td class="text-right">18</td>
                <td>{{ t('relay_detection_is_abnormal_for_non_charging_l_phase') }}</td>
              </tr>
              <tr>
                <td class="text-right">19</td>
                <td>{{ t('relay_detection_is_abnormal_for_non_charging_n_phase') }}</td>
              </tr>
              <tr>
                <td class="text-right">20</td>
                <td>{{ t('relay_detection_is_abnormal_for_charging_l_phase') }}</td>
              </tr>
              <tr>
                <td class="text-right">21</td>
                <td>{{ t('relay_detection_is_abnormal_for_charging_n_phase') }}</td>
              </tr>
              <tr>
                <td class="text-right">22</td>
                <td>{{ t('over_current_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">24</td>
                <td>{{ t('over_voltage_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">25</td>
                <td>{{ t('under_voltage_protection') }}</td>
              </tr>
              <tr>
                <td class="text-right">26</td>
                <td>{{ t('thermal_is_abnormal_for_system') }}</td>
              </tr>
              <tr>
                <td class="text-right">27</td>
                <td>{{ t('thermal_is_abnormal_for_relay') }}</td>
              </tr>
              <tr>
                <td class="text-right">28</td>
                <td>{{ t('thermal_is_abnormal_for_charging_gun') }}</td>
              </tr>
              <tr>
                <td class="text-right">33</td>
                <td>{{ t('emergency_button_is_triggered') }}</td>
              </tr>
              <tr>
                <td class="text-right">64</td>
                <td>{{ t('pile_state_is_abnormal') }}</td>
              </tr>

              <tr>
                <td class="text-right">159</td>
                <td>{{ t('unexpected_discharging') }}</td>
              </tr>
            </table>
          </div>
        </el-dialog>
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