<template>

	<div class="ocpp-error">
		<div class="date-picker">
			<el-date-picker v-model="select_time" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" :default-time="defaultTime" @change="getEVSEOCPPLogs"/>
		</div>
		<el-button class="download" @click="download"> Download </el-button>

		<div class="log-list">
			<el-table :data="ocppErrorData" style="width: 95%; height:95%" stripe  :cell-style=msi.tb_cell  :header-cell-style=msi.tb_header_cell size="large" v-loading = "isLoading">
				<el-table-column v-for="item in ocppErrorTabel" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable">
						<template #default="scope" v-if ="item.type === 'button'">
							<el-button disabled @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
						</template>
						<template v-if="item.label === 'Operator'" #default="scope">
            <el-button type="primary" size="small" @click="read(scope.row)">Read</el-button>
            <el-button type="primary" size="small" @click="unread(scope.row)">Unread</el-button>
          </template>
					</el-table-column>
			</el-table>
		</div>
	</div>

</template>

<script  setup>
import { onMounted, onUnmounted, reactive, ref} from 'vue'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import  {export_json_to_excel}  from '@/components/Export2Excel'

const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const isLoading = ref(false)
const MsiApi = ApiFunc()
const ocppErrorData = reactive([])
const ocppErrorTabel = [    
                        {label:'Level', value:'level', width:'5'}, 
                        {label:'EVSE ID', value:'evse_id', width:'10'},
                        {label:'Error Code', value:'ocpp_errorCode', width:'10'},
                        {label:'Status', value:'ocpp_status', width:'6'},
                        {label:'Vendor', value:'vendorId', width:'5'},
                        {label:'VendorErrorCode', value:'vendorErrorCode', width:'10'},
                        {label:'Created Time', value:'created_date',width:'12'},
                        {label:'Read', value:'read',width:'5'},
                        {label:'Operator', value:'',width:'15'},
                        ]

const read = async (row) => {
  let sendData = { 'class' : 'EVSEOCPPLogs', 'pk': row._id, 'read' : true}
  await MsiApi.setCollectionData('patch', 'cpo', sendData)
  getEVSEOCPPLogs()
}

const unread = async (row) => {
  let sendData = { 'class' : 'EVSEOCPPLogs', 'pk': row._id, 'read' : false}
  await MsiApi.setCollectionData('patch', 'cpo', sendData)
  getEVSEOCPPLogs()
}

const getEVSEOCPPLogs = async() => {
  let jsonData = { "database":"CPO", "collection":"EVSEOCPPLogs", "query": {
		"$expr":{
      "$and" : [ { "$gte" : [ "$created_date", { "$dateFromString": {"dateString": select_time.value[0]}}] },
                 { "$lte" : [ "$created_date", { "$dateFromString": {"dateString": select_time.value[1]}}] }
                ]
    }
	}}
  isLoading.value = true
  let response = await MsiApi.mongoQuery(jsonData)

  if (response.status === 200) {
    console.log(response)
    ocppErrorData.splice(0, ocppErrorData.length)
    Object.assign(ocppErrorData, response.data.all)
  }
  else {
    console.log(response.data)
  }
  isLoading.value = false
}

const formatJson = (filterVal, jsonData) => {
  return jsonData.map(v => filterVal.map(j => v[j]))
}

const download = () => {
  const tHeader = ['level', 'evse_id', 'ocpp_errorCode', 'ocpp_status', 'vendorId', 'vendorErrorCode', 'created_date']
  const tableData = ocppErrorData
  const filterVal = ['level', 'evse_id', 'ocpp_errorCode', 'ocpp_status', 'vendorId', 'vendorErrorCode', 'created_date']
  const data = formatJson(filterVal, tableData)
  export_json_to_excel ({ header: tHeader, data: data, filename: 'OCPP Error' })
}

onMounted(() => {
  getEVSEOCPPLogs()
})

onUnmounted(() => {

})

</script>



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
}

</style>