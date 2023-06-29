<template>
  <div class="dashboard">
    <!-- <div class="dashboard-select">
      <el-select v-model="select_country" class="location" placeholder="Country" size="large">
        <el-option v-for="country in country_options" :key="country.value" :label="country.label" :value="country.value" />
      </el-select>
      <select name="country" class="country" >
        <option value="">  City</option>
        <option value="taipei">Taipei</option>
      </select>
      <select name="station" class="country" >
        <option value="">  Station</option>
        <option value="taipei">MSI
        </option>
      </select>
    </div> -->
    <br>
    <br>
    <div class="dashboard-title">
      <p>Real-time Status</p>
    </div>

    <div class="real-time-container">
      <div class="evse-status">
        <el-card shadow="always">
          <p class="evse-status-title">EVSE Status</p>
          <div class="evse-status-container">
            <div>
              <p>{{ station_count }} Station</p>
              <p>{{ status_obj.total }} Chargers</p>
            </div>
            <div ref="ref_evse_status" class="evse-status-chart"></div>
          </div>
        </el-card>
      </div>

      <div class="evse-notification">
        <el-col>
          <el-card shadow="always">
            <p class="evse-notification-title">Offline / Error EVSE</p>
            <div class="evse-notification-container">
              <p v-for="value in error_evse" :key="value">
                <a :href=value.url > {{ value.name + ' ' }}</a>
                <!-- <span class="name" @click="aaa">{{value.name }}</span> -->
                <span class="offline_count">{{ '(' + value.unknown_count + ')'}}</span>
                <span class="error_count">{{ '(' + value.error_count + ')'}}</span>
                <br>
              </p>
            </div>
          </el-card>
        </el-col>
      </div>
    </div>

    <div class="analysis-container">
      <div class="title">
        <p>Analysis Dashboard</p>
      </div>
      <!-- <div class="date-container">
        <div class="date">
          <el-button class="date-btn" @click="date_select('all')"> All </el-button>
          <el-button class="date-btn" @click="date_select('today')"> Today </el-button>
          <el-button class="date-btn" @click="date_select('week')"> This Week </el-button>
          <el-button class="date-btn" @click="date_select('month')"> This Month</el-button>
          <el-button class="date-btn" @click="date_select('season')"> This Season</el-button>
          <el-button class="date-btn" @click="date_select('year')"> This Year</el-button>
        </div>
      </div> -->
      <div class="card">

        <div class="card-use-time">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span>Total Used Time (Charging / Parking)</span>
          </div>
          <div class="card-body">
            <div class="total-use-time"> {{ charger_time.hr + ' hr ' + charger_time.min + ' min / ' + parking_time.hr + 
            ' hr ' + parking_time.min + ' min'}}</div>
          </div>
        </div>

        <div class="card-customers">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-user" />
            <span>Customers</span>
          </div>
          <div class="card-body">
            <div class="member">
              <p class="value">{{ member }}</p>
              <p class="title">Member</p>
            </div>

            <div v-if="company === 'MSI'" class="business">
              <p class="value">{{ business }}</p>
              <p class="title">CPO</p>
            </div>
          </div>
        </div>

        <div class="card-income">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-solid fa-coins" />
            <span>Income</span>
            <el-button v-if="company === 'MSI'" class="ellipsis" @click="goto_payment"> <font-awesome-icon
                icon="fa-solid fa-ellipsis" /></el-button>
          </div>
          <div class="card-body">
            <div class="income"> TWD$ {{ income }} </div>
          </div>
        </div>

        <div class="card-use-power">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span>Total Used Power</span>
          </div>
          <div class="card-body">
            <div class="total-use-time"> {{ totalkwh }} kW </div>
          </div>
        </div>

        <div class="card-amount">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span> Total Used Times </span>
          </div>
          <div class="card-body">

            <div class="member">
              <p class="value">{{ ev_life }}</p>
              <p class="title">EV-Life</p>
            </div>

            <div class="member">
              <p class="value">{{ rfid }}</p>
              <p class="title">RFID</p>
            </div>

            <div class="member">
              <p class="value">{{ visitor }}</p>
              <p class="title">QR-Pay</p>
            </div>
<!-- 
            <p class="value">{{ ev_life }}</p>
            <p class="title">EV-Life</p>
            <p class="value">{{ rfid }}</p>
            <p class="title">RFID</p>
            <p class="value">{{ visitor }}</p>
            <p class="title">QR-Pay</p> -->
            <!-- <div class="total-use-time"> {{ ev_life + ' / ' + rfid + ' / ' + visitor }}</div> -->
          </div>
        </div>

        <div class="card-payment-method">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span>Payment Method</span>
          </div>
          <div class="card-body">
            <div ref="ref_payment_chart" class="payment-chart"></div>
          </div>
        </div>

        <div class="card-power-time">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span>Used Power & Times</span>
          </div>
          <div class="card-body">
            <div ref="ref_power_time" class="power-time"></div>
          </div>
        </div>

        <div class="card-location-type">
          <div class="card-header">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span>Station Type of Usage</span>
          </div>
          <div class="card-body">
            <div ref="ref_location_type" class="location-type"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import { useMStore } from "../stores/m_cloud"
const MStore = useMStore();
const company = MStore?.permission?.company?.name
const router = useRouter()
const MsiApi = ApiFunc()
const income = ref(0)

const error_evse = reactive([])
const ref_payment_chart = ref()
const ref_location_type = ref()
const ref_power_time = ref()
const ref_evse_status = ref()
const visitor = ref(0)
const ev_life = ref(0)
const rfid = ref(0)
const member = ref(0)
const business = ref(0)
const totalkwh = ref(0)

const charger_time = reactive({ hr: 0, min: 0, sec: 0 })
const parking_time = reactive({ hr: 0, min: 0, sec: 0 })

const goto_payment = () => {
  router.push({ name: 'paymentHistory' })
}

const payment_method_option = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { y: 'bottom', x: 'left' }, grid: { left: '2%', right: '3%', bottom: '10%', containLabel: true },
  xAxis: { type: 'value', boundaryGap: [0, 0.01] },
  yAxis: { type: 'category', data: ['SAMSUNG PAY', 'GOOGLE PAY', 'APPLE PAY', 'FREE', 'RFID', 'Credit Card'] },
  series: [{ type: 'bar', barWidth: '20%', data: [0, 0, 0, 0], color: "#92a9c4" },
    // { name: 'Parking', type: 'bar', barWidth:'20%', data: [19325, 23438, 31000], color: "#61a8d8" }
  ]
}

const location_type_option = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: {},
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: [''] },
  series: [
    { name: 'Hotel', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [320] },
    { name: 'Restaurant', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [120] },
    { name: 'Mall', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [220] },
    { name: 'Super Market', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [150] },
    // { name: 'Public transportation', type: 'bar', stack: 'total', label: { show: true}, emphasis: { focus: 'series'}, data: [820]},
    // { name: 'Fuel station', type: 'bar', stack: 'total', label: { show: true}, emphasis: { focus: 'series'}, data: [820]},
    { name: 'Parking lot', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [820] },
    { name: 'Others', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: [820] },
  ]
}

const power_times_option = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['Power', 'Times'] },
  grid: { left: '2%', right: '5%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  yAxis: { type: 'value' },
  series: [{ name: 'Power', type: 'line', stack: 'Total', data: [120, 132, 101, 134, 90, 230, 210] },
  { name: 'Times', type: 'line', stack: 'Total', data: [220, 182, 191, 234, 290, 330, 310] },
  ],
}

const status_obj = reactive({ Available: 0, Charging: 0, Offline: 0, Error: 0})
const evse_status_option = reactive({
  tooltip: { trigger: 'item' },
  legend: { show: true, orient: 'vertical', x: 'right', y: 'center',
    formatter: function (value) { return value + ' (' + status_obj[value] + ')'}
  },
  series: [{
    name: '', type: 'pie', radius: ['80%', '100%'],
    avoidLabelOverlap: false, label: { show: false, position: 'center' }, color: ['#537ebc', '#64bfae', '#b1b1b1', '#ef8879'],
    labelLine: { show: false },
    data: [{ value: status_obj.Available, name: 'Available' }, { value: status_obj.Charging, name: 'Charging' },
    { value: status_obj.Offline, name: 'Offline' }, { value: status_obj.Error, name: 'Error' }]
  }]
})

const payment_method_obj = reactive({ credit: 0, rfid: 0, free: 0, googlepay: 0, applepay: 0, samsungpay: 0,  })
const station_count = ref(0)
onMounted(async () => {

  let queryData = {
    "database": "OCPI", "collection": "EVSE", "pipelines": [
      {
        $facet: {
          AVAILABLE: [{ $match: { "status": 'AVAILABLE' } }, { $count: "AVAILABLE" }],
          UNKNOWN: [{ $match: { "status": 'UNKNOWN' } }, { $count: "UNKNOWN" }],
          CHARGING: [{ $match: { "status": 'CHARGING' } }, { $count: "CHARGING" }],
          OUTOFORDER: [{ $match: { "status": 'OUTOFORDER' } }, { $count: "OUTOFORDER" }],
          totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
        }
      }]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  console.log(response)  
  status_obj.total = status_obj.Available = status_obj.Offline = status_obj.Charging = status_obj.Error = 0

  if (response.data.result[0]?.totalCount?.[0]?.totalCount)
    status_obj.total = response.data.result[0].totalCount?.[0]?.totalCount
  if(response.data.result[0]?.AVAILABLE[0]?.AVAILABLE)
    status_obj.Available = response.data.result[0].AVAILABLE[0]?.AVAILABLE
  if(response.data.result[0]?.CHARGING[0]?.CHARGING)
    status_obj.Charging = response.data.result[0].CHARGING[0]?.CHARGING
  if(response.data.result[0]?.UNKNOWN[0]?.UNKNOWN)
    status_obj.Offline = response.data.result[0].UNKNOWN[0]?.UNKNOWN
  if(response.data.result[0]?.OUTOFORDER[0]?.OUTOFORDER)
    status_obj.Error = response.data.result[0].OUTOFORDER[0]?.OUTOFORDER
  
  queryData = { "database": "OCPI", "collection": "Location", "pipelines": [ { "$project": { "_id": 0, "evses": 1, "name": 1, "id": 1 } }]}
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result
  queryData = {
    "database": "OCPI", "collection": "EVSE", "pipelines": [
      { $match: { $or: [{ "status": { "$eq": 'UNKNOWN' } }, { "status": { "$eq": 'OUTOFORDER' } }] } },
      { "$project": { "_id": 1 , "status":1} }]
  }

  response = await MsiApi.mongoAggregate(queryData)
  let EvseData = response.data.result
  for (let i = 0; i < EvseData.length; i++) {
    for (let j = 0; j < locationData.length; j++) {
      for (let k = 0; k < locationData[j]?.evses?.length; k++) {
        if (EvseData[i]._id === locationData[j].evses[k]) {
          EvseData[i].locationName = locationData[j].name
          EvseData[i].locationId = locationData[j].id
          break
        }
      }
      if (EvseData[i].locationName)
        break
    }
  }

  for (let i = 0; i < EvseData.length; i++) {
    const index = error_evse.findIndex(obj=>obj.id === EvseData[i].locationId)
    if (index !== -1) {
      console.log(EvseData[i].status)
      if (EvseData[i].status === 'UNKNOWN')
        error_evse[index].unknown_count += 1
      else if (EvseData[i].status === 'OUTOFORDER')
        error_evse[index].error_count += 1
    }
    else{
      if (EvseData[i].status === 'UNKNOWN')
        if (import.meta.env.VITE_BASE_URL !== undefined)
          error_evse.push({name:EvseData[i].locationName, id: EvseData[i].locationId, error_count:0 ,unknown_count:1, url: import.meta.env.VITE_BASE_URL + '/stationDetail?id=' + EvseData[i].locationId})
        else
          error_evse.push({name:EvseData[i].locationName, id: EvseData[i].locationId, error_count:0 ,unknown_count:1, url: '/stationDetail?id=' + EvseData[i].locationId})
      else if (EvseData[i].status === 'OUTOFORDER')
        if (import.meta.env.VITE_BASE_URL !== undefined)
          error_evse.push({name:EvseData[i].locationName, id: EvseData[i].locationId, error_count:1 ,unknown_count:0, url: import.meta.env.VITE_BASE_URL + '/stationDetail?id=' + EvseData[i].locationId})        
        else
          error_evse.push({name:EvseData[i].locationName, id: EvseData[i].locationId, error_count:1 ,unknown_count:0, url: '/stationDetail?id=' + EvseData[i].locationId})        
    }
  }
  for(let i = 0; i < error_evse.length; i++) {
    if (error_evse[i].name === undefined) {
      error_evse[i].name = 'unpaired'
      if (import.meta.env.VITE_BASE_URL !== undefined)
        error_evse[i].url = import.meta.env.VITE_BASE_URL + '/evse?page=unpaired'
      else 
        error_evse[i].url = '/evse?page=unpaired'
      break
    }
  }

  queryData = { "database": "CPO", "collection": "PaymentHistory", "pipelines": [{
    $facet: {
      guestEmail: [{ $match: { "guestEmail": { "$ne": null } } }, { $count: "guestEmail" }],
      RFID: [{ $match: { "paymethod.method": 'RFID' } }, { $count: "RFID" }],
      CREDIT: [{ $match: { "paymethod.method": 'CREDIT' } }, { $count: "CREDIT" }],
      FREE: [{ $match: { "paymethod.method": 'FREE' } }, { $count: "FREE" }],
      APPLEPAY: [{ $match: { "paymethod.method": 'APPLEPAY' } }, { $count: "APPLEPAY" }],
      SAMSUNGPAY: [{ $match: { "paymethod.method": 'SAMSUNGPAY' } }, { $count: "SAMSUNGPAY" }],
      GOOGLEPAY: [{ $match: { "paymethod.method": 'GOOGLEPAY' } }, { $count: "GOOGLEPAY" }],
      totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
      income:[{ $group: { _id: null, income: { $sum: "$price" } } }]
    }
  }]}
  response = await MsiApi.mongoAggregate(queryData)
  payment_method_obj.credit = response.data.result[0].CREDIT[0]?.CREDIT
  payment_method_obj.rfid = response.data.result[0].RFID[0]?.RFID
  payment_method_obj.applepay = response.data.result[0].APPLEPAY[0]?.APPLEPAY
  payment_method_obj.googlepay = response.data.result[0].GOOGLEPAY[0]?.GOOGLEPAY
  payment_method_obj.samsungpay = response.data.result[0].SAMSUNGPAY[0]?.SAMSUNGPAY
  payment_method_obj.free = response.data.result[0].FREE[0]?.FREE

  // payment_method_obj.others = response.data.result[0].totalCount[0]?.totalCount - payment_method_obj.credit - payment_method_obj.rfid - payment_method_obj.free
  
  if (response.data.result[0].totalCount[0]?.totalCount - response.data.result[0].RFID[0]?.RFID - response.data.result[0].guestEmail[0]?.guestEmail)
    ev_life.value = response.data.result[0].totalCount[0]?.totalCount - response.data.result[0].RFID[0]?.RFID - response.data.result[0].guestEmail[0]?.guestEmail
  if (response.data.result[0].guestEmail[0]?.guestEmail)
    visitor.value = response.data.result[0].guestEmail[0]?.guestEmail
  if (response.data.result[0].RFID[0]?.RFID)
    rfid.value = response.data.result[0].RFID[0]?.RFID
  if (response.data.result[0].income[0]?.income.toLocaleString())
    income.value = response.data.result[0].income[0]?.income.toLocaleString()

  queryData = { "database": "CPO", "collection": "UserData", "pipelines": [ {$count: "memberCount"}]}
  response = await MsiApi.mongoAggregate(queryData)
  member.value = response?.data?.result?.[0]?.memberCount

  queryData = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ { $count: "companyCount"} ] }
  response = await MsiApi.mongoAggregate(queryData)
  business.value = response?.data?.result?.[0]?.companyCount

  queryData = { "database": "OCPI", "collection": "Session", "pipelines": [ { $group: { _id: null, totalkwh: { $sum: '$kwh' }, }}]}
  response = await MsiApi.mongoAggregate(queryData)
  if (parseInt(response?.data?.result?.[0]?.totalkwh)) {
    totalkwh.value = parseInt(response?.data?.result?.[0]?.totalkwh)
    totalkwh.value = totalkwh.value / 1000
  }

  // queryData = { "database": "CPO", "collection": "PaymentHistory", "pipelines": [ {
  //   $facet: {
      
  //     charging_time: [{ $match: { "operator_types.type": 'charge' } },
  //     {$group:{_id:null, total_time:{$sum:"$operator_types.time"}}} ],
      
  //     //  parking_time: [{ $match: { "operator_types.type": 'parking' } }, { $sum: "parking_time" }],
  //   }  
  // }] }
  // // { $group: { _id: null, totalkwh: { $sum: '$kwh' }, }}]}
  // response = await MsiApi.mongoAggregate(queryData)
  // console.log(response)


  queryData = { "database": "CPO", "collection": "PaymentHistory", "pipelines": [{ "$project": { "_id": 0, "operator_types": 1 } }]}
  response = await MsiApi.mongoAggregate(queryData)

  for (let i = 0; i < response?.data?.result?.length; i++) {
    for (let j = 0; j < response.data.result[i]?.operator_types?.length; j++) {
      if (response.data.result[i]?.operator_types[j]?.type === "charge") {
        charger_time.sec = charger_time.sec + response.data.result[i]?.operator_types[j]?.time
      }
      else {
        parking_time.sec = parking_time.sec + response.data.result[i]?.operator_types[j]?.time
      }
    }
  }
  charger_time.min = charger_time.sec / 60
  charger_time.hr = parseInt(charger_time.min / 60)
  charger_time.min = parseInt(charger_time.min % 60)

  parking_time.min = parking_time.sec / 60
  parking_time.hr = parseInt(parking_time.min / 60)
  parking_time.min = parseInt(parking_time.min % 60)

  let ret_chart = null
  let chart_inst = null

  ret_chart = ref_payment_chart.value

  payment_method_option.series[0].data = [payment_method_obj.samsungpay,payment_method_obj.googlepay,payment_method_obj.applepay, payment_method_obj.free, payment_method_obj.rfid, payment_method_obj.credit]
  chart_inst = echarts.init(ret_chart)
  payment_method_option && chart_inst.setOption(payment_method_option)

  ret_chart = ref_location_type.value

  queryData = {
    "database": "OCPI", "collection": "Location", "pipelines": [
      { "$project": { "_id": 0 } }
    ]
  }

  response = await MsiApi.mongoAggregate(queryData)
  station_count.value = response?.data?.result?.length

  let facilities = { hotel: 0, restaurant: 0, mall: 0, super_market: 0, parking_lot: 0, others: 0 }

  for (let i = 0; i < response?.data?.result?.length; i++) {
    if (response?.data?.result?.[i]?.facilities?.[0] === 'HOTEL') { facilities.hotel++ }
    else if (response?.data?.result?.[i]?.facilities?.[0] === 'RESTAURANT') { facilities.restaurant++ }
    else if (response?.data?.result?.[i]?.facilities?.[0] === 'MALL') { facilities.mall++ }
    else if (response?.data?.result?.[i]?.facilities?.[0] === 'SUPERMARKET') { facilities.super_market++ }
    // else if (response?.data?.result?.[i]?.facilities?.[0] === 'TAXI_STAND'){facilities.public_transportation++}
    // else if (response?.data?.result?.[i]?.facilities?.[0] === 'FUEL_STATION'){facilities.fuel_station++}
    else if (response?.data?.result?.[i]?.facilities?.[0] === 'PARKING_LOT') { facilities.parking_lot++ }
    else if (response?.data?.result?.[i]?.facilities?.[0] === 'WIFI') { facilities.others++ }
  }
  location_type_option.series[0].data[0] = facilities.hotel
  location_type_option.series[1].data[0] = facilities.restaurant
  location_type_option.series[2].data[0] = facilities.mall
  location_type_option.series[3].data[0] = facilities.super_market
  // location_type_option.series[4].data[0] = facilities.public_transportation
  // location_type_option.series[4].data[0] = facilities.fuel_station
  location_type_option.series[4].data[0] = facilities.parking_lot
  location_type_option.series[5].data[0] = facilities.others

  chart_inst = echarts.init(ret_chart)
  location_type_option && chart_inst.setOption(location_type_option)

  ret_chart = ref_power_time.value
  queryData = {
    "database": "CPO", "collection": "CompanyInformation", "pipelines": [
      { $count: "companyCount" }]
  }
  response = await MsiApi.mongoAggregate(queryData)
  business.value = response.data.result[0].companyCount

  const now = new Date()
  let today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let date0 = new Date(today.getTime() - (0 * 24 * 60 * 60 * 1000))
  let date1 = new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000))
  let date2 = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000))
  let date3 = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000))
  let date4 = new Date(today.getTime() - (4 * 24 * 60 * 60 * 1000))
  let date5 = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000))
  let date6 = new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000))
  let date7 = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))

  let use_power_time_obj = {
    date1: { power: 0, times: 0 }, date2: { power: 0, times: 0 }, date3: { power: 0, times: 0 },
    date4: { power: 0, times: 0 }, date5: { power: 0, times: 0 }, date6: { power: 0, times: 0 }, date7: { power: 0, times: 0 }
  }

  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date7 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date6 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date7.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date7.power += response.data.result[i].kwh
  }

  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date6 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date5 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date6.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date6.power += response.data.result[i].kwh
  }

  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date5 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date4 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date5.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date5.power += response.data.result[i].kwh
  }
  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date4 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date3 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date4.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date4.power += response.data.result[i].kwh
  }
  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date3 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date2 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date3.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date3.power += response.data.result[i].kwh
  }
  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date2 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date1 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date2.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date2.power += response.data.result[i].kwh
  }
  queryData = {
    "database": "OCPI", "collection": "Session", "pipelines": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": date1 } }] },
              { "$lt": ["$end_date_time", { "$dateFromString": { "dateString": date0 } }] }]
          }
        }
      },
      { "$project": { "_id": 0, "kwh": 1 } }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date1.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date1.power += response.data.result[i].kwh
  }
  power_times_option.series[0].data[0] = parseInt(use_power_time_obj.date7.power)
  power_times_option.series[0].data[1] = parseInt(use_power_time_obj.date6.power)
  power_times_option.series[0].data[2] = parseInt(use_power_time_obj.date5.power)
  power_times_option.series[0].data[3] = parseInt(use_power_time_obj.date4.power)
  power_times_option.series[0].data[4] = parseInt(use_power_time_obj.date3.power)
  power_times_option.series[0].data[5] = parseInt(use_power_time_obj.date2.power)
  power_times_option.series[0].data[6] = parseInt(use_power_time_obj.date1.power)

  power_times_option.series[1].data[0] = use_power_time_obj.date7.times
  power_times_option.series[1].data[1] = use_power_time_obj.date6.times
  power_times_option.series[1].data[2] = use_power_time_obj.date5.times
  power_times_option.series[1].data[3] = use_power_time_obj.date4.times
  power_times_option.series[1].data[4] = use_power_time_obj.date3.times
  power_times_option.series[1].data[5] = use_power_time_obj.date2.times
  power_times_option.series[1].data[6] = use_power_time_obj.date1.times

  power_times_option.xAxis.data[6] = new Date(date1).getMonth() + 1 + "/" + new Date(date1).getDate() + "(" + new Date(date1).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[5] = new Date(date2).getMonth() + 1 + "/" + new Date(date2).getDate() + "(" + new Date(date2).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[4] = new Date(date3).getMonth() + 1 + "/" + new Date(date3).getDate() + "(" + new Date(date3).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[3] = new Date(date4).getMonth() + 1 + "/" + new Date(date4).getDate() + "(" + new Date(date4).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[2] = new Date(date5).getMonth() + 1 + "/" + new Date(date5).getDate() + "(" + new Date(date5).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[1] = new Date(date6).getMonth() + 1 + "/" + new Date(date6).getDate() + "(" + new Date(date6).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"
  power_times_option.xAxis.data[0] = new Date(date7).getMonth() + 1 + "/" + new Date(date7).getDate() + "(" + new Date(date7).toLocaleDateString('en-US', { weekday: 'short' }) + ".)"


  chart_inst = echarts.init(ret_chart)
  power_times_option && chart_inst.setOption(power_times_option)

  ret_chart = ref_evse_status.value
  evse_status_option.series[0].data = [
    { value: status_obj.Available, name: 'Available' },
    { value: status_obj.Charging, name: 'Charging' },
    { value: status_obj.Offline, name: 'Offline' },
    { value: status_obj.Error, name: 'Error' },]
  chart_inst = echarts.init(ret_chart)

  evse_status_option && chart_inst.setOption(evse_status_option)
})

</script>


<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .dashboard-select {
    display: flex;
    flex-direction: row;
    margin-top: 40px;
    margin-left: 40px;

    .location {
      width: 250px;
      margin-right: 32px;
    }

    .country {
      width: 250px;
      margin-right: 32px;
    }

    .station {
      width: 250px;
      margin-right: 77px;
    }
  }

  .country {
    background: url('https://dev-evse.com/data/common/pic/2222.png') no-repeat 10px center;
    background-size: 22px 22px;
    padding-left: 35px;
    width: 250px;
    color: #ffffff;
    background-color: #414c58;
    border: 0px;
    border-radius: 20px;
    font-size: 18px;
  }

  :deep(.el-input__wrapper) {
    background-color: #414c58;
    border: 0px;
    border-radius: 20px;
  }

  :deep(.el-input__inner::placeholder) {
    color: #ffffff;
    font-size: 18px;
  }

  :deep(.el-select__caret) {
    color: #ffffff;
  }

  .dashboard-title {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: center;

    p {
      margin: -13px;
      font-size: 18px;
      color: #92a9c4;
    }
  }

  .real-time-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;

    .evse-status {
      margin-top: 20px;
      width: 900px;
      height: 180px;

      .evse-status-title {
        margin: 0px;
        font-size: 22px;
      }

      .evse-status-container {
        display: flex;
        flex-direction: row;

        p {
          font-size: 22px;
          color: #414C58;
        }
      }

      .el-card {
        margin-left: 20px;
        height: 180px;
        width: 95%;
        background-color: #f3f7fa;
      }

      .evse-status-chart {
        width: 400px;
        height: 120px;
      }
    }

    .evse-notification {
      margin-top: 20px;
      width: 900px;
      height: 180px;

      .el-card {
        margin-left: 20px;
        height: 180px;
        width: 95%;
        background-color: #f3f7fa;
      }

      .evse-notification-title {
        margin: 0px;
        font-size: 22px;
      }

      .evse-notification-container {
        height: 100px;
        overflow: auto;

        // display: flex;
        // flex-direction: row;
        p {
          // text-align: center;
          margin: 5px;
          font-size: 20px;
          color: #983636;
        }

        .name {
          color: #000000;
        }

        .offline_count{
          color: #b1b1b1;
        }
        .error_count{
          color: #ef8879;
        }
        a:link{color:#000000 }
        a:visited{color:#000000}
        a:hover{color:#000000}
        a:active{color:#000000}
        a {text-decoration: none;}
      }
    }
  }

  .analysis-container {
    background-color: #f3f7fa;
    height: 750px;
    margin-top: 20px;
    overflow: auto;

    .title {
      display: flex;
      flex-direction: row;
      width: 100%;
      justify-content: center;
    }

    .date-container {
      width: 100%;
    }

    .date {
      display: flex;
      flex-direction: row;
      justify-content: center;

      .date-btn {
        font-size: 22px;
      }
    }

    .card {
      height: 630px;
      width: 1620px;
      display: grid;
      margin-top: 28px;
      margin-left: 40px;
      // margin-bottom: 40px;
      row-gap: 26px;
      column-gap: 24px;
      grid-template-areas:
        "card-use-time card-use-time card-amount card-income"
        "card-use-power card-customers card-payment-method card-payment-method"
        "card-power-time card-power-time card-payment-method card-payment-method"
        "card-power-time card-power-time card-location-type card-location-type";

      // "card-customers card-customers  card-amount card-use-power card-income"
      // "card-location-type card-location-type card-payment-method card-payment-method card-payment-method"
      // "card-power-time card-power-time card-payment-method card-payment-method card-payment-method"
      // "card-power-time card-power-time card-use-time card-use-time card-use-time ";

      grid-auto-flow: row;

      .card-header {
        display: flex;
        align-items: center;
        height: 30px;
        font-size: 22px;
        margin: 12px 30px 0px 18px;

        .header-icon {
          margin-right: 10px;
        }
      }

      .card-body {
        height: 138px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .card-use-time {
        grid-area: card-use-time;
        background-color: #ffffff;
        display: flex;
        flex-direction: column;

        .total-use-time {
          text-align: center;
          font-size: 40px;
        }
      }

      .card-customers {
        grid-area: card-customers;
        background-color: #ffffff;

        .card-body {
          display: flex;
          flex-direction: row;

          .member {
            margin-right: 66px;
          }

          .business {
            margin-right: 66px;
          }

          .value {
            font-size: 40px;
            text-align: center;
            margin: 0 0 8px 0px;
          }

          .title {
            margin: 0;
            font-size: 16px;
            color: #414C58;
          }
        }

        .ellipsis {
          width: 30px;
          height: 30px;
          background-color: transparent;
          border-style: none;
        }
      }

      .card-income {
        grid-area: card-income;
        background-color: #ffffff;
        font-size: 40px;

        .ellipsis {
          width: 30px;
          height: 30px;
          background-color: transparent;
          border-style: none;
        }
      }

      .card-use-power {
        grid-area: card-use-power;
        background-color: #ffffff;
        font-size: 40px;
      }

      .card-amount {
        grid-area: card-amount;
        background-color: #ffffff;
        font-size: 40px;
        .card-body {
          display: flex;
          flex-direction: row;
          .member {
            margin-right: 66px;
          }
        .value {
            font-size: 40px;
            text-align: center;
            margin: 0 0 8px 0px;
          }

          .title {
            margin: 0;
            font-size: 16px;
            color: #414C58;
          }
        }
      }

      .card-payment-method {
        grid-area: card-payment-method;
        background-color: #ffffff;

        // width:600px;
        .ellipsis {
          width: 30px;
          height: 30px;
          background-color: transparent;
          border-style: none;
        }

        .payment-chart {
          width: 100%;
          height: 250px;
          overflow: hidden;
        }
      }

      .card-power-time {
        grid-area: card-power-time;
        background-color: #ffffff;

        .power-time {
          width: 100%;
          height: 100%;
        }
      }

      .card-location-type {
        grid-area: card-location-type;
        background-color: #ffffff;

        .location-type {
          width: 100%;
          height: 100%;
        }
      }
    }
  }
}</style>






