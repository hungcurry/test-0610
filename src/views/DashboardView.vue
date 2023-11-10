<script setup>
import * as echarts from 'echarts'
import ApiFunc from '@/composables/ApiFunc'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMStore } from '@/stores/m_cloud'
import Calendar from '@/components/icons/IconCalendar.vue'
import moment from "moment"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const company = MStore?.permission?.company?.name
const router = useRouter()
const MsiApi = ApiFunc()
const ref_payment_chart = ref()
const ref_location_type = ref()
const ref_power_time = ref()
const ref_evse_status = ref()
const error_evse = reactive([])
const income = ref(0)
const visitor = ref(0)
const ev_life = ref(0)
const rfid = ref(0)
const member = ref(0)
const business = ref(0)
const totalkwh = ref(0)
const station_count = ref(0)
const dropdownRef = ref()
const customize_start_time = ref()
const customize_end_time = ref()
const created_date = ref(moment((new Date(MStore.permission.company.created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000)).format('YYYY-MM-DD HH:mm:ss'))
let isKeepDatePicker = undefined
let isFetchingTotalUsedPower = false
let isFetchingTotalUsedTime = false
let isFetchingTotalUsedTimes = false

const selectCurrency = ref('')
const totalTWD = ref(0)
const CurrencyItem = [
  { value: 'TWD', label: 'TWD'},
  { value: 'USD', label: 'USD'},
  { value: 'CNY', label: 'CNY'},
  { value: 'JPY', label: 'JPY'},
  { value: 'EUR', label: 'EUR'},
]
const rate = reactive({})

let now = new Date()
const selectTime = ref([
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
])
const defaultTime = [
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
]

const charger_time = reactive({ hr: 0, min: 0, sec: 0 })
const parking_time = reactive({ hr: 0, min: 0, sec: 0 })
const status_obj = reactive({ Available: 0, Charging: 0, Offline: 0, Error: 0})
const payment_method_option = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { y: 'bottom', x: 'left' },
  grid: { left: '2%', right: '3%', top: '3%', bottom: '5%', containLabel: true },
  xAxis: { type: 'value', boundaryGap: [0, 0.01] },
  yAxis: { type: 'category', data: [t('samsung_pay'), t('google_pay'),  t('free'), t('rfid'), t('credit_card')] },
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
      return t(value.toLowerCase()) + ' (' + status_obj[value] + ')'
    },
  },
  series: [
    {
      name: '',
      type: 'pie',
      radius: ['80%', '100%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
        return t(params.name.toLowerCase()) + ' (' +  params.value + ')'
        }
      },
      color: ['#537ebc', '#64bfae', '#b1b1b1', '#ef8879'],
      labelLine: { show: false },
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
      name: t('hotel'),
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [320],
      color: '#566575',
    },
    {
      name: t('restaurant'),
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [120],
      color: '#92a9c4',
    },
    {
      name: t('mall'),
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [220],
      color: '#414c58',
    },
    {
      name: t('super_market'),
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [150],
      color: '#7e8c9c',
    },
    {
      name: t('parking_lot'),
      type: 'bar',
      stack: 'total',
      label: { show: true },
      emphasis: { focus: 'series' },
      data: [820],
      color: '#90a9bf',
    },
    {
      name: t('others'),
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
  legend: { data: [t('power_kwh'), t('times')] },
  grid: { left: '2%', right: '5%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: t('power_kwh'),
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230, 210],
      color: '#94eadb',
    },
    {
      name: t('times'),
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
const handleVisible = () => {
  if (isKeepDatePicker === true) {
    dropdownRef.value.handleOpen()
  }
  else if (isKeepDatePicker === false) {
    dropdownRef.value.handleClose()
    isKeepDatePicker = undefined
  }
}
const handleDatePicker = (event) => {
  if (event === 'focus') {
    dropdownRef.value.handleOpen()
    isKeepDatePicker = true
  }
  else if (event === 'blur') {
    dropdownRef.value.handleClose()
    isKeepDatePicker = false
  }
}
const select_date = async () => {
  isKeepDatePicker = false
  date_select('customize')
}
const date_select = async (select_time) => {
  let select_time1 = []
  now = new Date()
  if (select_time === 'all') {
    select_time1[0] = new Date(created_date.value)
    select_time1[1] = now
  }
  else if (select_time === 'today') {
    select_time1[0] = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    select_time1[1] = now
  }
  else if (select_time === 'week') {
    select_time1[0] = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    select_time1[1] = now
  }
  else if (select_time === 'month') {
    select_time1[0] = new Date(now.getFullYear(), now.getMonth())
    select_time1[1] = now
  }
  else if (select_time === 'customize') {
    select_time1[0] = new Date(selectTime.value[0].getTime())
    select_time1[1] = new Date(selectTime.value[1].getTime())
  }
  customize_start_time.value =  moment(select_time1[0]).format('YYYY-MM-DD HH:mm:ss')
  customize_end_time.value =  moment(select_time1[1]).format('YYYY-MM-DD HH:mm:ss')
  queryTotalUsedTime(select_time1)
  queryTotalUsedTimes(select_time1)
  queryTotalUsedPower(select_time1)
}

const queryTotalUsedPower = async (select_time1) => {
  if (!isFetchingTotalUsedPower) {
    isFetchingTotalUsedPower = true
    totalkwh.value = '-'
    if (select_time1 === undefined) {
      select_time1 = []
      select_time1[0] = new Date(created_date.value)
      select_time1[1] = now
    }
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
                    { $dateFromString: { dateString: select_time1[0] } },
                  ],
                },
                {
                  $lte: [
                    "$created_date",
                    { $dateFromString: { dateString: select_time1[1] } },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: { _id: 0, operator_types: 1} 
        }
      ],
    }
    let response = await MsiApi.mongoAggregate(queryData)
    let charge_kwh = 0
    response.data.result.forEach((item) => {
      item.operator_types.forEach( (operator_types) => {
        if (operator_types.type === 'charge') {
          charge_kwh += operator_types.kwh
        }
      })
    })
    totalkwh.value = parseInt(charge_kwh * 1000) / 1000
    isFetchingTotalUsedPower = false
  }
}

const queryTotalUsedTime = async (select_time1) => {
  if (!isFetchingTotalUsedTime) {
    parking_time.min = parking_time.hr = charger_time.min = charger_time.hr = '-'
    parking_time.sec = charger_time.sec = 0
    isFetchingTotalUsedTime = true 
    if (select_time1 === undefined) {
      select_time1 = []
      select_time1[0] = new Date(created_date.value)
      select_time1[1] = now
    }
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
                    { $dateFromString: { dateString: select_time1[0] } },
                  ],
                },
                {
                  $lte: [
                    "$created_date",
                    { $dateFromString: { dateString: select_time1[1] } },
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
          charger_time.sec += response.data.result[i]?.operator_types[j]?.time
        } else {
          parking_time.sec += response.data.result[i]?.operator_types[j]?.time
        }
      }
    }
    let duration = moment.duration(charger_time.sec, 'seconds')
    charger_time.hr = Math.floor(duration.asHours())
    charger_time.min = duration.minutes();

    duration = moment.duration(parking_time.sec, 'seconds')
    parking_time.hr = Math.floor(duration.asHours())
    parking_time.min = duration.minutes()
    isFetchingTotalUsedTime = false
  }
}

const queryTotalUsedTimes = async (select_time1) => {
  if (!isFetchingTotalUsedTimes) {
    isFetchingTotalUsedTimes = true
    rfid.value = visitor.value = income.value = ev_life.value = '-'

    if (select_time1 === undefined) {
      select_time1 = []
      select_time1[0] = new Date(created_date.value)
      select_time1[1] = now
    }
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
                    { $dateFromString: { dateString: select_time1[0] } },
                  ],
                },
                {
                  $lte: [
                    "$created_date",
                    { $dateFromString: { dateString: select_time1[1] } },
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
            income: [ { $match: { currency: { $in: [ "TWD", "USD", "CNY", "JPY", "EUR"] }}},
                      { $group: { _id: "$currency", total: { $sum: "$price" } } } 
                    ],
          },
        },
      ],
    }
    let response = await MsiApi.mongoAggregate(queryData)
    // let temp  =  await MsiApi.getTaiwanExchangeRate()
    // console.log(temp)
    // rate.CNY = temp.CNY
    // rate.EUR = temp.EUR
    // rate.JPY = temp.JPY
    // rate.USD = temp.USD
    rate.CNY = 4.33
    rate.EUR = 33.69
    rate.JPY = 0.2045
    rate.USD = 31.925

    rfid.value = visitor.value = ev_life.value = income.value = 0
    if (typeof response.data.result[0].RFID[0]?.RFID === 'number')
      rfid.value = response.data.result[0].RFID[0]?.RFID
    if (typeof response.data.result[0].guestEmail[0]?.guestEmail === 'number')
      visitor.value = response.data.result[0].guestEmail[0]?.guestEmail
    if (typeof response.data.result[0].totalCount[0]?.totalCount === 'number')
      ev_life.value = response.data.result[0].totalCount[0]?.totalCount - rfid.value - visitor.value
    if (response.data.result[0].income.length > 0) {
      totalTWD.value = 0
      for (let i = 0; i < response.data.result[0].income.length; i++){
        if (response.data.result[0].income[i]._id === 'USD') {
          totalTWD.value += response.data.result[0].income[i].total * rate.USD
        }
        if (response.data.result[0].income[i]._id === 'CNY') {
          totalTWD.value += response.data.result[0].income[i].total * rate.CNY
        }
        if (response.data.result[0].income[i]._id === 'TWD') {
          totalTWD.value +=  response.data.result[0].income[i].total * 1
        }
        if (response.data.result[0].income[i]._id === 'EUR') {
          totalTWD.value += response.data.result[0].income[i].total * rate.EUR
        }
        if (response.data.result[0].income[i]._id === 'JPY') {
          totalTWD.value += response.data.result[0].income[i].total * rate.JPY
        }
        queryData = {
          database: 'CPO',
          collection: 'CompanyInformation',
          pipelines: [{$project: { country: 1} },  ],
        }
        let response1 = await MsiApi.mongoAggregate(queryData)
        if (response1.data.result[0].country === "China")
          selectCurrency.value = 'CNY'
        else
          selectCurrency.value = 'TWD'
          currencyExchange()
      }
    }
    
    let payment_method_obj = {
      credit: 0,
      rfid: 0,
      free: 0,
      googlepay: 0,
      samsungpay: 0,
    }
    payment_method_obj.credit = response.data.result[0].CREDIT[0]?.CREDIT
    payment_method_obj.rfid = response.data.result[0].RFID[0]?.RFID
    payment_method_obj.googlepay = response.data.result[0].GOOGLEPAY[0]?.GOOGLEPAY
    payment_method_obj.samsungpay = response.data.result[0].SAMSUNGPAY[0]?.SAMSUNGPAY
    payment_method_obj.free = response.data.result[0].FREE[0]?.FREE

    payment_method_option.series[0].data = [
      payment_method_obj.samsungpay,
      payment_method_obj.googlepay,
      payment_method_obj.free,
      payment_method_obj.rfid,
      payment_method_obj.credit,
    ]
    
    if (echarts.getInstanceByDom(ref_payment_chart.value) !== undefined)
      echarts.dispose(ref_payment_chart.value)
    let payment_chart = echarts.init(ref_payment_chart.value)
    payment_method_option && payment_chart.setOption(payment_method_option)
    isFetchingTotalUsedTimes = false
  }
}

const currencyExchange = () => {
  let totalIncome = 0
  if (selectCurrency.value === 'USD')
    totalIncome = (totalTWD.value / rate.USD)
  if (selectCurrency.value === 'CNY')
    totalIncome = (totalTWD.value / rate.CNY)    
  if (selectCurrency.value === 'EUR')
    totalIncome = (totalTWD.value / rate.EUR)
  if (selectCurrency.value === 'JPY')
    totalIncome = (totalTWD.value / rate.JPY)
  if (selectCurrency.value === 'TWD')
    totalIncome = (totalTWD.value)
  income.value = parseFloat(totalIncome.toFixed(2)).toLocaleString()
}

const queryEvseStatus = async () => {
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
  evse_status_option.series[0].data = [
    { value: status_obj.Available, name: 'Available' },
    { value: status_obj.Charging, name: 'Charging' },
    { value: status_obj.Offline, name: 'Offline' },
    { value: status_obj.Error, name: 'Error' },
  ]
  let evse_status_chart = echarts.init(ref_evse_status.value)
  evse_status_option && evse_status_chart.setOption(evse_status_option)
}

const queryCustomers = async () => {
  let queryData = undefined
  let response = undefined
  if (MStore.permission.isMSI === true) {
    queryData = {
      database: 'CPO',
      collection: 'UserData',
      pipelines: [
        { $match: { $and: [
          { first_name: {$ne: 'DELETE'} },
          { last_name: {$ne: 'DELETE'} },
        ]}},
        { $count: 'memberCount' }
      ],
    }
  }
  else {
    queryData = {
      database: 'CPO',
      collection: 'RFIDUserData',
      pipelines: [
      { $match: { $and: [
        { tag_id: {$ne: 'DELETE'} },
        { name: {$ne: 'DELETE'} },
      ]}},
      { $count: 'memberCount' }
    ],
    }
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
  business.value = response.data.result[0].companyCount
}

const queryLast7dayUsed = async () => {
  let today = new Date()
  today.setHours(0, 0, 0, 0)
  let dates = Array.from({ length: 8 }, (_, index) => new Date(today.getTime() - index * 24 * 60 * 60 * 1000))

  let pipeline = [
  {
    $facet: {},
  },
  ]
  
  for (let i = 0; i < dates.length - 1; i++) {
    let dateString1 = dates[i]
    let dateString0 = dates[i + 1]
    let matchStage = {
      $match: {
        $expr: {
          $and: [
            { $gte: ['$created_date', { $dateFromString: { dateString: dateString0 } }] },
            { $lte: ['$created_date', { $dateFromString: { dateString: dateString1 } }] },
          ],
        },
      },
    }
    pipeline[0]['$facet']['date' + (i + 1)] = [matchStage, { $project: { _id: 0, operator_types:1} }
  ]
  }

  let aggregateQuery = {
    database: 'CPO',
    collection: 'PaymentHistory',
    pipelines: pipeline,
  }

  let result = await MsiApi.mongoAggregate(aggregateQuery)
  let dateKeys = Object.keys(result.data.result[0])

  for (let i = 0; i < dateKeys.length; i++) {
    let dateKey = dateKeys[i]
    let charge_kwh = 0
    result.data.result[0][dateKey].forEach((item) => {
      item.operator_types.forEach( (operator_types) => {
        if (operator_types.type === 'charge') {
          charge_kwh += operator_types.kwh
        }
      })
    })
    power_times_option.series[0].data[dateKeys.length-i-1] = parseInt(charge_kwh)
    power_times_option.series[1].data[dateKeys.length-i-1] = result.data.result[0][dateKey].length
  }

  for (let i = 1; i < dates.length; i++) {
    power_times_option.xAxis.data[7-i]  = 
    new Date(dates[i]).getMonth() + 1 + '/' + new Date(dates[i]).getDate() + '(' + new Date(dates[i]).toLocaleDateString('en-US', { weekday: 'short' }) + '.)'
  }
  
  let power_time_type = echarts.init(ref_power_time.value)
  power_times_option && power_time_type.setOption(power_times_option)
}

const queryEvseError = async() =>
{
  let queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 0, evses: 1, name: 1, id: 1 } }],
  }
  let response = await MsiApi.mongoAggregate(queryData)
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
              '/station-detail?id=' +
              EvseData[i].locationId,
          })
        else
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 0,
            unknown_count: 1,
            url: '/station-detail?id=' + EvseData[i].locationId,
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
              '/station-detail?id=' +
              EvseData[i].locationId,
          })
        else
          error_evse.push({
            name: EvseData[i].locationName,
            id: EvseData[i].locationId,
            error_count: 1,
            unknown_count: 0,
            url: '/station-detail?id=' + EvseData[i].locationId,
          })
    }
  }
  for (let i = 0; i < error_evse.length; i++) {
    if (error_evse[i].name === undefined) {
      error_evse[i].name = t('unpaired')
      if (import.meta.env.VITE_BASE_URL !== undefined)
        error_evse[i].url = import.meta.env.VITE_BASE_URL + '/evse?page=unpaired'
      else error_evse[i].url = '/evse?page=unpaired'
      break
    }
  }
}

const queryStationType = async () => 
{
  let queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 0, facilities: 1 } }],
  }
  let response = await MsiApi.mongoAggregate(queryData)
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
    } else {
      facilities.others++
    }
  }
  for(let i = 0; i < Object.keys(facilities).length; i++) {
    location_type_option.series[i].data[0] = Object.values(facilities)[i]
  }
  let location_type = echarts.init(ref_location_type.value)
  location_type_option && location_type.setOption(location_type_option)
}

onMounted(async () => {
  queryEvseStatus()
  queryEvseError()
  queryTotalUsedTime()
  queryTotalUsedTimes()
  queryTotalUsedPower()
  queryCustomers()
  queryLast7dayUsed()
  queryStationType()
  customize_start_time.value =  moment(new Date(created_date.value)).format('YYYY-MM-DD HH:mm:ss')
  customize_end_time.value =  moment(now).format('YYYY-MM-DD HH:mm:ss')
})
</script>

<template>
  <div class="dashboard">
    <div class="container lg mb-36px">
      <p class="m-0 text-20px text-blue-1200 py-20px text-center">{{ t('real_time_status') }}</p>
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
                    <p class="text-blue-1200 text-22px ml-8px"> {{ t('evse_status') }}</p>
                  </div>
                  <div class="evse-text w-full">
                    <p class="text-secondary mb-4">
                      <span class="text-32px mr-4">{{ station_count }}</span>{{t('stations')}}
                    </p>
                    <p class="text-secondary mb-4">
                      <span class="text-32px mr-4">{{ status_obj.total }}</span>{{t('evses')}}
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
                <p class="text-blue-1200 text-22px ml-8px">{{t('evse_offline_error_status')}}</p>
              </div>
              <div class="evse-notification-container scrollbar">
                <p class="mb-4" v-for="value in error_evse" :key="value">
                  <a class="text-black" :href="value.url"> {{ value.name + ' ' }}</a>
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
        {{t('analysis_dashboard')}}
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
            {{t('all')}}
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('today')"
            >
            {{t('today')}}
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('week')"
            >
            {{t('this_week')}}
            </el-button>
            <el-button
              type="primary"
              round
              class="btn-primary"
              @click="date_select('month')"
            >
            {{t('this_month')}}
            </el-button>
            <el-dropdown ref="dropdownRef" trigger="click" @visible-change="handleVisible">
              <el-button
                type="primary"
                round
                class="btn-primary ml-12px"
              >
              {{t('duration_dashboard')}}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-date-picker
                    v-model="selectTime"
                    class="mx-16px rounded-full"
                    type="datetimerange"
                    range-separator="-"
                    :prefix-icon="Calendar"
                    :start-placeholder="t('start_date')"
                    :end-placeholder="t('end_date')"
                    :default-time="defaultTime"
                    @blur="handleDatePicker('blur')"
                    @focus="handleDatePicker('focus')"
                    @change="select_date()"
                  />
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
      <div class="date-selected text-right mr-12px">
        {{ customize_start_time }} - {{ customize_end_time }}
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
                {{t('total_used_time_charging_parking')}}
              </p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="total-use-time">
                {{ charger_time.hr }} <span class="text-24px mr-8px">{{t('hr')}}</span>
                {{ charger_time.min }} <span class="text-24px mr-8px">{{t('min')}}</span>
                <span class="text-24px ml-8px">/</span>
                {{ parking_time.hr }} <span class="text-24px mr-8px">{{t('hr')}}</span>
                {{ parking_time.min }} <span class="text-24px mr-8px">{{t('min')}}</span>
              </div>
            </div>
          </div>
          <div class="amount flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon
                class="w-24px h-24px"
                icon="fa-regular fa-calendar-check"
              />
              <p class="text-blue-1200 text-22px ml-8px">{{t('total_used_times')}}</p>
            </div>
            <div
              class="card-body flex-center h-full text-40px md:text-60px justify-evenly"
            >
              <div>
                <p class="value">{{ ev_life }}</p>
                <p class="title"> {{t('ev_life')}} </p>
              </div>
              <div>
                <p class="value">{{ rfid }}</p>
                <p class="title">{{t('rfid')}}</p>
              </div>
              <div>
                <p class="value">{{ visitor }}</p>
                <p class="title">{{t('qr_pay')}}</p>
              </div>
            </div>
          </div>
          <div class="income flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-solid fa-coins" />
              <p class="text-blue-1200 text-22px ml-8px">{{t('income')}}</p>
              <el-select
              class="el-select ml-8 w-100px"
              v-model="selectCurrency"
              @change="currencyExchange()"
                  placeholder="Select"
                  >
                  <el-option
                    v-for="item in CurrencyItem"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-button 
                  v-if="MStore.rule_permission.Dashboard.payment === 'O' || MStore.permission.isCompany" class="ellipsis ml-8" @click="goto_payment">
                  <font-awesome-icon icon="fa-solid fa-ellipsis"/>
                </el-button>
                <el-tooltip content="Convert based on the current buying exchange rates from Taiwan Bank." placement="top">
                  <el-button round>
                    <font-awesome-icon icon="fa-solid fa-question"
          /></el-button>
                </el-tooltip>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="income">
                <span class="text-24px mr-8px">$</span>
                {{ income }}
                <span class="text-24px mr-8px">{{(selectCurrency)}}</span>
              </div>
            </div>
          </div>
          <div class="use-power flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_amount.png"
                alt="dashboard_title_amount"
              />
              <p class="text-blue-1200 text-22px ml-8px">{{t('total_used_power')}}</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div class="total-use-time">
                {{ totalkwh }}
                <span class="text-24px mr-8px">{{t('kwh')}}</span>
              </div>
            </div>
          </div>
          <div class="customers flex-col card-rounded box-shadow">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-regular fa-user" />
              <p class="text-blue-1200 text-22px ml-8px" style="white-space:nowrap">{{t('customers')}} <span style="font-size: 21px;"> {{t('from_data_created_until_now')}} </span></p>
            </div>
            <div
              class="card-body flex-center h-full text-40px md:text-60px justify-evenly"
            >
              <div>
                <p class="value">{{ member }}</p>
                <p class="title" v-if="company === 'MSI'">
                  {{t('member')}}
                </p>
                <p class="title" v-else>
                  {{t('rfid_user')}}
                </p>
              </div>
              <div v-if="company === 'MSI'" class="business">
                <p class="value">{{ business }}</p>
                <p class="title">{{t('cpo')}}</p>
              </div>
            </div>
          </div>
          <div class="location-type flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <img
                src="@/assets/img/dashboard_title_locationtype.png"
                alt="dashboard_title_locationtype"
              />
              <p class="text-blue-1200 text-22px ml-8px" style="white-space:nowrap" >{{t('station_type_of_usage')}} {{t('from_data_created_until_now')}}</p>
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
              <p class="text-blue-1200 text-22px ml-8px">{{t('used_power_time_last_7_days')}}</p>
            </div>
            <div class="card-body flex-center h-full text-40px md:text-60px">
              <div ref="ref_power_time" class="power-time flex-grow"></div>
            </div>
          </div>
          <div class="payment-method flex-col card-rounded box-shadow col-span-2">
            <div class="evse-title flex items-center pb-16px md:pb-20px">
              <font-awesome-icon class="w-24px h-24px" icon="fa-regular fa-credit-card" />
              <p class="text-blue-1200 text-22px ml-8px">{{t('payment_method')}}</p>
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

:deep(.el-range-editor) {
  box-shadow: 0 0 0 1px var(--blue-1200) inset !important;
}
:deep(.el-date-editor) {
  .el-range-input {
    color: white;
  }
  .el-range-separator {
    color: white;
  }
}
</style>
