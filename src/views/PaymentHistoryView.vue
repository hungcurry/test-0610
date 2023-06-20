<template>
  <div class="payment">  
    <div class="date-picker">    
        <el-date-picker v-model="defaultTime" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" 
        @change="select_date()" :default-time="defaultTime2"/>
        <el-checkbox v-model="parking_visible" label="Parking" size="large" />
        <el-checkbox v-model="charging_visible" label="Charging" size="large" />
    </div>
    <el-button class="download-btn" @click="download"> Download </el-button>
    
    <div class="payment-list">
      <el-table :data="PaymentData" style="width: 95%; height:95%" stripe size="large" :cell-style=msi.tb_cell  :header-cell-style=msi.tb_header_cell	
      v-loading = "isLoading" >
        <el-table-column label="Station" align="center">
          <el-table-column prop="location_name" label="Name" min-width="80" align="center"/>
          <el-table-column prop="evse_id" label="EVSE ID" min-width="60" align="center"/>
        </el-table-column>

        <el-table-column v-if="parking_visible" label="Parking" align="center">
          <el-table-column prop="parking_time" label="Used Time" min-width="40" align="center"/>
          <el-table-column prop="parking_price_str" label="Price" min-width="30" header-align="center" align="right"/>
          <el-table-column prop="parking_car_num_str" label="License Plate" min-width="40" align="center"/>
        </el-table-column>
        
        <el-table-column  v-if="charging_visible" label="Charging" align="center">
          <el-table-column prop="charge_time" label="Used Time" min-width="40" align="center"/> 
          <el-table-column prop="charge_energy_str" label="kWh" min-width="30"  header-align="center" align="right"/>
          <el-table-column prop="charge_price_str" label="Price" min-width="30" header-align="center" align="right"/>
        </el-table-column>
        <el-table-column prop="price_str" label="Total Price" min-width="45" header-align="center" align="right"/>
        <el-table-column prop="paymethod_str" label="Method" min-width="50" align="center" 	:filters="filters" :filter-method="filterTag"/>
        <el-table-column prop="created_date_str" label="Created Date" min-width="60" align="center" sortable/>
      </el-table>
    </div>
  </div>
</template>
  
<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/components/ApiFunc'
import { export_json_to_excel }  from '@/components/Export2Excel'
import msi from '@/assets/msi_style'
import moment from "moment"
import { useMStore } from "../stores/m_cloud";

const MStore = useMStore()
const MsiApi = ApiFunc()
const PaymentData = reactive([])
const now = new Date()
const isLoading = ref(false)
const parking_visible = ref (true)
const charging_visible = ref (true)

const defaultTime = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime2 = [ new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)] 
const filters = [{ text:'CREDIT', value:'CREDIT'}, { text:'RFID', value:'RFID'}, { text:'FREE', value:'FREE'},
                {text:'APPLE PAY', value:'APPLEPAY'}, {text:'GOOGLE PAY', value:'GOOGLEPAY'},{ text:'SAMSUNG PAY', value:'SAMSUNGPAY'},
]

const download = () => {
  const tHeader = [ 'Station Name', 'Station EVSE ID',  'Parking Used Time', ' Parking Price', 'Parking License Plate', 'Charge Used Time', 'Charge kWh', 'Charge Price', 
                    'Total Price', 'Method', 'Created Date',]
  const filterVal = [ 'location_name', 'evse_id', 'parking_time', 'parking_price_str', 'parking_car_num_str', 'charge_time', 'charge_energy_str', 
                      'charge_price_str', 'price_str', 'paymethod_str', 'created_date_str']
  const data = PaymentData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'PaymentHistory' })
}

const filterTag = (value, rowData) => {
  return rowData.paymethod.method === value
}

const select_date = async () => {
  let queryData = { "database":"CPO", "collection":"PaymentHistory", "query": {
    "$expr":{
      "$and" : [ { "$gte" : [ "$created_date", { "$dateFromString": {"dateString": defaultTime.value[0]}}] },
                 { "$lte" : [ "$created_date", { "$dateFromString": {"dateString": defaultTime.value[1]}}] }
                ]
    }
  }}
  const response = await MongoQurey(queryData)
  console.log(response)
}

const MongoQurey = async (queryData) => {
  isLoading.value = true
  const response = await MsiApi.mongoQuery(queryData)
  
  PaymentData.length = 0
  Object.assign(PaymentData, response.data.all)

  for (let i = 0; i < PaymentData.length; i++) {
    PaymentData[i].paymethod_str = PaymentData[i]?.paymethod?.method

    let localTime =  new Date( (new Date(PaymentData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    PaymentData[i].created_date_str = (moment(localTime).format("YYYY-MM-DD HH:mm:ss"))

    for ( let j = 0; j < PaymentData[i]?.operator_types?.length; j++) {
      if (PaymentData[i].operator_types[j].type === 'charge') {
        let time = moment.duration(PaymentData[i]?.operator_types?.[j]?.time, 'seconds')
        PaymentData[i].charge_time = moment( { h:time.hours(), m:time.minutes(), s:time.seconds()}).format('HH:mm:ss')
        PaymentData[i].charge_energy_str = PaymentData[i]?.operator_types[j]?.kwh
        PaymentData[i].charge_price_str =  PaymentData[i]?.operator_types[j]?.price.toLocaleString()
      }
      else if (PaymentData[i].operator_types[j].type === 'parking') {
        let time = moment.duration(PaymentData[i]?.operator_types?.[j]?.time, 'seconds')
        PaymentData[i].parking_time = moment( { h:time.hours(), m:time.minutes(), s:time.seconds()}).format('HH:mm:ss')
        PaymentData[i].parking_price_str = PaymentData[i]?.operator_types[j]?.price.toLocaleString()
        PaymentData[i].parking_car_num_str = PaymentData[i]?.operator_types[j]?.car_num
      }
    }
    PaymentData[i].price_str = PaymentData[i]?.price?.toLocaleString()
  }
  isLoading.value = false
  return response
}

onMounted( async() => {
  let queryData = { "database":"CPO", "collection":"PaymentHistory", "query": {
    "$expr":{
      "$and" : [ { "$gte" : [ "$created_date", { "$dateFromString": {"dateString": new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)}}] },
                ]
    }
  }}
  let res = await MongoQurey(queryData)
  console.log(res)
})

</script>
  
<style lang="scss">
  .payment {
    position: relative;
    width: 100%;
    height: 100%;
    .payment-list {
      width: calc(100% - 40px);
      height: calc(100% - 120px);
      top: 120px;
      left : 40px;
      position: absolute;
    }
  
    .download-btn {
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

    .date-picker {
      top: 40px;
      right : 300px;
      position: absolute;
  }
}

</style>