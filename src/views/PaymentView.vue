<script setup>
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { export_json_to_excel } from '@/composables/Export2Excel'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const PaymentData = reactive([])
const now = new Date()
const isLoading = ref(false)
const parking_visible = ref(true)
const charging_visible = ref(true)

const selectTime = ref([new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = [new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)]
const filters = [
  { text: t('credit_card'), value: 'CREDIT' },
  { text: t('rfid'), value: 'RFID' },
  { text: t('free'), value: 'FREE' },
  { text: t('google_pay'), value: 'GOOGLEPAY' },
  { text: t('samsung_pay'), value: 'SAMSUNGPAY' },
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
  const queryData = {
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
                    { $dateFromString: { dateString: selectTime.value[0]  } },
                  ],
                },
                {
                  $lte: [
                    '$created_date',
                    { $dateFromString: { dateString: selectTime.value[1]  } },
                  ],
                },
              ],
            },
          },
        },
        { $project: { _id: 0, sessionId: 0, location: 0, detail: 0, locationId: 0} },
      ],
    }
  await MongoQurey(queryData)
}

const sortFunc = (obj1, obj2, column) => {

  let convertedNumber1 = undefined
  let convertedNumber2 = undefined
  if (
    column === 'parking_price_str' ||
    column === 'price_str' ||
    column === 'charge_price_str'
  ) {
    if (obj1[column] !== undefined) {
      convertedNumber1 = parseFloat(obj1[column].replace(/,/g, ''))
    }
    if (obj2[column] !== undefined) {
      convertedNumber2 = parseFloat(obj2[column].replace(/,/g, ''))
    }
    if (convertedNumber2 === undefined) return -1
    if (convertedNumber1 > convertedNumber2) {
      return -1
    }
  } else {
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
  const res =  await MsiApi.mongoAggregate(queryData)
  PaymentData.length = 0
  Object.assign(PaymentData, res.data.result)

  for (let i = 0; i < PaymentData.length; i++) {
    switch (PaymentData[i]?.paymethod?.method) {
      case 'CREDIT':
        PaymentData[i].paymethod_str = t('credit_card')
        break
      case 'GOOGLEPAY':
        PaymentData[i].paymethod_str = t('google_pay')
        break
      case 'SAMSUNGPAY':
        PaymentData[i].paymethod_str = t('samsung_pay')
        break 
      case 'FREE':
        PaymentData[i].paymethod_str = t('free')
        break
      case 'RFID':
        PaymentData[i].paymethod_str = t('rfid')
        break
      default:
        PaymentData[i].paymethod_str = PaymentData[i]?.paymethod?.method
    }
    
    PaymentData[i].price_str = PaymentData[i]?.price?.toLocaleString()
    let localTime = new Date(new Date(PaymentData[i].created_date).getTime() + MStore.timeZoneOffset * -60000)
    PaymentData[i].created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')

    for (let j = 0; j < PaymentData[i]?.operator_types?.length; j++) {
      let time = moment.duration(PaymentData[i]?.operator_types?.[j]?.time, 'seconds')
      let timeFormat = moment({ h: time.hours(), m: time.minutes(), s: time.seconds()}).format('HH:mm:ss')
      switch (PaymentData[i].operator_types[j].type) {
        case 'charge' :
          PaymentData[i].charge_time = timeFormat
          PaymentData[i].charge_energy_str = PaymentData[i]?.operator_types[j]?.kwh
          PaymentData[i].charge_price_str = PaymentData[i]?.operator_types[j]?.price.toLocaleString()
        break
        case 'parking' :
          PaymentData[i].parking_time = timeFormat
          PaymentData[i].parking_car_num_str = PaymentData[i]?.operator_types[j]?.car_num
          PaymentData[i].parking_price_str = PaymentData[i]?.operator_types[j]?.price.toLocaleString()
        break
      }
    }
  }
  isLoading.value = false
}

onMounted(async () => {
  const queryData = {
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
                    { $dateFromString: { dateString: selectTime.value[0]  } },
                  ],
                },
                {
                  $lte: [
                    '$created_date',
                    { $dateFromString: { dateString: selectTime.value[1]  } },
                  ],
                },
              ],
            },
          },
        },
        { $project: { _id: 0, sessionId: 0, location: 0, detail: 0, locationId: 0, currency: 0} },
      ],
    }
  await MongoQurey(queryData)
})
</script>

<template>
  <div class="payment">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <div class="date-picker w-full blue-1100">
          <el-date-picker
            v-model="selectTime"
            class="mr-16px rounded-full"
            type="datetimerange"
            range-separator="-"
            :prefix-icon="Calendar"
            start-placeholder="Start Date"
            end-placeholder="End Date"
            @change="select_date()"
            :default-time="defaultTime"
          />
        </div>
        <div
          class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center"
        >
          <div class="w-full lg:w-auto flex justify-between md:justify-start">
            <el-checkbox
              class="mr-0 md:mr-30px"
              v-model="parking_visible"
              :label= "t('parking')"
              size="large"
            />
            <el-checkbox v-model="charging_visible" :label= "t('charging')" size="large" />
          </div>
          <el-button
            class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow"
            @click="download"
          >
            <span class="lg:hidden"> {{ t('download') }}</span>
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
            :default-sort="{ prop: 'created_date_str', order: 'ascending' }"
          >
            <el-table-column :label= "t('station')" align="center" min-width="550">
              <el-table-column
                prop="location_name"
                :label="t('name')"
                align="center"
                sortable
                min-width="250"
                :sort-method="(a, b) => sortFunc(a, b, 'location_name')"
              />
              <el-table-column
                prop="evse_id"
                :label="t('evse_id')"
                align="center"
                sortable
                min-width="300"
                :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
              />
            </el-table-column>

            <el-table-column
              v-if="parking_visible"
              :label="t('parking')"
              align="center"
              min-width="450"
            >
              <el-table-column
                prop="parking_time"
                :label="t('used_time')"
                align="center"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_time')"
              />
              <el-table-column
                prop="parking_price_str"
                :label="t('price')"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_price_str')"
              />
              <el-table-column
                prop="parking_car_num_str"
                :label="t('license_plate')"
                align="center"
                sortable
                min-width="200"
                :sort-method="(a, b) => sortFunc(a, b, 'parking_car_num_str')"
              />
            </el-table-column>

            <el-table-column
              v-if="charging_visible"
              :label="t('charging')"
              align="center"
              min-width="450"
            >
              <el-table-column
                prop="charge_time"
                :label="t('used_time')"
                align="center"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_time')"
              />
              <el-table-column
                prop="charge_energy_str"
                :label="t('kwh')"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_energy_str')"
              />
              <el-table-column
                prop="charge_price_str"
                :label="t('price')"
                header-align="center"
                align="right"
                sortable
                min-width="150"
                :sort-method="(a, b) => sortFunc(a, b, 'charge_price_str')"
              />
            </el-table-column>

            <el-table-column
              prop="price_str"
              :label="t('final_paid')"
              header-align="center"
              align="right"
              sortable
              min-width="150"
              :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
            />

            <el-table-column
              prop="paymethod_str"
              :label="t('method')"
              align="center"
              :filters="filters"
              :filter-method="filterTag"
              min-width="150"
            />

            <el-table-column
              prop="created_date_str"
              :label="t('created_date')"
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
