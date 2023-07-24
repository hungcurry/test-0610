<script setup>
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { export_json_to_excel } from '@/composables/Export2Excel'
import { useMStore } from '../stores/m_cloud'

const MStore = useMStore()
const MsiApi = ApiFunc()
const PaymentData = reactive([])
const now = new Date()
const isLoading = ref(false)
const parking_visible = ref(true)
const charging_visible = ref(true)

const defaultTime = ref([
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
])
const defaultTime2 = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]
const filters = [
  { text: 'Credit Card', value: 'CREDIT' },
  { text: 'RFID', value: 'RFID' },
  { text: 'Free', value: 'FREE' },
  // { text: 'APPLE PAY', value: 'APPLEPAY' },
  { text: 'Google Pay', value: 'GOOGLEPAY' },
  { text: 'Samsung Pay', value: 'SAMSUNGPAY' },
]

const download = () => {
  const tHeader = [
    'Station Name',
    'Station EVSE ID',
    'Parking Used Time',
    'Parking Price',
    'Parking License Plate',
    'Charging Used Time',
    'Charging kWh',
    'Charging Price',
    'Final Paid',
    'Method',
    'Created Date',
  ]
  const filterVal = [
    'location_name',
    'evse_id',
    'parking_time',
    'parking_price_str',
    'parking_car_num_str',
    'charge_time',
    'charge_energy_str',
    'charge_price_str',
    'price_str',
    'paymethod_str',
    'created_date_str',
  ]
  const data = PaymentData.map((v) => filterVal.map((j) => v[j]))
  export_json_to_excel({ header: tHeader, data: data, filename: 'Payment' })
}

const filterTag = (value, rowData) => {
  return rowData.paymethod.method === value
}

const select_date = async () => {
  let queryData = {
    database: 'CPO',
    collection: 'PaymentHistory',
    query: {
      $expr: {
        $and: [
          {
            $gte: [
              '$created_date',
              { $dateFromString: { dateString: defaultTime.value[0] } },
            ],
          },
          {
            $lte: [
              '$created_date',
              { $dateFromString: { dateString: defaultTime.value[1] } },
            ],
          },
        ],
      },
    },
  }
  const response = await MongoQurey(queryData)
  console.log(response)
}

const sortFunc = (obj1, obj2, column) => {

  let convertedNumber1 = undefined
  let convertedNumber2 = undefined
  if(column === 'parking_price_str' || column === 'price_str' || column === 'charge_price_str') {   
    if (obj1[column] !== undefined) {
      convertedNumber1 = parseInt(obj1[column].replace(/,/g, ""))
    }
    if (obj2[column] !== undefined) {
      convertedNumber2 = parseInt(obj2[column].replace(/,/g, ""))
    }
    if (convertedNumber2 === undefined)
     return -1
    if (convertedNumber1 > convertedNumber2) {
      return -1
    }
  }
  else {
    let at = obj1[column]
    let bt = obj2[column]
    if (bt === undefined) {
      return -1
    }
    if (at > bt) {
      return -1
    }
  }
}


const MongoQurey = async (queryData) => {
  isLoading.value = true
  const response = await MsiApi.mongoQuery(queryData)

  PaymentData.length = 0
  Object.assign(PaymentData, response.data.all)
  
  for (let i = 0; i < PaymentData.length; i++) {
    PaymentData[i].paymethod_str = PaymentData[i]?.paymethod?.method
    if (PaymentData[i]?.paymethod?.method === 'GOOGLEPAY')
      PaymentData[i].paymethod_str = 'Google Pay'
    else if (PaymentData[i]?.paymethod?.method === 'FREE')
      PaymentData[i].paymethod_str = 'Free'
    else if (PaymentData[i]?.paymethod?.method === 'SAMSUNGPAY')
      PaymentData[i].paymethod_str = 'Samsung Pay'
    else if (PaymentData[i]?.paymethod?.method === 'CREDIT')
    PaymentData[i].paymethod_str = 'Credit Card'      
    

    let localTime = new Date(
      new Date(PaymentData[i].created_date).getTime() + MStore.timeZoneOffset * -60000
    )
    PaymentData[i].created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')

    for (let j = 0; j < PaymentData[i]?.operator_types?.length; j++) {
      if (PaymentData[i].operator_types[j].type === 'charge') {
        let time = moment.duration(PaymentData[i]?.operator_types?.[j]?.time, 'seconds')
        PaymentData[i].charge_time = moment({
          h: time.hours(),
          m: time.minutes(),
          s: time.seconds(),
        }).format('HH:mm:ss')
        PaymentData[i].charge_energy_str = PaymentData[i]?.operator_types[j]?.kwh
        PaymentData[i].charge_price_str = PaymentData[i]?.operator_types[
          j
        ]?.price.toLocaleString()
      } else if (PaymentData[i].operator_types[j].type === 'parking') {
        let time = moment.duration(PaymentData[i]?.operator_types?.[j]?.time, 'seconds')
        PaymentData[i].parking_time = moment({
          h: time.hours(),
          m: time.minutes(),
          s: time.seconds(),
        }).format('HH:mm:ss')
        PaymentData[i].parking_price_str = PaymentData[i]?.operator_types[
          j
        ]?.price.toLocaleString()
        PaymentData[i].parking_car_num_str = PaymentData[i]?.operator_types[j]?.car_num
      }
    }
    PaymentData[i].price_str = PaymentData[i]?.price?.toLocaleString()
  }
  isLoading.value = false
  return response
}

onMounted(async () => {
  let queryData = {
    database: 'CPO',
    collection: 'PaymentHistory',
    query: {
      $expr: {
        $and: [
          {
            $gte: [
              '$created_date',
              {
                $dateFromString: {
                  dateString: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
                },
              },
            ],
          },
        ],
      },
    },
  }
  let res = await MongoQurey(queryData)
  console.log(res)
})
</script>

<template>
  <div class="payment">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <div class="date-picker w-full">
          <el-date-picker
            v-model="defaultTime"
            class="mr-16px"
            type="datetimerange"
            range-separator="-"
            :prefix-icon="Calendar"
            start-placeholder="Start Date"
            end-placeholder="End Date"
            @change="select_date()"
            :default-time="defaultTime2"
          />
        </div>
        <div
          class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center"
        >
          <div class="w-full lg:w-auto flex justify-between md:justify-start">
            <el-checkbox
              class="mr-0 md:mr-30px"
              v-model="parking_visible"
              label="Parking"
              size="large"
            />
            <el-checkbox v-model="charging_visible" label="Charging" size="large" />
          </div>
          <el-button
            class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow"
            @click="download"
          >
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
        <div class="payment-list pb-40px">
          <el-table
            :data="PaymentData"
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe
            size="large"
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column label="Station" align="center" min-width="550">
              <el-table-column
                prop="location_name"
                label="Name"
                align="center"
                sortable
                min-width="250"
                :sort-method="(a, b) => sortFunc(a, b, 'location_name')"
              />
              <el-table-column
                prop="evse_id"
                label="EVSE ID"
                align="center"
                sortable
                min-width="300"
                :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
              />
            </el-table-column>

            <el-table-column
              v-if="parking_visible"
              label="Parking"
              align="center"
              min-width="450"
            >
              <el-table-column
                prop="parking_time"
                label="Used Time"
                align="center"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_time')"
              />
              <el-table-column
                prop="parking_price_str"
                label="Price"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_price_str')"
              />
              <el-table-column
                prop="parking_car_num_str"
                label="License Plate"
                align="center"
                sortable
                min-width="200"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_car_num_str')"
              />
            </el-table-column>

            <el-table-column
              v-if="charging_visible"
              label="Charging"
              align="center"
              min-width="450"
            >
              <el-table-column
                prop="charge_time"
                label="Used Time"
                align="center"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_time')"
              />
              <el-table-column
                prop="charge_energy_str"
                label="kWh"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_energy_str')"
              />
              <el-table-column
                prop="charge_price_str"
                label="Price"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_price_str')"
              />
            </el-table-column>

            <el-table-column
              prop="price_str"
              label="Final Paid"
              header-align="center"
              align="right"
              sortable
              min-width="150"
              :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
            />

            <el-table-column
              prop="paymethod_str"
              label="Method"
              align="center"
              :filters="filters"
              :filter-method="filterTag"
              min-width="150"
            />

            <el-table-column
              prop="created_date_str"
              label="Created Date"
              align="center"
              sortable
              min-width="250"
              :sort-method="(a, b) => sortFunc(a, b, 'created_date_str')"
            />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.payment {
  .download-btn {
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
  }
  .el-checkbox {
    --el-checkbox-input-border: 0.2rem solid;
  }
  :deep(.el-checkbox__label) {
    font-size: 1.8rem;
    color: var(--blue-900);
  }
  :deep(.el-checkbox__inner) {
    width: 1.8rem;
    height: 1.8rem;
    color: var(--blue-900);
  }
  :deep(.el-checkbox__inner::after) {
    border: 0.2rem solid var(--blue-900);
    border-left: 0;
    border-top: 0;
    top: 0.1rem;
    left: 0.5rem;
  }
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: transparent;
  }
}
</style>
