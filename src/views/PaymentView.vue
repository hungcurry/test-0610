<script setup>
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { export_json_to_excel } from '@/composables/Export2Excel'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const PaymentData = reactive([])
const PaymentPageData = reactive([])
const RFIDData = reactive([])
const RFIDPageData = reactive([])
const now = new Date()
const isLoading = ref(false)
const parking_visible = ref(false)
const charging_visible = ref(true)
const activeName = ref('first')
const selectTime = ref([
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
])
const defaultTime = [
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
]
const filters_method = [
  { text: t('credit_card'), value: 'CREDIT' },
  { text: t('rfid'), value: 'RFID' },
  { text: t('free'), value: 'FREE' },
  { text: t('google_pay'), value: 'GOOGLEPAY' },
  { text: t('samsung_pay'), value: 'SAMSUNGPAY' },
]
const filters_type = [
  { text: t('top_up'), value: 'Top-up' },
  { text: t('refund'), value: 'Refund' },
]
const item_count = ref()
const TransactionTableRef = ref()
const payment_cur_page = ref(1)
const payment_max_page = ref()

const TopupTableRef = ref()
const RFID_cur_page = ref(1)
const RFID_max_page = ref()

const download = () => {
  const tHeader = [
    'Station Name',
    'Station EVSE ID',
    'Parking Used Time',
    'Parking Price',
    'Parking Currency',
    'Parking License Plate',
    'Charging Used Time',
    'Charging kWh',
    'Charging Price',
    'Charging Currency',
    'Final Paid',
    'Currency',
    'Method',
    'Created Date',
  ]
  const filterVal = [
    'location_name',
    'evse_id',
    'parking_time',
    'parking_price',
    'parking_currency_str',
    'parking_car_num_str',
    'charging_time',
    'charging_energy',
    'charging_price',
    'charging_currency_str',
    'money',
    'currency',
    'paymethod_str',
    'created_date_str',
  ]
  const data = PaymentData.map((v) => filterVal.map((j) => v[j]))
  export_json_to_excel({ header: tHeader, data: data, filename: 'Transaction List' })
}
const downloadRFID = () => {
  let tHeader = [
    'Type',
    'RFID Num',
    'Amount',
    'Created Time',
  ]
  let filterVal = [
    'type_str',
    'rfid',
    'money',
    'created_date_str',
  ]
  if (MStore.permission.isMSI === false) {
    tHeader = ['Type', 'ID', 'Name', 'RFID Num', 'Amount', 'Created Time']
    filterVal = ['type_str', 'id', 'name', 'rfid', 'money', 'created_date_str']
  }
  const data = RFIDData.map((v) => filterVal.map((j) => v[j]))
  export_json_to_excel({ header: tHeader, data: data, filename: 'Top-up List' })
}
const select_date = async () => {
  isLoading.value = true
  await getPaymentData(null)
  await getCashLogData(null)

  getPayment_PageData()
  getTopup_PageData()

  TransactionTableRef.value.clearFilter()
  TopupTableRef.value.clearFilter()

  TransactionTableRef.value.sort('created_date_str', 'ascending')
  TopupTableRef.value.sort('created_date_str', 'ascending')
  isLoading.value = false
}

const transactionTableSort = async(column) => {
  let target = column.prop
  let order = column.order
  PaymentData.sort(function (a, b) {
    if (a[target] === undefined) {
      a[target] = ''
    }
    else if (b[target] === undefined) {
      b[target] = ''
    }

    if (target === 'parking_price_str' || target === 'money_str' || target === 'charging_price_str') {
      let a_num = parseFloat(a[target]?.replace(/,/g, ""))
      let b_num = parseFloat(b[target]?.replace(/,/g, ""))
      if (order === 'ascending')
        return a_num > b_num? -1 : 1
      else
        return a_num > b_num? 1 : -1
    }
    else if (target === 'parking_time' || target === 'charging_time') {
      let a_num = Number(a[target]?.replace(/:/g, ""))
      let b_num = Number(b[target]?.replace(/:/g, ""))
      if (order === 'ascending')
        return a_num > b_num? -1 : 1
      else
        return a_num > b_num? 1 : -1
    }

    if (order === 'ascending') {
      return a[target] > b[target]? -1 : 1
    }
    else {
      return a[target] > b[target]? 1 : -1
    }
  })

  getPayment_PageData()
}
const topupTableSort = async(column) => {
  let target = column.prop
  let order = column.order
  RFIDData.sort(function (a, b) {
    if (a[target] === undefined) {
      a[target] = ''
    }
    else if (b[target] === undefined) {
      b[target] = ''
    }

    if (target === 'money_str') {
      let a_num = parseFloat(a[target]?.replace(/,/g, ""))
      let b_num = parseFloat(b[target]?.replace(/,/g, ""))
      if (order === 'ascending')
        return a_num > b_num? -1 : 1
      else
        return a_num > b_num? 1 : -1
    }

    if (order === 'ascending') {
      return a[target] > b[target]? -1 : 1
    }
    else {
      return a[target] > b[target]? 1 : -1
    }
  })

  getTopup_PageData()
}
const transactionTableFilter = async(filters) => {
  isLoading.value = true
  await getPaymentData(filters)
  getPayment_PageData()
  TransactionTableRef.value.sort('created_date_str', 'ascending')
  isLoading.value = false
}
const topupTableFilter = async(filters) => {
  isLoading.value = true
  await getCashLogData(filters)
  getTopup_PageData()
  TopupTableRef.value.sort('created_date_str', 'ascending')
  isLoading.value = false
}

const getPaymentData = async(filters) => {
  try {
    if (selectTime.value === null) {
      return
    }
    const startTime = new Date(selectTime.value[0].getTime() - MStore.timeZoneOffset * -60000)
    const endTime = new Date(selectTime.value[1].getTime() - MStore.timeZoneOffset * -60000)
    let response = await MsiApi.get_paymentHistory(startTime, endTime)
    PaymentData.length = 0
    response?.data?.data?.forEach((item) => {
      if (filters === null || filters?.tag.length === 0 || filters?.tag.includes(item?.paymethod)) {
        switch (item?.paymethod) {
          case 'CREDIT':
            item.paymethod_str = t('credit_card')
            break
          case 'GOOGLEPAY':
            item.paymethod_str = t('google_pay')
            break
          case 'SAMSUNGPAY':
            item.paymethod_str = t('samsung_pay')
            break
          case 'FREE':
            item.paymethod_str = t('free')
            break
          case 'RFID':
            item.paymethod_str = t('rfid')
            break
          default:
            item.paymethod_str = item?.paymethod
        }
        let localTime = new Date(new Date(item.created_date).getTime() + MStore.timeZoneOffset * -60000)
        item.created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        if (item.charging_price) {
          item.charging_energy_str = item.charging_energy.toLocaleString()
          item.charging_price_str = item.charging_price.toLocaleString()
        }
        if (item.parking_price) {
          item.parking_price_str = item.parking_price.toLocaleString()
        }
        item.money_str = item.money.toLocaleString()
        PaymentData.push(item)
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const getCashLogData = async(filters) => {
  try {
    if (selectTime.value === null) {
      return
    }
    const startTime = new Date(selectTime.value[0].getTime() - MStore.timeZoneOffset * -60000)
    const endTime = new Date(selectTime.value[1].getTime() - MStore.timeZoneOffset * -60000)
    let response = await MsiApi.get_cash(startTime, endTime)
    RFIDData.length = 0
    response?.data?.data?.forEach((item) => {
      if (filters === null || filters?.tag.length === 0 || filters?.tag.includes(item?.type)) {
        if (item.id !== 'DELETE' && item.name !== 'DELETE') {
          switch (item?.type) {
            case 'Top-up':
              item.type_str = t('top_up')
              break
            case 'Refund':
              item.type_str = t('refund')
              break
            default:
              item.type_str = item?.type
          }
          let localTime = new Date(new Date(item.created_date).getTime() + MStore.timeZoneOffset * -60000)
          item.created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
          item.money_str = item.money.toLocaleString()
          RFIDData.push(item)
        }
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const getPayment_PageData = async() => {
  let table_body_height = window.innerHeight - 320 - 45
  item_count.value = Math.floor(table_body_height / 45)
  payment_max_page.value = Math.ceil(PaymentData.length / item_count.value) * 10

  let count = item_count.value
  PaymentPageData.length = 0
  if (payment_cur_page.value * 10 === payment_max_page.value) {
    count = PaymentData.length - (payment_cur_page.value-1) * item_count.value
  }
  else if (payment_max_page.value === 0) {
    count = 0
  }
  for (let i=0; i<count; i++) {
    PaymentPageData.push(PaymentData[(payment_cur_page.value - 1) * item_count.value + i])
  }
}
const getTopup_PageData = async() => {
  let table_body_height = window.innerHeight - 320 - 45
  item_count.value = Math.floor(table_body_height / 45)
  RFID_max_page.value = Math.ceil(RFIDData.length / item_count.value) * 10

  let count = item_count.value
  RFIDPageData.length = 0
  if (RFID_cur_page.value * 10 === RFID_max_page.value) {
    count = RFIDData.length - (RFID_cur_page.value-1) * item_count.value
  }
  else if (RFID_max_page.value === 0) {
    count = 0
  }
  for (let i=0; i<count; i++) {
    RFIDPageData.push(RFIDData[(RFID_cur_page.value - 1) * item_count.value + i])
  }
}

onMounted(async () => {
  isLoading.value = true
  await getPaymentData(null)
  await getCashLogData(null)

  getPayment_PageData()
  getTopup_PageData()

  TransactionTableRef.value.sort('created_date_str', 'ascending')
  TopupTableRef.value.sort('created_date_str', 'ascending')

  window.addEventListener("resize", async function () {
    if (activeName.value === 'first') {
      getPayment_PageData()
    }
    else {
      getTopup_PageData()
    }
  })

  isLoading.value = false
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
        <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-end items-center">
          <div v-if="activeName === 'first'" class="w-full lg:w-auto flex justify-between md:justify-start">
            <el-checkbox
              class="mr-0 md:mr-30px"
              v-model="parking_visible"
              :label="t('parking')"
              size="large"
            />
            <el-checkbox v-model="charging_visible" :label="t('charging')" size="large" />
          </div>
          <template v-if="true">
            <el-button v-if="activeName === 'first'"
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
            <el-button v-if="activeName === 'second'"
              class="download-btn w-full md:w-auto mt-4 md:mt-0 box-shadow"
              @click="downloadRFID"
            >
              <span class="lg:hidden"> {{ t('download') }}</span>
              <img
                class="w-24px h-24px ml-10px lg:ml-0"
                src="@/assets/img/station_download.png"
                alt="station_download"
              />
            </el-button>
          </template>
        </div>
      </div>
      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('transaction_list')" name="first">
            <div class="overflow-x-auto">
              <div class="transaction-list pb-40px">
                <el-table
                  ref="TransactionTableRef"
                  :data="PaymentPageData"
                  class="white-space-nowrap text-primary"
                  height="calc(100vh - 300px)"
                  style="width: 100%"
                  stripe
                  size="large"
                  :cell-style="msi.tb_cell"
                  :header-cell-style="msi.tb_header_cell"
                  v-loading.fullscreen.lock="isLoading"
                  @sort-change="transactionTableSort"
                  @filter-change="transactionTableFilter"
                  :default-sort="{ prop: 'created_date_str', order: 'ascending' }"
                >
                  <el-table-column :label="t('station')" align="center" min-width="550">
                    <el-table-column
                      prop="location_name"
                      :label="t('name')"
                      align="center"
                      sortable="custom"
                      min-width="250"
                    />
                    <el-table-column
                      prop="evse_id"
                      :label="t('evse_id')"
                      align="center"
                      sortable="custom"
                      min-width="250"
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
                      sortable="custom"
                      min-width="150"
                    />
                    <el-table-column
                      prop="parking_price_str"
                      :label="t('price')"
                      header-align="center"
                      align="right"
                      sortable="custom"
                      min-width="100"
                    />

                    <el-table-column
                      prop="parking_currency_str"
                      :label="t('currency')"
                      header-align="center"
                      align="center"
                      sortable="custom"
                      min-width="150"
                    />

                    <el-table-column
                      prop="parking_car_num_str"
                      :label="t('license_plate')"
                      align="center"
                      sortable="custom"
                      min-width="200"
                    />
                  </el-table-column>

                  <el-table-column
                    v-if="charging_visible"
                    :label="t('charging')"
                    align="center"
                    min-width="450"
                  >
                    <el-table-column
                      prop="charging_time"
                      :label="t('used_time')"
                      align="center"
                      sortable="custom"
                      min-width="150"
                    />
                    <el-table-column
                      prop="charging_energy_str"
                      :label="t('kwh')"
                      header-align="center"
                      align="right"
                      sortable="custom"
                      min-width="150"
                    />
                    <el-table-column
                      prop="charging_price_str"
                      :label="t('price')"
                      header-align="center"
                      align="right"
                      sortable="custom"
                      min-width="100"
                    />

                    <el-table-column
                      prop="charging_currency_str"
                      :label="t('currency')"
                      header-align="center"
                      align="center"
                      sortable="custom"
                      min-width="150"
                    />
                  </el-table-column>

                  <el-table-column
                    prop="money_str"
                    :label="t('final_paid')"
                    header-align="center"
                    align="right"
                    sortable="custom"
                    min-width="180"
                  />

                  <el-table-column
                    prop="currency"
                    :label="t('currency')"
                    header-align="center"
                    align="center"
                    sortable="custom"
                    min-width="150"
                  />

                  <el-table-column
                    prop="paymethod_str"
                    :label="t('method')"
                    align="center"
                    :filters="filters_method"
                    :column-key="'tag'"
                    min-width="150"
                  />

                  <el-table-column
                    prop="created_date_str"
                    :label="t('created_date')"
                    align="center"
                    sortable="custom"
                    min-width="250"
                  />
                </el-table>
                <el-pagination 
                  class="justify-center"
                  layout="prev, pager, next" 
                  :total="payment_max_page" 
                  v-model:current-page="payment_cur_page" 
                  @current-change="getPayment_PageData" 
                />
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="t('top_up_list')" name="second">
            <div class="overflow-x-auto">
              <div class="topup-list pb-40px">
                <el-table
                  ref="TopupTableRef"
                  :data="RFIDPageData"
                  class="white-space-nowrap text-primary"
                  height="calc(100vh - 300px)"
                  style="width: 100%"
                  stripe
                  size="large"
                  :cell-style="msi.tb_cell"
                  :header-cell-style="msi.tb_header_cell"
                  v-loading.fullscreen.lock="isLoading"
                  @sort-change="topupTableSort"
                  @filter-change="topupTableFilter"
                  :default-sort="{ prop: 'created_date_str', order: 'ascending' }"
                >
                  <el-table-column
                    prop="type_str"
                    :label="t('type')"
                    align="center"
                    :filters="filters_type"
                    :column-key="'tag'"
                    min-width="200"
                  />

                  <el-table-column
                    v-if="MStore.permission.isMSI === false"
                    prop="id"
                    :label="t('id')"
                    align="center"
                    sortable="custom"
                    min-width="200"
                  />

                  <el-table-column
                    v-if="MStore.permission.isMSI === false"
                    prop="name"
                    :label="t('name')"
                    align="center"
                    sortable="custom"
                    min-width="200"
                  />

                  <el-table-column
                    prop="rfid"
                    :label="t('rfid_num')"
                    align="center"
                    sortable="custom"
                    min-width="150"
                  />

                  <el-table-column
                    prop="money_str"
                    :label="t('amount')"
                    header-align="center"
                    align="right"
                    sortable="custom"
                    min-width="150"
                  />

                  <el-table-column
                    prop="created_date_str"
                    :label="t('created_time')"
                    align="center"
                    sortable="custom"
                    min-width="200"
                  />

                </el-table>
                <el-pagination 
                  class="justify-center"
                  layout="prev, pager, next" 
                  :total="RFID_max_page" 
                  v-model:current-page="RFID_cur_page" 
                  @current-change="getTopup_PageData" 
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
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
