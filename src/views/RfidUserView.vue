<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from "vue-i18n"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessage } from 'element-plus'
import { useMStore } from '../stores/m_cloud'
import { export_json_to_excel } from '@/composables/Export2Excel'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from 'moment'
import Calendar from '@/components/icons/IconCalendar.vue'

const { t } = useI18n()
const MStore = useMStore()
const router = useRouter()
const MsiApi = ApiFunc()
const dialogFormVisible = ref(false)
const activeName = ref('first')
const isLoading = ref(false)
const total_amount = ref(0)
const input = ref('')
const UserData = []
const RfidUserData = reactive([])
const newUser = reactive({id:'', name:'', phone: ''})
const add_rfid_user_ref = ref()
const add_rfid_user_rules = reactive({
  id: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})
const now = new Date()
const selectTime = ref([
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
])
const defaultTime = [
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
]
const transactionData = reactive([])

const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]

  if (bt === undefined) {
    return -1
  }
  if (at > bt) {
    return -1
  }
}

const search = async() => {
  RfidUserData.length = 0
  total_amount.value = 0

  if (input.value === '') {
    for (let i=0; i<UserData.length; i++) {
      if (UserData[i].tag_id !== 'DELETE' || UserData[i].name !== 'DELETE') {
        RfidUserData.push(UserData[i])
        if (UserData[i].amount) 
          total_amount.value += UserData[i].amount
      }
    }
    total_amount.value = total_amount.value.toLocaleString()
    return
  }

  let reStr = new RegExp(input.value, 'i')
  UserData.forEach((item) => {
    if (item.tag_id === 'DELETE' && item.name === 'DELETE') {
      // Donot push
    }
    else if (
      reStr.test(item.tag_id) || 
      reStr.test(item.name) ||
      reStr.test(item.phone) ||
      reStr.test(item.rfid) ||
      reStr.test(item.amount) ||
      reStr.test(item.amount_str) ||
      // reStr.test(item.occupied) ||
      reStr.test(item.used_times) ||
      reStr.test(item.updated_date_str)
    ) {
      RfidUserData.push(item)
      if (item.amount) 
        total_amount.value += item.amount
    }
  })
  total_amount.value = total_amount.value.toLocaleString()
}
const downloadTransaction = () => {
  const tHeader = [
    'ID',
    'Name',
    'RFID Num',
    'Beginning Balance',
    'Top-up Amount',
    'Refund Amount',
    'Transaction Amount',
    'Balance',
  ]
  const filterVal = [
    'tag_id',
    'name',
    'rfid',
    'origin',
    'topup',
    'refund',
    'price',
    'balance',
  ]
  const data = transactionData.map((v) => filterVal.map((j) => v[j]))
  export_json_to_excel({ header: tHeader, data: data, filename: 'RFID User Transaction List' })
}
const select_date = async() => {
  await getTransactionData()
}
const goUserDetailTransaction = (detail) => {
  router.push({ name: 'rfidUserDetail', query:{id:detail._id, start_time:selectTime.value[0], end_time:selectTime.value[1]} })
}
const getTransactionData = async() => {
  if (selectTime.value === null) {
    return
  }
  const startTime = new Date(selectTime.value[0].getTime() - MStore.timeZoneOffset * -60000)
  const endTime = new Date(selectTime.value[1].getTime() - MStore.timeZoneOffset * -60000)
  let params = {role:'rfid', start_date: startTime, end_date: endTime}
  let payments = await MsiApi.get_user_payment(params)
  let cashs = await MsiApi.get_user_cash(params)

  transactionData.length = 0
  payments?.data?.data?.forEach(item => {
    let user_cash = cashs?.data?.data?.find(item2 => item2._id === item._id)
    let origin = 0
    let balance = 0

    if (item.datetime === undefined || user_cash.datetime === undefined) {
      if (item.datetime === undefined && user_cash.datetime === undefined) {
        origin = 0
      }
      else if (item.datetime === undefined) {
        origin = user_cash.origin
      }
      else if (user_cash.datetime === undefined) {
        origin = item.origin
      }
    }
    else if (new Date(item.datetime) >= startTime && new Date(user_cash.datetime) >= startTime) {
      if (item.datetime > user_cash.datetime) {
        origin = user_cash.origin
      }
      else {
        origin = item.origin
      }
    }
    else if (new Date(item.datetime) < startTime && new Date(user_cash.datetime) < startTime) {
      if (item.datetime > user_cash.datetime) {
        origin = item.origin
      }
      else {
        origin = user_cash.origin
      }
    }
    else if (new Date(item.datetime) >= startTime) {
      origin = item.origin
    }
    else if (new Date(user_cash.datetime) >= startTime) {
      origin = user_cash.origin
    }
    balance = origin + user_cash.topup - Math.abs(user_cash.refund) - item.price
    transactionData.push({
      _id: item._id, tag_id: item.tag_id, name: item.name, rfid: item.rfid, 
      price: item.price, topup: user_cash.topup, refund: Math.abs(user_cash.refund), 
      origin: origin, balance: balance,
      price_str: item.price.toLocaleString(), topup_str: user_cash.topup.toLocaleString(), refund_str: Math.abs(user_cash.refund).toLocaleString(), 
      origin_str: origin.toLocaleString(), balance_str: balance.toLocaleString(),
    })
  })
}

const addRfidUser = () => {
  if (RfidUserData.length >= MStore.program.user && MStore.permission.isMSI === false) {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
  dialogFormVisible.value = true
  newUser.id = ''
  newUser.name = ''
  newUser.phone = ''
}
const detail_info = (detail) => {
  router.push({ name: 'rfidUserDetail', query:{id:detail._id} })
}
const getUserData = async() => {
  try {
    let response = await MsiApi.get_account_info('rfid')
    UserData.length = 0
    RfidUserData.length = 0
    total_amount.value = response.data?.data?.total_amount.toLocaleString()
    if (total_amount.value === undefined) total_amount.value = '0'
    Object.assign(UserData, response?.data?.data?.rfid_infos)
    UserData.forEach((item) => {
      if (item.tag_id !== 'DELETE' || item.name !== 'DELETE') {
        let localTime = new Date(new Date(item.updated_date).getTime() + MStore.timeZoneOffset * -60000)
        item.updated_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        item.amount_str = item.amount?.toLocaleString()
        RfidUserData.push(item)
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const addRfidUserDialog = (action) => {
  try {
    if (action === 'confirm') {
      add_rfid_user_ref.value.validate(async valid => {
        if (valid) {
          let sendData = {
            "role": 'rfid',
            'tag_id': newUser.id,
            'name': newUser.name,
            'phone': newUser.phone,
          }
          let res = await MsiApi.register_member(sendData)
          if (res.data.message === 'Accepted') {
            dialogFormVisible.value = false
            await getUserData()
          }
          else if (res.data.message === 'User is exist') {
            ElMessage.error(t('id_already_exists'))
          }
          else if (res.data.message === 'Please chat to Administrator/IT.') {
            ElMessage.error(t('please_chat_to_administrator_it'))
          }
          else { 
            ElMessage.error(t('error'))
          }
        }
        else {
          return false
        }
      })
    }
    else if (action === 'cancel') {
      dialogFormVisible.value = false
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

onMounted( async() => {
  isLoading.value = true
  await getUserData()
  await getTransactionData()
  isLoading.value = false
})
</script>

<template>
  <div class="rfid-user">
    <div class="container lg">
      <div class="tabs pt-40px">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('user_list')" name="first">
            <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
              <el-input class="search-input mb-12px lg:mb-0" v-model="input" :placeholder="t('search')" @keyup.enter="search">
                <template #append>
                  <el-button :icon="Search" @click="search" />
                </template>
              </el-input>
              <div class="w-full sm:flex justify-between lg:justify-end items-center lg:w-auto mr-15px">
                <p class="total-amount box-shadow mr-2rem min-w-20rem font-bold text-center mb-12px md:mb-0"> {{ t('total_amount') + ' : $ ' + total_amount  }}</p>
                <el-button v-if="MStore.rule_permission.RfidUser.addUser === 'O' || MStore.permission.isCompany"
                  class="btn-secondary box-shadow" @click="addRfidUser"> {{ t('add_user') }} </el-button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <div class="customer-list pb-40px">
                <el-table 
                    :data="RfidUserData" 
                    class="white-space-nowrap text-primary"
                    height="calc(100vh - 320px)"
                    style="width: 100%"
                    stripe 
                    size="large"
                    :cell-style=msi.tb_cell 
                    :header-cell-style="msi.tb_header_cell"
                    v-loading.fullscreen.lock="isLoading"
                    :default-sort="{ prop: 'updated_date_str', order: 'ascending' }"
                  >
                    <el-table-column
                      prop="tag_id"
                      :label="t('id')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'tag_id')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="name"
                      :label="t('name')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'name')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="phone"
                      :label="t('phone')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'phone')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="rfid"
                      :label="t('rfid_num')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'rfid')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="amount_str"
                      :label="t('amount')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'amount')"
                      min-width="150"
                    >
                      <template #default="scope">
                        <span v-if="scope.row.amount < 0" class="text-red">{{ scope.row.amount_str }}</span>
                        <span v-else>{{ scope.row.amount_str }}</span>
                      </template>
                    </el-table-column>

                    <!-- <el-table-column
                      prop="occupied"
                      :label="t('occupied_evse_id')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'occupied')"
                      min-width="200"
                    >
                      <template #default="scope">
                        <span v-if="scope.row.occupied_detail_str === ''">{{ scope.row.occupied_str }}</span>
                        <el-tooltip v-else placement="bottom-start">
                          <template #content>
                            <div v-html="scope.row.occupied_detail_str"></div>
                          </template>
                          <el-button class="overflow-hidden evse-tooltip-btn">
                            <span class="font-400 text-1.8rem line-height-2rem text-black-200"> {{ scope.row.occupied_str }} </span>
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-table-column> -->
                    <el-table-column
                      prop="used_times"
                      :label="t('used_times')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'used_times')"
                      min-width="200"
                    />
                    <el-table-column
                      prop="updated_date_str"
                      :label="t('updated_date')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'updated_date_str')"
                      min-width="200"
                    />
                    <el-table-column
                      prop="detail"
                      label=""
                      align="center"
                      min-width="150"
                    >
                      <template #default="scope">
                        <el-button v-if="MStore.rule_permission.RfidUser.userDetail === 'O' || MStore.permission.isCompany"
                          class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
                      </template>
                    </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="t('transaction_list')" name="second">
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
                <el-button
                  class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px lg:mr-15px box-shadow"
                  @click="downloadTransaction"
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
              <div class="customer-list pb-40px">
                <el-table 
                    :data="transactionData" 
                    class="white-space-nowrap text-primary"
                    height="calc(100vh - 320px)"
                    style="width: 100%"
                    stripe 
                    size="large"
                    :cell-style=msi.tb_cell 
                    :header-cell-style="msi.tb_header_cell"
                    v-loading.fullscreen.lock="isLoading"
                    :default-sort="{ prop: 'updated_date_str', order: 'ascending' }"
                  >
                  <el-table-column
                    prop="tag_id"
                    :label="t('id')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'id')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="name"
                    :label="t('name')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'name')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="rfid"
                    :label="t('rfid_num')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'rfid')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="origin_str"
                    :label="t('beginning_balance')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'origin')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="topup_str"
                    :label="t('top_up_amount')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'topup')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="refund_str"
                    :label="t('refund_amount')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'refund')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="price_str"
                    :label="t('transaction_amount')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'price')"
                    min-width="150"
                  />
                  <el-table-column
                    prop="balance_str"
                    :label="t('balance')"
                    align="center"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'balance')"
                    min-width="150"
                  >
                    <template #default="scope">
                      <span v-if="scope.row.balance < 0" class="text-red">{{ scope.row.balance_str }}</span>
                      <span v-else>{{ scope.row.balance_str }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="detail"
                    label=""
                    align="center"
                    min-width="100"
                  >
                    <template #default="scope">
                      <el-button class="btn-more" @click="goUserDetailTransaction(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <el-dialog
      v-model="dialogFormVisible"
      class="max-w-600px"
      :show-close="true"
      width="90%"
      destroy-on-close
      center
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
          >
            {{ t('add_user') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <el-form class="max-w-500px m-auto" :rules="add_rfid_user_rules" ref="add_rfid_user_ref" :model="newUser" label-width="100px" label-position="left" :scroll-to-error=true>
          <el-form-item class="mb-24px" :label="t('id')" prop="id">
            <el-input v-model="newUser.id" />
          </el-form-item>
          <el-form-item class="mb-24px" :label="t('name')" prop="name">
            <el-input v-model="newUser.name" />
          </el-form-item>
          <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
            <el-input v-model="newUser.phone" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click.stop="addRfidUserDialog('cancel')"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="addRfidUserDialog('confirm')"
          >
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.rfid-user {
  .search-input {
    width: 400px;
    height: 40px;

    :deep(.el-input__wrapper) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 3rem;
      border-bottom-left-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-right: 0.1rem solid var(--blue-700);
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input-group__append) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 3rem;
      border-bottom-right-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-left: 0;
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input__inner) {
      color: black;
    }
    :deep(.el-icon) {
      color: black;
    }
  }
  .download-btn {
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
  }
  .evse-tooltip-btn {
    background-color: unset;
  }
  .total-amount {
    line-height: 40px;
    background-color: var(--blue-200);
    border-radius: 2rem;
    padding: 0 2rem;
    cursor: default;
  }

  :deep(.el-tabs__item) {
    font-size: 24px;
    font-weight: 700;
  }
}
</style>