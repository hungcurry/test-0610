<script setup>
import * as echarts from 'echarts'
import ApiFunc from '@/composables/ApiFunc'
import SelectDropdown from '@/components/Input/SelectDropdown.vue'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMStore } from '@/stores/m_cloud'

const MStore = useMStore()
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
const station_count = ref(0)
const payment_method_obj = reactive({
  credit: 0,
  rfid: 0,
  free: 0,
  googlepay: 0,
  samsungpay: 0,
})
const charger_time = reactive({ hr: 0, min: 0, sec: 0 })
const parking_time = reactive({ hr: 0, min: 0, sec: 0 })

let ret_chart = null
let chart_inst = null
// selectDropdown
// const select_country = ref('Country')
// const select_city = ref('City')
// const select_station = ref('Station')

// const country_options = ref([
//   { value: 'Taiwan' },
//   { value: 'Japan' },
//   { value: 'South Korea' },
//   { value: 'Thailand' },
//   { value: 'Vietnam' },
// ])
// const city_options = ref([
//   { value: 'Taipei' },
//   { value: 'Kaohsiung' },
//   { value: 'Taichung' },
//   { value: 'Tainan' },
//   { value: 'Hsinchu' },
// ])
// const station_options = ref([
//   { value: 'Option1' },
//   { value: 'Option2' },
//   { value: 'Option3' },
//   { value: 'Option4' },
//   { value: 'Option5' },
// ])
const status_obj = reactive({ Available: 0, Charging: 0, Offline: 0, Error: 0})

const payment_method_option = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { y: 'bottom', x: 'left' },
  grid: { left: '2%', right: '3%', top: '3%', bottom: '5%', containLabel: true },
  xAxis: { type: 'value', boundaryGap: [0, 0.01] },
  yAxis: { type: 'category', data: ['Samsung Pay', 'Google Pay',  'Free', 'RFID', 'Credit Card'] },
  series: [{ type: 'bar', barWidth: '20%', data: [0, 0, 0, 0], color: "#92a9c4" },
  ]
}

const evse_status_option = reactive({
  tooltip: { trigger: 'item' },
  legend: {
    show: true,
    x: 'right',
    y: 'center',
    formatter: function (value) {
      return value + ' (' + status_obj[value] + ')'
    },
  },
  series: [
    {
      name: '',
      type: 'pie',
      radius: ['80%', '100%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      color: ['#537ebc', '#64bfae', '#b1b1b1', '#ef8879'],
      labelLine: { show: false },
      data: [
        { value: status_obj.Available, name: 'Available' },
        { value: status_obj.Charging, name: 'Charging' },
        { value: status_obj.Offline, name: 'Offline' },
        { value: status_obj.Error, name: 'Error' },
      ],
    },
  ],
  media: [
    {
      query: {
        maxWidth: 767,
      },
      option: {
        legend: {
          orient: 'vertical',
          top: '20%',
          bottom: '5%',
          left: '60%',
        },
        series: [
          {
            left: '0%',
            right: '30%',
            top: '5%',
            bottom: '5%',
          },
        ],
      },
    },
  ],
})
const location_type_option = reactive({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: {},
  grid: { left: '2%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: [''] },
  series: [
    {
      name: 'Hotel',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [320],
      color: '#566575',
    },
    {
      name: 'Restaurant',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [120],
      color: '#92a9c4',
    },
    {
      name: 'Mall',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [220],
      color: '#414c58',
    },
    {
      name: 'Super Market',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [150],
      color: '#7e8c9c',
    },
    {
      name: 'Parking Lot',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [820],
      color: '#90a9bf',
    },
    {
      name: 'Others',
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [820],
      color: '#baddf9',
    },
  ],
})

const power_times_option = reactive({
  tooltip: { trigger: 'axis' },
  legend: { data: ['Power (kWh)', 'Times'] },
  grid: { left: '2%', right: '5%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: 'Power (kWh)',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230, 210],
      color: '#94eadb',
    },
    {
      name: 'Times',
      type: 'line',
      stack: 'Total',
      data: [220, 182, 191, 234, 290, 330, 310],
      color: '#61a8d8',
    },
  ],
})

const goto_payment = () => {
  router.push({ name: 'payment' })
}

const date_select = async (select_time) => {
  const now = new Date()
  let select_time1 = null
  if (select_time === 'all') select_time1 = new Date(1970, 1, 1)
  else if (select_time === 'today')
    select_time1 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  else if (select_time === 'week')
    select_time1 = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    )
  else if (select_time === 'month')
    select_time1 = new Date(now.getFullYear(), now.getMonth())
  queryTotalUsedTime(select_time1)
  queryTotalUsedTimes(select_time1)
  queryTotalUsedPower(select_time1)
}

const queryTotalUsedPower = async (select_time1) => {
  totalkwh.value = 0
  if (select_time1 === undefined) select_time1 = new Date(1970, 1, 1)
  let queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  '$last_updated',
                  { $dateFromString: { dateString: select_time1 } },
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: null, totalkwh: { $sum: '$kwh' } } },
    ],
  }
  let response = await MsiApi.mongoAggregate(queryData)
  if (parseInt(response?.data?.result?.[0]?.totalkwh)) {
    totalkwh.value = parseInt(response?.data?.result?.[0]?.totalkwh)
    totalkwh.value = totalkwh.value / 1000
  }
}

const queryTotalUsedTime = async (select_time1) => {
  parking_time.sec = parking_time.hr = parking_time.min = 0
  charger_time.sec = charger_time.hr = charger_time.min = 0
  if (select_time1 === undefined) select_time1 = new Date(1970, 1, 1)
  let queryData = {
    database: 'CPO',
    collection: 'PaymentHistory',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  '$created_date',
                  { $dateFromString: { dateString: select_time1 } },
                ],
              },
            ],
          },
        },
      },
      { $project: { _id: 0, operator_types: 1 } },
    ],
  }

  let response = await MsiApi.mongoAggregate(queryData)

  for (let i = 0; i < response?.data?.result?.length; i++) {
    for (let j = 0; j < response.data.result[i]?.operator_types?.length; j++) {
      if (response.data.result[i]?.operator_types[j]?.type === 'charge') {
        charger_time.sec =
          charger_time.sec + response.data.result[i]?.operator_types[j]?.time
      } else {
        parking_time.sec =
          parking_time.sec + response.data.result[i]?.operator_types[j]?.time
      }
    }
  }
  charger_time.min = charger_time.sec / 60
  charger_time.hr = parseInt(charger_time.min / 60)
  charger_time.min = parseInt(charger_time.min % 60)
  parking_time.min = parking_time.sec / 60
  parking_time.hr = parseInt(parking_time.min / 60)
  parking_time.min = parseInt(parking_time.min % 60)
}

const queryTotalUsedTimes = async (select_time1) => {
  rfid.value = visitor.value = income.value = ev_life.value = 0
  payment_method_obj.credit = payment_method_obj.rfid = payment_method_obj.applepay = payment_method_obj.googlepay = payment_method_obj.samsungpay = payment_method_obj.free = 0

  if (select_time1 === undefined) select_time1 = new Date(1970, 1, 1)
  let queryData = {
    database: 'CPO',
    collection: 'PaymentHistory',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  '$created_date',
                  { $dateFromString: { dateString: select_time1 } },
                ],
              },
            ],
          },
        },
      },
      {
        $facet: {
          guestEmail: [
            { $match: { guestEmail: { $ne: null } } },
            { $count: 'guestEmail' },
          ],
          RFID: [{ $match: { 'paymethod.method': 'RFID' } }, { $count: 'RFID' }],
          CREDIT: [{ $match: { 'paymethod.method': 'CREDIT' } }, { $count: 'CREDIT' }],
          FREE: [{ $match: { 'paymethod.method': 'FREE' } }, { $count: 'FREE' }],
          APPLEPAY: [
            { $match: { 'paymethod.method': 'APPLEPAY' } },
            { $count: 'APPLEPAY' },
          ],
          SAMSUNGPAY: [
            { $match: { 'paymethod.method': 'SAMSUNGPAY' } },
            { $count: 'SAMSUNGPAY' },
          ],
          GOOGLEPAY: [
            { $match: { 'paymethod.method': 'GOOGLEPAY' } },
            { $count: 'GOOGLEPAY' },
          ],
          totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
          income: [{ $group: { _id: null, income: { $sum: '$price' } } }],
        },
      },
    ],
  }
  let response = await MsiApi.mongoAggregate(queryData)

  if (typeof response.data.result[0].RFID[0]?.RFID === 'number')
    rfid.value = response.data.result[0].RFID[0]?.RFID
  if (typeof response.data.result[0].guestEmail[0]?.guestEmail === 'number')
    visitor.value = response.data.result[0].guestEmail[0]?.guestEmail
  if (typeof response.data.result[0].totalCount[0]?.totalCount === 'number')
    ev_life.value =
      response.data.result[0].totalCount[0]?.totalCount - rfid.value - visitor.value
  if (typeof response.data.result[0].income[0]?.income === 'number')
    income.value = response.data.result[0].income[0]?.income.toLocaleString()

  payment_method_obj.credit = response.data.result[0].CREDIT[0]?.CREDIT
  payment_method_obj.rfid = response.data.result[0].RFID[0]?.RFID
  payment_method_obj.applepay = response.data.result[0].APPLEPAY[0]?.APPLEPAY
  payment_method_obj.googlepay = response.data.result[0].GOOGLEPAY[0]?.GOOGLEPAY
  payment_method_obj.samsungpay = response.data.result[0].SAMSUNGPAY[0]?.SAMSUNGPAY
  payment_method_obj.free = response.data.result[0].FREE[0]?.FREE

  ret_chart = ref_payment_chart.value

  payment_method_option.series[0].data = [
    payment_method_obj.samsungpay,
    payment_method_obj.googlepay,
    payment_method_obj.free,
    payment_method_obj.rfid,
    payment_method_obj.credit,
  ]
  echarts.dispose(ret_chart)
  chart_inst = echarts.init(ret_chart)
  payment_method_option && chart_inst.setOption(payment_method_option)
}

onMounted(async () => {
  queryTotalUsedTimes()
  queryTotalUsedPower()
  queryTotalUsedTime()

  let queryData = {
    database: 'OCPI',
    collection: 'EVSE',
    pipelines: [
      {
        $facet: {
          AVAILABLE: [{ $match: { status: 'AVAILABLE' } }, { $count: 'AVAILABLE' }],
          UNKNOWN: [{ $match: { status: 'UNKNOWN' } }, { $count: 'UNKNOWN' }],
          CHARGING: [{ $match: { status: 'CHARGING' } }, { $count: 'CHARGING' }],
          OUTOFORDER: [{ $match: { status: 'OUTOFORDER' } }, { $count: 'OUTOFORDER' }],
          totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
        },
      },
    ],
  }
  let response = await MsiApi.mongoAggregate(queryData)
  status_obj.total = status_obj.Available = status_obj.Offline = status_obj.Charging = status_obj.Error = 0

  if (response.data.result[0]?.totalCount?.[0]?.totalCount)
    status_obj.total = response.data.result[0].totalCount?.[0]?.totalCount
  if (response.data.result[0]?.AVAILABLE[0]?.AVAILABLE)
    status_obj.Available = response.data.result[0].AVAILABLE[0]?.AVAILABLE
  if (response.data.result[0]?.CHARGING[0]?.CHARGING)
    status_obj.Charging = response.data.result[0].CHARGING[0]?.CHARGING
  if (response.data.result[0]?.UNKNOWN[0]?.UNKNOWN)
    status_obj.Offline = response.data.result[0].UNKNOWN[0]?.UNKNOWN
  if (response.data.result[0]?.OUTOFORDER[0]?.OUTOFORDER)
    status_obj.Error = response.data.result[0].OUTOFORDER[0]?.OUTOFORDER

  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 0, evses: 1, name: 1, id: 1 } }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  let locationData = response.data.result
  queryData = {
    database: 'OCPI',
    collection: 'EVSE',
    pipelines: [
      {
        $match: {
          $or: [{ status: { $eq: 'UNKNOWN' } }, { status: { $eq: 'OUTOFORDER' } }],
        },
      },
      { $project: { _id: 1, status: 1 } },
    ],
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
      if (EvseData[i].locationName) break
    }
  }

  for (let i = 0; i < EvseData.length; i++) {
    const index = error_evse.findIndex((obj) => obj.id === EvseData[i].locationId)
    if (index !== -1) {
      if (EvseData[i].status === 'UNKNOWN') error_evse[index].unknown_count += 1
      else if (EvseData[i].status === 'OUTOFORDER') error_evse[index].error_count += 1
    } else {
      if (EvseData[i].status === 'UNKNOWN')
        if (import.meta.env.VITE_BASE_URL !== undefined)
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 0,
            unknown_count: 1,
            url:
              import.meta.env.VITE_BASE_URL +
              '/stationDetail?id=' +
              EvseData[i].locationId,
          })
        else
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 0,
            unknown_count: 1,
            url: '/stationDetail?id=' + EvseData[i].locationId,
          })
      else if (EvseData[i].status === 'OUTOFORDER')
        if (import.meta.env.VITE_BASE_URL !== undefined)
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 1,
            unknown_count: 0,
            url:
              import.meta.env.VITE_BASE_URL +
              '/stationDetail?id=' +
              EvseData[i].locationId,
          })
        else
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 1,
            unknown_count: 0,
            url: '/stationDetail?id=' + EvseData[i].locationId,
          })
    }
  }
  for (let i = 0; i < error_evse.length; i++) {
    if (error_evse[i].name === undefined) {
      error_evse[i].name = 'Unpaired'
      if (import.meta.env.VITE_BASE_URL !== undefined)
        error_evse[i].url = import.meta.env.VITE_BASE_URL + '/evse?page=unpaired'
      else error_evse[i].url = '/evse?page=unpaired'
      break
    }
  }

  queryData = {
    database: 'CPO',
    collection: 'UserData',
    pipelines: [{ $count: 'memberCount' }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  if(response?.data?.result?.[0]?.memberCount)
    member.value = response?.data?.result?.[0]?.memberCount

  queryData = {
    database: 'CPO',
    collection: 'CompanyInformation',
    pipelines: [{ $count: 'companyCount' }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  business.value = response?.data?.result?.[0]?.companyCount

  let ret_chart = null
  let chart_inst = null

  ret_chart = ref_location_type.value

  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 0 } }],
  }

  response = await MsiApi.mongoAggregate(queryData)
  station_count.value = response?.data?.result?.length

  let facilities = {
    hotel: 0,
    restaurant: 0,
    mall: 0,
    super_market: 0,
    parking_lot: 0,
    others: 0,
  }

  for (let i = 0; i < response?.data?.result?.length; i++) {
    if (response?.data?.result?.[i]?.facilities?.[0] === 'HOTEL') {
      facilities.hotel++
    } else if (response?.data?.result?.[i]?.facilities?.[0] === 'RESTAURANT') {
      facilities.restaurant++
    } else if (response?.data?.result?.[i]?.facilities?.[0] === 'MALL') {
      facilities.mall++
    } else if (response?.data?.result?.[i]?.facilities?.[0] === 'SUPERMARKET') {
      facilities.super_market++
    } else if (response?.data?.result?.[i]?.facilities?.[0] === 'PARKING_LOT') {
      facilities.parking_lot++
    } else if (response?.data?.result?.[i]?.facilities?.[0] === 'WIFI') {
      facilities.others++
    }
  }
  location_type_option.series[0].data[0] = facilities.hotel
  location_type_option.series[1].data[0] = facilities.restaurant
  location_type_option.series[2].data[0] = facilities.mall
  location_type_option.series[3].data[0] = facilities.super_market
  location_type_option.series[4].data[0] = facilities.parking_lot
  location_type_option.series[5].data[0] = facilities.others

  chart_inst = echarts.init(ret_chart)
  location_type_option && chart_inst.setOption(location_type_option)

  ret_chart = ref_power_time.value
  queryData = {
    database: 'CPO',
    collection: 'CompanyInformation',
    pipelines: [{ $count: 'companyCount' }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  business.value = response.data.result[0].companyCount

  const now = new Date()
  let today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let date0 = new Date(today.getTime() - 0 * 24 * 60 * 60 * 1000)
  let date1 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
  let date2 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
  let date3 = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
  let date4 = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)
  let date5 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
  let date6 = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
  let date7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  let use_power_time_obj = {
    date1: { power: 0, times: 0 },
    date2: { power: 0, times: 0 },
    date3: { power: 0, times: 0 },
    date4: { power: 0, times: 0 },
    date5: { power: 0, times: 0 },
    date6: { power: 0, times: 0 },
    date7: { power: 0, times: 0 },
  }

  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date7 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date6 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date7.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date7.power += response.data.result[i].kwh
  }

  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date6 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date5 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date6.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date6.power += response.data.result[i].kwh
  }

  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date5 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date4 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date5.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date5.power += response.data.result[i].kwh
  }
  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date4 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date3 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date4.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date4.power += response.data.result[i].kwh
  }
  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date3 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date2 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date3.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date3.power += response.data.result[i].kwh
  }
  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date2 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date1 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)

  use_power_time_obj.date2.times = response.data.result.length
  for (let i = 0; i < response.data.result.length; i++) {
    use_power_time_obj.date2.power += response.data.result[i].kwh
  }
  queryData = {
    database: 'OCPI',
    collection: 'Session',
    pipelines: [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$start_date_time', { $dateFromString: { dateString: date1 } }] },
              { $lt: ['$end_date_time', { $dateFromString: { dateString: date0 } }] },
            ],
          },
        },
      },
      { $project: { _id: 0, kwh: 1 } },
    ],
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

  power_times_option.xAxis.data[6] =
    new Date(date1).getMonth() +
    1 +
    '/' +
    new Date(date1).getDate() +
    '(' +
    new Date(date1).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[5] =
    new Date(date2).getMonth() +
    1 +
    '/' +
    new Date(date2).getDate() +
    '(' +
    new Date(date2).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[4] =
    new Date(date3).getMonth() +
    1 +
    '/' +
    new Date(date3).getDate() +
    '(' +
    new Date(date3).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[3] =
    new Date(date4).getMonth() +
    1 +
    '/' +
    new Date(date4).getDate() +
    '(' +
    new Date(date4).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[2] =
    new Date(date5).getMonth() +
    1 +
    '/' +
    new Date(date5).getDate() +
    '(' +
    new Date(date5).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[1] =
    new Date(date6).getMonth() +
    1 +
    '/' +
    new Date(date6).getDate() +
    '(' +
    new Date(date6).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'
  power_times_option.xAxis.data[0] =
    new Date(date7).getMonth() +
    1 +
    '/' +
    new Date(date7).getDate() +
    '(' +
    new Date(date7).toLocaleDateString('en-US', { weekday: 'short' }) +
    '.)'

  chart_inst = echarts.init(ret_chart)
  power_times_option && chart_inst.setOption(power_times_option)

  ret_chart = ref_evse_status.value
  evse_status_option.series[0].data = [
    { value: status_obj.Available, name: 'Available' },
    { value: status_obj.Charging, name: 'Charging' },
    { value: status_obj.Offline, name: 'Offline' },
    { value: status_obj.Error, name: 'Error' },
  ]
  chart_inst = echarts.init(ret_chart)

  evse_status_option && chart_inst.setOption(evse_status_option)

  window.addEventListener('resize', () => {
    chart_inst.resize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => chart_inst.resize())
})
</script>

<template>
  <div class="dashboard">
    <div class="container lg mb-36px">
      <!-- <div
        class="selectDropdown md:flex md:flex-nowrap justify-center lg:justify-start pt-40px"
      >
        <SelectDropdown
          v-model="select_country"
          :data="country_options"
          class="Country select mr-8px lg:mr-32px mb-20px md:mb-0"
        >
          <img
            class="w-20px mr-8px"
            src="@/assets/img/dashboard_dropdown_area.png"
            alt=""
          />
        </SelectDropdown>

        <SelectDropdown
          v-model="select_city"
          :data="city_options"
          class="City select mr-8px lg:mr-32px mb-20px md:mb-0"
        >
          <img
            class="w-20px mr-8px"
            src="@/assets/img/dashboard_dropdown_location.png"
            alt=""
          />
        </SelectDropdown>

        <SelectDropdown
          v-model="select_station"
          :data="station_options"
          class="Station select mb-10px md:mb-0"
        >
          <img
            class="w-20px mr-8px"
            src="@/assets/img/dashboard_dropdown_station.png"
            alt=""
          />
        </SelectDropdown>
      </div> -->

      <p class="m-0 text-20px text-blue-1200 py-20px text-center">Real-time Status</p>
      <el-row class="realtimeStatus" :gutter="30">
        <el-col class="mb-24px lg:mb-0" :xs="24" :md="12">
          <div class="evse-status">
            <el-card class="text-20px text-blue-1200 border-0 box-shadow" shadow="always">
              <div class="lg:flex justify-between h-full">
                <div class="flex-shrink-0">
                  <div class="evse-title flex items-center pb-16px md:pb-20px">
                    <img
                      src="@/assets/img/dashboard_title_status.png"
                      alt="dashboard_title_status"
                    />
                    <p class="text-blue-1200 text-22px ml-8px">EVSE Status</p>
                  </div>
                  <div class="evse-text w-full">
                    <p class="text-secondary mb-4">
                      <span class="text-32px mr-4">{{ station_count }}</span>Stations
                    </p>
                    <p class="text-secondary mb-4">
                      <span class="text-32px mr-4">{{ status_obj.total }}</span>EVSEs
                    </p>
                  </div>
                </div>

                <div
                  class="evse-status-container scrollbar pb-4 overflow-x-auto flex-grow"
                >
                  <div ref="ref_evse_status" class="evse-status-chart"></div>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="evse-notification">
            <el-card class="text-20px text-blue-1200 border-0 box-shadow" shadow="always">
              <div class="evse-title flex items-center pb-16px md:pb-20px">
                <img
                  src="@/assets/img/dashboard_title_error.png"
                  alt="dashboard_title_error"
                />
                <p class="text-blue-1200 text-22px ml-8px">EVSE Offline / Error Status</p>
              </div>
              <div class="evse-notification-container scrollbar">
                <p class="mb-4" v-for="value in error_evse" :key="value">
                  <a class="text-black" :href="value.url"> {{ value.name + ' ' }}</a>
                  <!-- <span class="name" @click="aaa">{{value.name }}</span> -->
                  <span class="text-Offline-2 mr-2">{{
                    '(' + value.unknown_count + ')'
                  }}</span>
                  <span class="text-Error mr-2">{{ '(' + value.error_count + ')' }}</span>
                  <br />
                </p>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
    <!-- ------------------------------------- -->
    <div class="container md pb-20px bg-blue-100">
      <p class="m-0 text-20px text-blue-1200 pt-20px pb-24px text-center">
        Analysis Dashboard
      </p>
      <div class="pb-24px">
        <div class="scrollbar overflow-x-auto">
          <div class="date pb-6 flex xl-justify-center">
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('all')"
            >
              All
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('today')"
            >
              Today
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('week')"
            >
              This Week
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('month')"
            >
              This Month</el-button
            >
          </div>
        </div>
      </div>
      <div class="card-container scrollbar lg:px-20px overflow-x-auto">
        <div class="card grid grid-cols-4 grid-rows-3 gap-24px pb-24px">
          <div class="use-time flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_time.png"
                alt="dashboard_title_time"
              />
              <p class="text-blue-1200 text-22px ml-8px">
                Total Used Time (Charging / Parking)
              </p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="total-use-time">
                {{ charger_time.hr }} <span class="text-24px mr-8px">hr</span>
                {{ charger_time.min }} <span class="text-24px mr-8px">min</span>
                <span class="text-24px ml-8px">/</span>
                {{ parking_time.hr }} <span class="text-24px mr-8px">hr</span>
                {{ parking_time.min }} <span class="text-24px mr-8px">min</span>
              </div>
            </div>
          </div>
          <div class="amount flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon
                class="w-24px h-24px"
                icon="fa-regular fa-calendar-check"
              />
              <p class="text-blue-1200 text-22px ml-8px">Total Used Times</p>
            </div>
            <div
              class="card-body flex-center h-full text-40px md:text-60px justify-evenly"
            >
              <div>
                <p class="value">{{ ev_life }}</p>
                <p class="title">EV-Life</p>
              </div>
              <div>
                <p class="value">{{ rfid }}</p>
                <p class="title">RFID</p>
              </div>
              <div>
                <p class="value">{{ visitor }}</p>
                <p class="title">QR-Pay</p>
              </div>
            </div>
          </div>
          <div class="income flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-solid fa-coins" />
              <p class="text-blue-1200 text-22px ml-8px">Income</p>
              <el-button v-if="company === 'MSI'" class="ellipsis" @click="goto_payment">
                <font-awesome-icon icon="fa-solid fa-ellipsis"
              /></el-button>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="income">
                <span class="text-24px mr-8px">$</span>
                {{ income }}
                <span class="text-24px mr-8px">TWD</span>
              </div>
            </div>
          </div>
          <div class="use-power flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_amount.png"
                alt="dashboard_title_amount"
              />
              <p class="text-blue-1200 text-22px ml-8px">Total Used Power</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="total-use-time">
                {{ totalkwh }}
                <span class="text-24px mr-8px">kWh</span>
              </div>
            </div>
          </div>
          <div class="customers flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-regular fa-user" />
              <p class="text-blue-1200 text-22px ml-8px" style="white-space:nowrap">Customers <span style="font-size: 21px;"> {{'(From data created until now)'}} </span></p>
            </div>
            <div
              class="card-body flex-center h-full text-40px md:text-60px justify-evenly"
            >
              <div>
                <p class="value">{{ member }}</p>
                <p class="title" v-if="company === 'MSI'">Member</p>
                <p class="title" v-else>RFID User</p>
              </div>
              <div v-if="company === 'MSI'" class="business">
                <p class="value">{{ business }}</p>
                <p class="title">CPO</p>
              </div>
            </div>
          </div>
          <div class="location-type flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_locationtype.png"
                alt="dashboard_title_locationtype"
              />
              <p class="text-blue-1200 text-22px ml-8px" style="white-space:nowrap" >Station Type of Usage {{'(From data created until now)'}}</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div ref="ref_location_type" class="location-type"></div>
            </div>
          </div>
          <div class="power-time flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_power.png"
                alt="dashboard_title_power"
              />
              <p class="text-blue-1200 text-22px ml-8px">Used Power & Times (Last 7 days)</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div ref="ref_power_time" class="power-time flex-grow"></div>
            </div>
          </div>
          <div class="payment-method flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-regular fa-credit-card" />
              <p class="text-blue-1200 text-22px ml-8px">Payment Method</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div ref="ref_payment_chart" class="payment-chart"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  :deep(.el-input__wrapper) {
    background-color: var(--blue-1200);
    border: 0;
    border-radius: 2rem;
  }
  :deep(.el-input__inner::placeholder) {
    color: var(--white);
    font-size: 1.8rem;
  }
  :deep(.el-select__caret) {
    color: var(--white);
  }
}
.realtimeStatus {
  .el-card {
    --el-card-padding: 1.6rem;
    height: 100%;
    background-color: var(--blue-100);
    border-radius: 1rem;
  }
  .el-card__body {
    padding: var(--el-card-padding);
  }
  .evse-status {
    height: 100%;
    &-container {
    }
    &-chart {
      width: 100%;
      min-width: 34rem;
      height: 14.5rem;
      @media (min-width: 2000px) {
        min-width: initial;
        width: 50rem;
        margin: 0 auto;
      }
    }
  }
  .evse-notification {
    height: 100%;
    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
    }
    &-container {
      height: 11rem;
      overflow: auto;
      p {
        font-size: 2rem;
        color: #983636;
      }
    }
  }
}
.card {
  width: 184rem;
  margin: 0 auto;
  grid-template-rows: 18rem 18rem 1fr;
  grid-auto-columns: 20rem;
  grid-auto-rows: 20rem;
  .ellipsis {
    width: 30px;
    height: 30px;
    background-color: transparent;
    border-style: none;
  }
  .card-body {
    color: var(--blue-1200);
    .value {
      text-align: center;
      margin-bottom: 0.8rem;
    }
    .title {
      text-align: center;
      font-size: 1.6rem;
    }
    .payment-chart {
      width: 100%;
      height: 18rem;
    }
    .power-time {
      width: 100%;
      height: 100%;
    }
    .location-type {
      width: 100%;
      height: 11rem;
    }
  }
}
.scrollbar {
  &::-webkit-scrollbar {
    width: 0.8rem;
    height: 0.8rem;
  }
  &::-webkit-scrollbar-track,
  &::-webkit-scrollbar-corner {
    background-color: var(--blue-100);
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--blue-1000);
    border-radius: 2rem;
  }
}
// control bottom block scrollbar
.card-container {
  @media (min-width: 992px) {
    // height: calc(100vh - 50rem);
    height: calc(100vh - 47rem);
  }
}
</style>
