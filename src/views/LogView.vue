<template>
      <div class="log">
    <div class="date-picker">
      <el-date-picker v-model="select_time" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" :default-time="defaultTime" @change="select_date"/>
    </div>
    <el-button class="download" @click="download"> Download </el-button>


    <div class="log-list" >
      <el-table :data="logData" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell  :header-cell-style=msi.tb_header_cell size="large" v-loading = "isLoading">
        <el-table-column prop="time" label="Time" min-width="4" sortable/>
        <el-table-column prop="message" label="Message" min-width="30" sortable/>
      </el-table>
    </div>
</div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { useRoute, useRouter,onBeforeRouteUpdate } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import { InfluxDB } from '@influxdata/influxdb-client-browser'
import  {export_json_to_excel}  from '@/components/Export2Excel'
import msi from '@/assets/msi_style'

const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), 
                          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]

const logData = ref([])
let logConfig = { bucket:"CPO", includesArr:[], excludesArr:['currentTime','Heartbeat'], limit:5000, start:'-1d', end:'-0d' }
const INFLUX_ENV = {url: 'https://dev-evse.com/influxdb', token: 'TuoGR24Fr62ApVJTxb3tZ4wsJxW337KCNbIz-bhWg3pt3NNN7w0hBn7mgZZlIOyEShYgWs8PrzlwtTFWbWTTgQ=='}
const influxDB = new InfluxDB({ url: INFLUX_ENV.url , token: INFLUX_ENV.token})
const org = 'msi.com'
const queryApi = influxDB.getQueryApi(org)
const isLoading = ref(false)
const MsiApi = ApiFunc()

let env = import.meta.env.VITE_NAME
if (env === 'dev')
  bucket = "DEV"
let bucket = "CPO"

const select_date = () => {
    console.log(select_time.value[0] , select_time.value[1])
    getLog(select_time.value[0] , select_time.value[1])
}

const formatJson = (filterVal, jsonData) => {
  return jsonData.map(v => filterVal.map(j => v[j]))
}

const download = () =>{
  const tHeader = ['Time', 'Message']
  const tableData = logData.value
  const filterVal = ['time', 'message']
  const data = formatJson(filterVal, tableData)
  export_json_to_excel ({ header: tHeader, data: data, filename: 'Log' })
}

const getLog = async (SelectStartDate , SelectEndDate ) => {
  const Mode = MsiApi.getMode()
  if (Mode === 'api/api2') {
    bucket = "CPOTEST"
  }

  let now = new Date();
  let today = new Date (now.getFullYear(), now.getMonth(), now.getDate())
  let startTime = today.toISOString()
  let endTime = '-0d'
    
  if (SelectStartDate !== undefined) {
    startTime = Date.parse(SelectStartDate) / 1000
    endTime = Date.parse(SelectEndDate) / 1000
  }
  console.log(startTime)
  let fluxQuery = `import "strings"` + 
                `from(bucket: "` + bucket + `")` + 
                `|> range(start: ${startTime}, stop: ${endTime})` +
                `|> filter(fn: (r) => r["_measurement"] == "logging")` + `|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")` +
                '|> filter(fn: (r) => strings.containsStr(v: r.message, substr: "' + "currentTime" + '") == false)' + 
                '|> filter(fn: (r) => strings.containsStr(v: r.message, substr: "' + "Heartbeat" + '") == false)' + 
                '|> filter(fn: (r) => strings.containsStr(v: r.message, substr: "' + "TW*MSI*" + '") == true)' + 
                `|> group()` + `|> sort(columns: ["_time"], desc:true)` + `|> limit(n: 2000)` 


  const TempBuf = []
  
  isLoading.value = true
  queryApi.queryRows (fluxQuery, {next (row, tableMeta) {
    const o = tableMeta.toObject(row)
    const jsonData = Object()
    const Time = new Date(o._time);
    jsonData.time = Time.toLocaleString('zh-TW', {hourCycle:"h23"});
    jsonData.message = o.message
    TempBuf.push(jsonData)
  },
  error (error) {
    console.log('QUERY FAILED', error)
  },
  complete () {
    logData.value = TempBuf
    console.log(TempBuf.length)
    console.log(logData)
  }
  })
  isLoading.value = false

}





onMounted( async() => {

    await getLog()

})









</script>


<style lang="scss">
.log {
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