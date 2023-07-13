<script  setup>
import { onMounted, reactive, ref} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from "moment"
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import { useMStore } from "../stores/m_cloud"
import { QuestionFilled } from '@element-plus/icons-vue'
const MStore = useMStore()
const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorData = reactive([])
const ErrorCodeVisible = ref(false)

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

const handleButtonClick = () => {
  ErrorCodeVisible.value = true
}

const getEVSEOCPPLogs = async() => {
  
  isLoading.value = true

  let queryData = {
    "database": "CPO", "collection": "EVSEOCPPLogs", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$created_date", { "$dateFromString": { "dateString": select_time.value[0] } }] },
              { "$lte": ["$created_date", { "$dateFromString": { "dateString": select_time.value[1] } }] }]
          }
        }
      },
      { "$project": { "_id": 0, 'created_date': 1, 'evse_id': 1, 'ocpp_errorCode': 1, 'vendorErrorCode': 1, 'ocpp_firmware_status':1} }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    ocppErrorData.splice(0, ocppErrorData.length)
    Object.assign(ocppErrorData, response.data.result)
  }
  else {
    console.log(response.data)
  }
  for (let i = 0; i < ocppErrorData.length; i++) {


    let localEndTime =  new Date( (new Date(ocppErrorData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    

    ocppErrorData[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }

  isLoading.value = false
}

const download = () => {
  const tHeader = ['EVSE ID', 'Error Code', 'VendorErrorCode', 'OCPP FW Status','Created Time']
  const filterVal = ['evse_id', 'ocpp_errorCode', 'vendorErrorCode', 'ocpp_firmware_status','created_date_str']
  const data = ocppErrorData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'OCPP Error' })
}

onMounted(() => {
  getEVSEOCPPLogs()
})

</script>

<template>
	<div class="ocpp-error">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <div class="date-picker w-full">
          <el-date-picker 
            v-model="select_time" 
            class="mr-16px"
            type="datetimerange" 
            range-separator="-"
            :prefix-icon="Calendar"
            start-placeholder="Start Date" 
            end-placeholder="End Date" 
            @change="getEVSEOCPPLogs()"
            :default-time="defaultTime" 
            />
        </div>

        <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center">
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
            :data="ocppErrorData"
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe
            size="large"
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column
              prop="evse_id"
              label="EVSE ID"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
              min-width="200"
            />
            <el-table-column
              prop="ocpp_errorCode"
              label="Error Code"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'ocpp_errorCode')"
              min-width="200"
            />
            <el-table-column
              prop="vendorErrorCode"
              label="VendorErrorCode"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'vendorErrorCode')"
              min-width="200"
            >
              <template #header>
                <div class="vendorErrorCode-container">
                  <span>VendorErrorCode</span>
                  <el-button type="text" size="large" @click.stop="handleButtonClick" class="question-icon">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
  
            <el-table-column
              prop="ocpp_firmware_status"
              label="OCPP FW Status"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'ocpp_firmware_status')"
              min-width="200"
            />
            
            <el-table-column
              prop="created_date_str"
              label="Created Time"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'created_date_str')"
              min-width="200"
            />
          </el-table>
        </div>
  
        <el-dialog 
          v-model="ErrorCodeVisible" 
          height="70%"
          title="Error Code List"
          >
          <div class="dialog-context">
            <p>-1  No communication between Charging board and HMI</p> 
            <p>1  Initial setting  fault</p> 
            <p>2  Initial Leakage current protection</p> 
            <p>3  High Leakage current protection</p> 
            <p>4  Low Leakage current protection</p> 
            <p>5  Ground Fault Protection by Delta type</p> 
            <p>6  Ground Fault Protection by Y type</p> 
            <p>8  Control pilot status is abnormal</p> 
            <p>14  Fw update checksum is abnormal</p> 
            <p>15  Fw update size is abnormal</p> 
            <p>18  Relay detection is abnormal for non-charging L phase</p> 
            <p>19  Relay detection is abnormal for non-charging N phase</p> 
            <p>20  Relay detection is abnormal for charging L phase</p> 
            <p>21  Relay detection is abnormal for charging N phase</p> 
            <p>22  Over current protection</p> 
            <p>24  Over Voltage Protection</p> 
            <p>25  Under Voltage Protection</p> 
            <p>26  Thermal is abnormal for system</p> 
            <p>27  Thermal is abnormal for relay</p> 
            <p>28  Thermal is abnormal for charging gun</p> 
            <p>33  Emergency button is triggered</p> 
            <p>64  Pile state is abnormal</p> 
            <p>159  Unexpected Discharging</p>
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
  .el-dialog {
    p {
      margin-bottom: 1rem;
      text-align: left;
    }
  }
  :deep(.el-dialog) {
    border: 0.4rem solid var(--blue-700);
    max-height: 85%;
    overflow-y: auto;
  }
  :deep(.el-dialog__header) {
    padding: 1.2rem 2rem 0 2rem;
  }
  :deep(.cell) {
      overflow: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
  }
}

</style>