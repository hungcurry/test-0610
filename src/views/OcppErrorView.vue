<script  setup>
import { onMounted, reactive, ref} from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import { useMStore } from "../stores/m_cloud";
import moment from "moment"
const MStore = useMStore()

const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorData = reactive([])
const ErrorCodeVisible = ref(false)

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
    console.log(response)
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
    <p class="total-count"> {{ 'Total Count : ' + ocppErrorData.length  }}</p>
		<div class="date-picker">
			<el-date-picker v-model="select_time" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" :default-time="defaultTime" @change="getEVSEOCPPLogs"/>
		</div>
		<el-button class="download" @click="download"> Download </el-button>
		<div class="log-list">
			<el-table :data="ocppErrorData" style="width: 95%; height:95%" stripe  :cell-style=msi.tb_cell  :header-cell-style=msi.tb_header_cell size="large" v-loading = "isLoading">
          <el-table-column prop="evse_id" label="EVSE ID" min-width="10"/>
          <el-table-column prop="ocpp_errorCode" label="Error Code" min-width="10"/>
          <el-table-column prop="vendorErrorCode" label="Vendor Error Code" min-width="10">
            <template #header>
            <div class="custom-header">
              <span>System Error Code</span>
              <el-button type="text" size="small" @click="handleButtonClick">?</el-button>
            </div>
          </template>
          </el-table-column>
          <el-table-column prop="ocpp_firmware_status" label="FW Error Info" min-width="10"/>
          <el-table-column prop="created_date_str" label="Created Time" min-width="10" sortable='sortable' />
			</el-table>
		</div>
    <el-dialog v-model="ErrorCodeVisible" title="Error Code List">
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
    </el-dialog>
	</div>
</template>

<style lang="scss">
.ocpp-error {
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