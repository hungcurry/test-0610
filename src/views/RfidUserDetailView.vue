<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import Calendar from '@/components/icons/IconCalendar.vue'
import moment from 'moment'
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { export_json_to_excel } from '@/composables/Export2Excel'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useMStore } from '../stores/m_cloud'

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const user_id = route.query.id
const isLoading_skeleton = ref(false)
const activeName = ref('first')

const general = reactive([])
const real_time = reactive([])
const rfids = reactive([])
const summary = reactive([])
let occupied_str = ref()
let occupied_detail_str = ref()

const paymentData = reactive([])
const paymentPageData = reactive([])
const userDataMod = reactive([])
const EditUserFormVisible = ref(false)
const userData_ref = ref()
const userData_rules = reactive({
  id: [{ required: true, message: t('the_item_is_required'), trigger: 'blur' }],
  name: [{ required: true, message: t('the_item_is_required'), trigger: 'blur' }],
})
const modify_card_index = ref(-1)
const EditRfidFormVisible = ref(false)
const rfid_title = ref(t('add_rfid'))
const rfidData = reactive({
  number: '',
  amount: 0,
  name: '',
  enable: true,
  top_up: '',
  refund: '',
  topUpCheck: false,
  isTopUPCheck: true,
  refundCheck: false,
  isRefundCheck: true,
})
const rfidData_ref = ref()
const rfidData_rules = reactive({
  rfid: [{ required: true, message: t('the_item_is_required'), trigger: 'blur' }],
  cash: [{ required: true, message: t('the_item_is_required'), trigger: 'blur' }],
  nickname: [{ required: true, message: t('the_item_is_required'), trigger: 'blur' }],
})
const parking_visible = ref(false)
const charging_visible = ref(true)
const item_count = ref()
const TransactionTableRef = ref()
const cur_page = ref(1)
const max_page = ref()
const now = new Date()
const select_time = ref([
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
])
const defaultTime = [
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
]
const filters = [
  { text: t('top_up'), value: 'Top-up' },
  { text: t('refund'), value: 'Refund'},
  { text: t('charging'), value: 'Charging' },
  { text: t('parking'), value: 'Parking' },
  { text: t('charging') + '+' + t('parking'), value: 'Charging+Parking' },
]

const tableSort = async(column) => {
  let target = column.prop
  let order = column.order
  paymentData.sort(function (a, b) {
    if (a[target] === undefined) {
      a[target] = ''
    }
    else if (b[target] === undefined) {
      b[target] = ''
    }

    if (target === 'parking_price_str' || target === 'money_str' || target === 'charging_price_str' || target === 'balance_str') {
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

  getTransaction_PageData()
}
const tableFilter = async(filters) => {
  await getTransactionData(filters)
  getTransaction_PageData()
  TransactionTableRef.value.sort('created_date_str', 'ascending')
}

const download = () => {
  const tHeader = [
    'Type',
    'Station Name',
    'Station EVSE ID',
    'Parking Used Time',
    'Parking Price',
    'Parking License Plate',
    'Charging Used Time',
    'Charging kWh',
    'Charging Price',
    'Final Paid',
    'RFID Num',
    'Balance',
    'Created Time',
  ]
  const filterVal = [
    'type',
    'location_name',
    'evse_id',
    'parking_time',
    'parking_price',
    'parking_car_num_str',
    'charging_time',
    'charging_energy',
    'charging_price',
    'money',
    'rfid',
    'balance',
    'created_date_str',
  ]
  const data = paymentData.map((v) => filterVal.map((j) => v[j]))
  export_json_to_excel({ header: tHeader, data: data, filename: 'Transaction' })
}
const select_date = async () => {
  await getTransactionData(null)
  getTransaction_PageData()
  TransactionTableRef.value.clearFilter()
  TransactionTableRef.value.sort('created_date_str', 'ascending')
}

const editUser = () => {
  userDataMod.id = general.tag_id
  userDataMod.name = general.name
  userDataMod.phone = general.phone
  userDataMod.permission_active_str = general.permission.active
  EditUserFormVisible.value = true
}
const editUserDialog = (action) => {
  try {
    if (action === 'confirm') {
      userData_ref.value.validate((valid) => {
        if (valid) {
          EditUserFormVisible.value = false
          ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
            .then(async () => {
              const json = JSON.stringify({ role: 'rfid', id: general._id, name: userDataMod.name, phone: userDataMod.phone, 
                permission: {user: general.permission.user, edit: general.permission.edit, active: userDataMod.permission_active_str} })
              let res = await MsiApi.edit_account(json)
              if (res.data.message === 'Accepted') {
                await getRfidUserData()
              }
              else {
                ElMessage.error(t('error'))
              }
            })
            .catch((e) => {
              EditUserFormVisible.value = true
            })
        }
        else {
          return false
        }
      })
    } 
    else if (action === 'cancel') {
      EditUserFormVisible.value = false
    } 
    else if (action === 'delete') {
      EditUserFormVisible.value = false
      if (rfids.length !== 0) {
        ElMessage({ type: 'error', message: t('user_cannot_be_deteted_because_the_rfid_card_has_not_been_deleted_yet') })
      }
      else {
        ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
          .then(async () => {
            let res = await MsiApi.delete_account({ role:'rfid', id: general._id })
            if (res.data.message === 'Accepted') {
              router.push({ name: 'rfidUser' })
            }
            else {
              ElMessage.error(t('error'))
            }
          })
          .catch((e) => {
          })
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const editRfid = () => {
  modify_card_index.value = -1
  rfid_title.value = t('add_rfid')
  EditRfidFormVisible.value = true
  rfidData.rfid = ''
  rfidData.cash = 0
  rfidData.nickname = ''
  rfidData.enable = true
}

let stopWatch = null;
const createWatch = (dataKey, checkKey) => {
  let timeoutId = null;
  stopWatch = watch(
    () => rfidData[dataKey], (newV) => {
      if (newV !== '' && newV > 0) rfidData[checkKey] = false;
      else rfidData[checkKey] = true;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (newV !== '' && newV <= 0) showWarningNotif();
      }, 500);
    }
  );
}
createWatch('top_up', 'isTopUPCheck');
createWatch('refund', 'isRefundCheck');
const showWarningNotif = () => {
  ElNotification({
    title: t('warning'),
    message: t('the_amount_entered_must_not_be_0'),
    type: 'warning',
  });
};

const updateRfidCash = (type) => {
  let messages = null
  let response_msg = null
  let cash = 0
  if (type === 'top_up') {
    if (!(rfidData.top_up > 0 && rfidData.topUpCheck === true)) {
      return
    }
    messages = `${t('are_you_sure_to_top_up')} $ ${rfidData.top_up} ?`
    response_msg = t('top_up_successful')
    cash = rfidData.top_up
  }
  else if (type === 'refund') {
    if (!(rfidData.refund > 0 && rfidData.refundCheck === true)) {
      return
    }
    else if (rfidData.cash <= 0) {
      ElNotification({
        title: t('error'),
        message: t('rfid_card_is_non_refundable_as_the_amount_must_be_greater_than_0'),
        type: 'error',
      });
      rfidData.refundCheck = false
      return
    }
    messages = `${t('are_you_sure_to_refund')} $ ${rfidData.refund} ?`
    response_msg = t('refund_successful')
    cash = rfidData.refund * (-1)
  }

  try {
    ElMessageBox.confirm( messages, t('warning'), {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      })
      .then(async() => {
        const json = JSON.stringify({ id: general._id, rfid: {rfid: rfidData.rfid.toUpperCase(), cash: Number(cash)} })
        let res = await MsiApi.set_rfid_cash(json)
        if (res.data.status === 'Accepted') {
          await getRfidUserData()
          await getTransactionData(null)
          getTransaction_PageData()
          TransactionTableRef.value.sort('created_date_str', 'ascending')
          rfids.forEach((item) => {
            if (rfidData.rfid.toUpperCase() === item.rfid) {
              rfidData.cash = item.cash
              rfidData.cash_str = item.cash_str
            }
          })
          ElMessage({
            type: 'success',
            message: response_msg,
          })
        }
        else {
          ElMessage.error(t('error'))
        }
      })
      .catch((e) => {
        if (type === 'top_up') {
          rfidData.top_up = ''
          rfidData.topUpCheck = false
        }
        else if (type === 'refund') {
          rfidData.refund = ''
          rfidData.refundCheck = false
        }
      })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const checkRfidCard = async() => {
  try {
    let response = await MsiApi.get_account_info('rfid')
    let RfidUserData = response.data.data.rfid_infos
    for (let i=0; i<RfidUserData.length; i++) {
      if (RfidUserData[i].rfid === rfidData.rfid.toUpperCase()) {
        if (RfidUserData[i].tag_id === general.tag_id && rfidData.index === undefined) {
          ElMessage({ type: 'error', message: t('card_number_already_exists') })
          return false
        }
        else if (RfidUserData[i].tag_id !== general.tag_id) {
          let user_name = RfidUserData[i].name
          ElMessage({ type: 'error', message: t(`card_number_is_duplicated_with_user`, { user_name }) })
          return false
        }
      }
    }
    return true
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
    return false
  }
}
const confirmRfid = (action, index) => {
  try {
    if (action === 'confirm') {
      rfidData_ref.value.validate(async valid => {
        if (valid && await checkRfidCard() === true) {
          EditRfidFormVisible.value = false
          // Add RFID Card
          if (modify_card_index.value === -1) {
            const json = JSON.stringify({ id: general._id, rfid: {rfid: rfidData.rfid.toUpperCase(), cash: parseInt(rfidData.cash), enable: rfidData.enable, nickname: rfidData.nickname} })
            let res = await MsiApi.add_rfid_data(json)
            if (res.data.status === 'Accepted') {
              ElMessage({ type: 'success', message: `${t('add')} ${rfidData.rfid.toUpperCase()} ${t('card_no')}` })
              await getRfidUserData()
              await getTransactionData(null)
              getTransaction_PageData()
              TransactionTableRef.value.sort('created_date_str', 'ascending')
            }
            else {
              ElMessage.error(t('error'))
            }
          }
          // Edit RFID Card
          else {
            const json = JSON.stringify({ id: general._id, rfid: {rfid: rfidData.rfid.toUpperCase(), enable: rfidData.enable, nickname: rfidData.nickname} })
            let res = await MsiApi.edit_rfid_data(json)
            if (res.data.status === 'Accepted') {
              await getRfidUserData()
            }
            else {
              ElMessage.error(t('error'))
            }
          }
        }
        else {
          return false
        }
      })
    }
    else if (action === 'cancel') {
      EditRfidFormVisible.value = false
    }
    else if (action === 'delete') {
      if (index !== undefined) {
        modify_card_index.value = index
      }
      if (real_time.length !== 0) {
        ElMessageBox.alert(t('rfid_card_cannot_be_removed_because_the_evse_is_occupied'), t('warning'), { confirmButtonText: t('ok'), type: 'warning', 'close-on-click-modal': true })
      }
      else if (rfids[modify_card_index.value].cash !== 0) {
        ElMessageBox.alert(t('rfid_card_cannot_be_removed_because_the_amount_is_not_0'), t('warning'), { confirmButtonText: t('ok'), type: 'warning', 'close-on-click-modal': true })
      }
      else {
        ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          let res = await MsiApi.delete_rfid_data({ id: general._id, rfid: rfids[modify_card_index.value].rfid })
          if (res.data.status === 'Accepted') {
            await getRfidUserData()
            await getTransactionData(null)
            getTransaction_PageData()
            TransactionTableRef.value.sort('created_date_str', 'ascending')
          }
          else {
            ElMessage.error(t('error'))
          }
        })
        .catch((e) => {
        })
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const card_detail = (data, index) => {
  rfid_title.value= t('edit_rfid')
  EditRfidFormVisible.value = true
  modify_card_index.value = rfids.indexOf(data)
  rfidData.rfid = data.rfid
  rfidData.cash = data.cash
  rfidData.cash_str = data.cash_str
  rfidData.enable = data.enable
  rfidData.nickname = data.nickname
  rfidData.index = index
  rfidData.top_up = ''
  rfidData.refund = ''
  rfidData.topUpCheck = false
  rfidData.refundCheck = false
}

const getRfidUserData = async() => {
  try {
    let response = await MsiApi.get_account_detail('rfid', user_id)
    let localTime = null
  
    general.length = 0
    Object.assign(general, response.data.data.general)
    localTime = new Date(new Date(general.updated_date).getTime() + MStore.timeZoneOffset * -60000)
    general.updated_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
    localTime = new Date(new Date(general.create_date).getTime() + MStore.timeZoneOffset * -60000)
    general.create_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
    general.total_amount_str = general.total_amount.toLocaleString()
  
    real_time.length = 0
    Object.assign(real_time, response.data.data.real_time)
    
    rfids.length = 0
    Object.assign(rfids, response.data.data.rfids)
    rfids.forEach((item) => {
      item.cash_str = item.cash.toLocaleString()
    })
    
    summary.length = 0
    Object.assign(summary, response.data.data.summary)
    summary.cost_str = summary.cost.toLocaleString()
  
    let time = moment.duration(summary?.charging_time, 'seconds')
    let timeFormat = moment({ h: time.hours(), m: time.minutes(), s: time.seconds()}).format('HH:mm:ss')
    summary.charging_time_str = timeFormat
    
    occupied_str.value = real_time[0]
    occupied_detail_str.value = ''
    if (real_time.length > 1) {
      occupied_str.value += ' / ...'
  
      for (let i=0; i<real_time.length; i++) {
        occupied_detail_str.value += real_time[i]
        if (i !== real_time.length-1) {
          occupied_detail_str.value += ' / '
        }
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const getTransactionData = async(filters) => {
  try {
    if (select_time.value === null) {
      return
    }
    const startTime = new Date(select_time.value[0].getTime() - MStore.timeZoneOffset * -60000)
    const endTime = new Date(select_time.value[1].getTime() - MStore.timeZoneOffset * -60000)
    let response = await MsiApi.get_user_payment({role: 'rfid', id:  user_id, start_date: startTime, end_date: endTime})
    paymentData.length = 0
    response.data?.data?.forEach((item) => {
      if (filters === null || filters?.tag.length === 0 || filters?.tag.includes(item?.type)) {   // filters?.tag.some(i => item?.type.includes(i))
        let localTime = new Date(new Date(item.created_date).getTime() + MStore.timeZoneOffset * -60000)
        item.created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        item.balance_str = item.balance.toLocaleString()
        item.money_str = item.money.toLocaleString()
        if (item.charging_price) {
          item.charging_energy_str = item.charging_energy.toLocaleString()
          item.charging_price_str = item.charging_price.toLocaleString()
        }
        if (item.parking_price) {
          item.parking_price_str = item.parking_price.toLocaleString()
        }
        switch (item.type) {
          case 'Charging':
            item.type_str  = t('charging')
          break
          case 'Parking':
            item.type_str  = t('parking')
          break
          case 'Charging+Parking':
            item.type_str  = t('charging') + '+' + t('parking')
          break
          default:
          break
        }
        paymentData.push(item)
      }
    })
    response = await MsiApi.get_user_cash({role: 'rfid', id:  user_id, start_date: startTime, end_date: endTime})
    response.data?.data?.forEach((item) => {
      if (filters === null || filters?.tag.length === 0 || filters?.tag.includes(item?.type)) {
        let localTime = new Date(new Date(item.created_date).getTime() + MStore.timeZoneOffset * -60000)
        item.created_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        item.balance_str = item.balance.toLocaleString()
        item.money_str = item.money.toLocaleString()
        switch (item.type) {
          case 'Top-up':
            item.type_str  = t('top_up')
          break
          case 'Refund':
            item.type_str  = t('refund')
          break
          default:
          break
        }
        paymentData.push(item)
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const getTransaction_PageData = async() => {
  let table_body_height = window.innerHeight - 410 - 45
  item_count.value = Math.floor(table_body_height / 45)
  max_page.value = Math.ceil(paymentData.length / item_count.value) * 10

  let count = item_count.value
  paymentPageData.length = 0
  if (cur_page.value * 10 === max_page.value) {
    count = paymentData.length - (cur_page.value-1) * item_count.value
  }
  else if (max_page.value === 0) {
    count = 0
  }
  for (let i=0; i<count; i++) {
    paymentPageData.push(paymentData[(cur_page.value - 1) * item_count.value + i])
  }
}

onMounted(async () => {
  if (route.query.start_time && route.query.end_time) {
    select_time.value[0] = new Date(route.query.start_time)
    select_time.value[1] = new Date(route.query.end_time)
    activeName.value = 'second'
  }
  await getRfidUserData()
  await getTransactionData(null)

  getTransaction_PageData()
  TransactionTableRef.value.sort('created_date_str', 'ascending')
  window.addEventListener("resize", async function () {
    getTransaction_PageData()
  })
})
onUnmounted(() => {
  if (stopWatch) stopWatch();
});

</script>

<template>
  <div class="rifd-user-detail">
    <div class="container lg pb-40px">
      <p class="text-36px pt-24px pb-32px">{{ general.name }}</p>

      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('general')" name="first">
            <div class="flex flex-col 2xl:flex-row">
              <div class="general-info overflow-x-auto scrollbar py-24px lg:pr-24px">
                <div class="card-container card-rounded box-shadow  p-4 md:p-6">
                  <div class="flex justify-between">
                    <div class="flex">
                      <font-awesome-icon
                        class="icon w-24px h-24px mr-8px"
                        icon="fa-regular fa-user"
                      />
                      <span class="line-height-24px">{{ t('general_info') }}</span>
                    </div>
                    <el-button link type="primary" v-if="MStore.rule_permission.RfidUserDetail.userEdit === 'O' || MStore.permission.isCompany" @click="editUser()">
                      <font-awesome-icon
                        class="text-gray-300 w-32px h-32px"
                        icon="fa-regular fa-pen-to-square"
                      />
                    </el-button>
                  </div>
                  <div class="flex-col lg:flex-row">
                    <el-skeleton :rows="8" v-if="isLoading_skeleton" />
                    <div v-if="isLoading_skeleton === false" class="mt-16px lg:w-50%">
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('id') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ general.tag_id }}</span>
                      </div>
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('phone') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ general.phone }}</span>
                      </div>
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('updated_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ general.updated_date_str }}</span>
                      </div>
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('created_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ general.create_date_str }}</span>
                      </div>
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('status') }}</span>
                        <span v-if="general.permission?.active === true" class="line-height-32px font-500 text-blue-1200">{{ t('active') }}</span>
                        <span v-else-if="general.permission?.active === false" class="line-height-32px font-500 text-blue-1200">{{ t('disable') }}</span>
                      </div>
                    </div>
                    <div
                      v-if="isLoading_skeleton === false"
                      class="mt-0px lg:mt-16px lg:w-50%"
                    >
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('total_rfid') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ general.total_rfid }}</span>
                      </div>
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('total_amount') }}</span>
                        <span v-if="general.total_amount < 0" class="line-height-32px font-500 text-red">
                          <strong class="text-12px">$ </strong> 
                          {{ general.total_amount_str }}
                        </span>
                        <span v-else class="line-height-32px">$ {{ general.total_amount_str }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex-col w-full 2xl:flex-col 2xl:w-40%">
                <div class="real-time-info overflow-x-auto scrollbar py-24px lg:pr-10px">
                  <div class="card-container card-rounded box-shadow p-4 md:p-6">
                    <div class="flex">
                      <img
                        class="icon w-24px h-24px mr-8px"
                        src="@/assets/img/customer_time.png"
                        alt=""
                      />
                      <span class="line-height-24px">{{ t('real_time_info') }}</span>
                    </div>
                    <el-skeleton :rows="2" v-if="isLoading_skeleton" class="mt-16px" />
                    <div v-if="isLoading_skeleton === false" class="md:flex mt-16px">
                      <span class="info-item min-w-150px">{{ t('occupied_evse_id') }}</span>
                      <p
                        v-if="occupied_detail_str === ''"
                        class="line-height-32px font-500 text-blue-1200"
                      >
                        {{ occupied_str }}
                      </p>
                      <el-tooltip v-else placement="bottom-start">
                        <template #content>
                          <div v-html="occupied_detail_str"></div>
                        </template>
                        <el-button class="overflow-hidden border-0 evse-tooltip-btn">
                          <span
                            class="font-400 text-16px line-height-32px text-black-200"
                          >
                            {{ occupied_str }}
                          </span>
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
                <div class="total-record-info overflow-x-auto scrollbar py-24px lg:pr-10px">
                  <div class="card-container card-rounded box-shadow p-4 md:p-6">
                    <div class="flex">
                      <font-awesome-icon
                        class="icon w-24px h-24px mr-8px"
                        icon="fa-solid fa-chart-line"
                      />
                      <span class="line-height-24px">{{ t('usage_summary') }}</span>
                    </div>

                    <el-skeleton :rows="3" v-if="isLoading_skeleton" class="mt-16px" />

                    <div v-if="isLoading_skeleton === false" class="mt-16px">
                      <span class="info-item min-w-150px">{{ t('total_used_power') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ summary.power }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_cost') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ summary.cost_str }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_times') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ summary.times }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_charging_time') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ summary.charging_time_str }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="rfid-info overflow-x-auto scrollbar py-24px lg:pr-10px">
              <div class="card-container card-rounded box-shadow p-4 md:p-6">
                <div class="md:flex justify-between mb-24px min-w-250px">
                  <div class="flex mb-8px md:mb-0">
                    <img
                      class="icon w-24px h-24px mr-8px"
                      src="@/assets/img/customer_rfid.png"
                      alt=""
                    />
                    <span class="line-height-24px">{{ t('rfid') }}</span>
                  </div>
                  <el-button v-if="MStore.rule_permission.RfidUserDetail.addRFID === 'O' || MStore.permission.isCompany"
                    class="button h-32px w-full md:w-150px" round @click="editRfid">
                    <!-- <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> -->
                    {{ t('add_rfid') }}
                  </el-button>
                </div>
                <div class="flex flex-wrap">
                  <div
                    v-for="(item, index) in rfids"
                    :key="item.value"
                    class="rfid-card box-shadow"
                  >
                    <div class="h-99px">
                      <div class="flex justify-between">
                        <span class="text-16px pt-16px pb-16px pl-16px pr-16px">{{
                          item.rfid
                        }}</span>
                        <div class="pt-5px pr-16px">
                          <el-button
                            v-if="MStore.rule_permission.RfidUserDetail.deleteRFID === 'O' || MStore.permission.isCompany"
                            link
                            type="primary"
                            size="large"
                            @click="confirmRfid('delete', index)"
                          >
                            <img
                              class="text-blue-1100 w-24px h-24px"
                              src="@/assets/img/tariff_delete1.png"
                              alt=""
                            />
                          </el-button>
                          <el-button
                            v-if="MStore.rule_permission.RfidUserDetail.editRFID === 'O' || MStore.permission.isCompany"
                            link
                            type="primary"
                            size="large"
                            @click="card_detail(item, index)"
                          >
                            <font-awesome-icon
                              class="text-blue-1100 w-24px h-24px"
                              icon="fa-regular fa-pen-to-square"
                            />
                          </el-button>
                        </div>
                      </div>
                      <p class="text-24px pl-16px">{{ item.nickname }}</p>
                    </div>
                    <div class="rfid-card-down bg-blue-100 h-50px rounded-b-10px">
                      <p v-if="item.cash < 0" class="pl-16px pr-16px text-red">$ {{ item.cash_str }}</p>
                      <p v-else class="pl-16px pr-16px">$ {{ item.cash_str }}</p>
                      <p class="enable pl-16px pr-16px" v-if="item.enable">
                        {{ t('enable') }}
                      </p>
                      <p class="disable pl-16px pr-16px" v-else>{{ t('disable') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('transaction')" name="second">
            <div class="flex justify-between flex-wrap lg:flex-nowrap pt-24px pb-32px">
              <div class="date-picker w-full blue-1100">
                <el-date-picker
                  v-model="select_time"
                  class="mr-16px rounded-full"
                  type="datetimerange"
                  range-separator="-"
                  :prefix-icon="Calendar"
                  :start-placeholder="t('start_date')"
                  :end-placeholder="t('end_date')"
                  @change="select_date()"
                  :default-time="defaultTime"
                />
              </div>
              <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-end items-center">
                <div class="w-full lg:w-auto flex justify-between md:justify-start">
                  <div
                    class="checkbox-container w-full lg:w-auto flex justify-between md:justify-start"
                  >
                    <el-checkbox
                      class="mr-0 md:mr-30px"
                      v-model="parking_visible"
                      :label="t('parking')"
                    />
                    <el-checkbox v-model="charging_visible" :label="t('charging')" />
                  </div>
                </div>
                <el-button
                  class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px lg:mr-10px box-shadow"
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
              <el-table
                ref="TransactionTableRef"
                :data="paymentPageData"
                class="white-space-nowrap text-primary"
                height="calc(100vh - 380px)"
                style="width: 100%"
                stripe
                size="large"
                :cell-style="msi.tb_cell"
                :header-cell-style="msi.tb_header_cell"
                @sort-change="tableSort"
                @filter-change="tableFilter"
                :default-sort="{ prop: 'created_date_str', order: 'ascending' }"
              >
                <el-table-column
                  prop="type_str"
                  :label="t('type')"
                  align="center"
                  :filters="filters"
                  :column-key="'tag'"
                  min-width="250"
                />

                <el-table-column :label="t('station')" align="center" min-width="550">
                  <el-table-column
                    prop="location_name"
                    :label="t('name')"
                    sortable="custom"
                    align="center"
                    min-width="250"
                  />
                  <el-table-column
                    prop="evse_id"
                    :label="t('evse_id')"
                    sortable="custom"
                    align="center"
                    min-width="300"
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
                    prop="parking_car_num_str"
                    :label="t('license_plate')"
                    header-align="center"
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
                    header-align="center"
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
                </el-table-column>

                <el-table-column
                  prop="money_str"
                  :label="t('final_paid')"
                  sortable="custom"
                  header-align="center"
                  align="right"
                  min-width="180"
                />

                <el-table-column
                  prop="rfid"
                  :label="t('rfid_num')"
                  sortable="custom"
                  align="center"
                  min-width="150"
                />

                <el-table-column
                  prop="balance_str"
                  :label="t('balance')"
                  sortable="custom"
                  header-align="center"
                  align="right"
                  min-width="150"
                >
                  <template #default="scope">
                    <span v-if="scope.row.balance < 0" class="text-red">{{ scope.row.balance_str }}</span>
                    <span v-else>{{ scope.row.balance_str }}</span>
                  </template>
                </el-table-column>

                <el-table-column
                  prop="created_date_str"
                  :label="t('created_time')"
                  sortable="custom"
                  align="center"
                  min-width="200"
                />
              </el-table>
              <el-pagination 
                class="justify-center"
                layout="prev, pager, next" 
                :total="max_page" 
                v-model:current-page="cur_page" 
                @current-change="getTransaction_PageData" 
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <el-dialog
        v-model="EditUserFormVisible"
        class="max-w-600px"
        width="90%"
        draggable
        @closed="userData_ref.clearValidate()"
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ t('edit_user') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <el-form
            class="max-w-500px m-auto"
            :rules="userData_rules"
            ref="userData_ref"
            :model="userDataMod"
            label-width="80px"
            label-position="left"
            :scroll-to-error="true"
          >
            <el-form-item :label="t('id')" prop="id">
              <el-input v-model="userDataMod.id" disabled />
            </el-form-item>
            <el-form-item :label="t('name')" prop="name">
              <el-input v-model="userDataMod.name" />
            </el-form-item>
            <el-form-item :label="t('phone')" prop="phone">
              <el-input v-model="userDataMod.phone" />
            </el-form-item>
            <el-form-item :label="t('active')">
              <el-switch v-model="userDataMod.permission_active_str" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button
              round
              class="w-48% bg-btn-100 text-white max-w-140px"
              @click="editUserDialog('delete')"
              >{{ t('delete') }}</el-button
            >
            <el-button
              round
              class="w-48% bg-btn-100 text-white max-w-140px"
              @click="editUserDialog('cancel')"
              >{{ t('cancel') }}</el-button
            >
            <el-button
              round
              class="w-48% bg-btn-200 text-white max-w-140px"
              @click="editUserDialog('confirm')"
              >{{ t('confirm') }}</el-button
            >
          </span>
        </template>
      </el-dialog>

      <el-dialog
        v-model="EditRfidFormVisible"
        class="max-w-600px"
        width="90%"
        draggable
        @closed="rfidData_ref.clearValidate()"
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ rfid_title }}
            </h4>
          </div>
        </template>
        <div class="dialog-context pr-10px">
          <el-form
            class="max-w-500px m-auto"
            :rules="rfidData_rules"
            ref="rfidData_ref"
            :model="rfidData"
            label-position="left"
            :scroll-to-error="true"
          >
            <el-form-item class="block md:flex" :label="t('number')" prop="rfid">
              <el-input v-model="rfidData.rfid" :disabled="rfid_title === t('edit_rfid')"/>
            </el-form-item>
            <el-form-item class="block md:flex" v-if="rfid_title === t('edit_rfid')" :label="t('amount')" prop="cash">
              <el-input v-model="rfidData.cash_str" disabled/>
            </el-form-item>
            <el-form-item class="block md:flex" :label="t('name')" prop="nickname">
              <el-input v-model="rfidData.nickname" />
            </el-form-item>
            <el-form-item class="block md:flex" :label="t('enable')" prop="enable">
              <el-switch v-model="rfidData.enable" />
            </el-form-item>

            <el-form-item
              class="block md:flex"
              v-if="rfid_title === t('edit_rfid')"
              :label="t('top_up')" prop="top_up">
              <div class="flex w-full">
                <el-input
                  v-model="rfidData.top_up"
                  :disabled="rfidData.topUpCheck"
                  :formatter="(value) => `${value}`.replace(/[^\d.]/g, '')"
                  class="w-full mr-0px"
                />
                <el-checkbox-button 
                  class="rfid-checkbox" 
                  label="check" 
                  v-model.number="rfidData.topUpCheck"
                  :disabled="rfidData.isTopUPCheck"
                  @change="updateRfidCash('top_up')"
                >
                  {{ t('check') }}
                </el-checkbox-button>
              </div>
            </el-form-item>
            <el-form-item 
              class="block md:flex"
              v-if="rfid_title === t('edit_rfid')"
              :label="t('refund')" prop="refund">
              <div class="flex w-full">
                <el-input 
                  v-model="rfidData.refund" 
                  :disabled="rfidData.refundCheck"
                  :formatter="(value) => `${value}`.replace(/[^\d.]/g, '')"
                  class="w-full mr-0px" 
                />
                <el-checkbox-button class="rfid-checkbox" 
                  label="check" 
                  v-model="rfidData.refundCheck"
                  :disabled="rfidData.isRefundCheck"
                  @change="updateRfidCash('refund')"
                >
                  {{ t('check') }}
                </el-checkbox-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button
              round
              class="w-48% bg-btn-100 text-white max-w-140px"
              @click="confirmRfid('cancel', undefined)"
              >{{ t('cancel') }}</el-button
            >
            <el-button
              round
              class="w-48% bg-btn-200 text-white max-w-140px"
              @click="confirmRfid('confirm', undefined)"
              >{{ t('confirm') }}</el-button
            >
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rifd-user-detail {
  .card-container {
    height: 100%;
    border: 2px solid var(--gray-100);
    min-width: fit-content;
  }
  .info-item {
    display: inline-block;
    width: fit-content;
    line-height: 32px;
    margin-right: 10px;
    font-size: 14px;
    @media (min-width: 768px) {
      font-size: 16px;
      margin-right: 20px;
    }
  }
  .general-info {
    @media (min-width: 1400px) {
      width: 60%;
    }
  }
  .real-time-info {
    width: 100%;
    @media (min-width: 1400px) {
      width: 100%;
    }
  }
  .total-record-info {
    width: 100%;
    @media (min-width: 1400px) {
      width: 100%;
    }
  }
  .rfid-info {
    .rfid-card {
      width: 100%;
      height: 150px;
      border-radius: 16px;
      margin: 0 0px 20px 0;
      border: 2px solid var(--gray-100);
      @media (min-width: 992px) {
        width: 380px;
        margin-right: 20px;
      }
    }
    .rfid-card-down {
      border-top: 2px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .enable {
    font-weight: 600;
    color: var(--blue-800);
  }
  .disable {
    font-weight: 600;
    color: var(--Error);
  }
  .icon {
    color: var(--blue-1100);
  }
  .button {
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--secondary);
    border-color: var(--secondary);
    border-radius: 2rem;
    @media (min-width: 768px) {
      width: 18rem;
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
  .checkbox-container {
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
}
:deep(.el-form-item__label) {
  width: 102px;
  display: block;
  font-size: 1.6rem;
}
.rfid-checkbox :deep(.el-checkbox-button__inner) {
  background-color: var(--secondary);
  color: var(--white);
  border: 0;
}
.rfid-checkbox.is-disabled :deep(.el-checkbox-button__inner) {
  background-color: var(--gray-200);
  color: var(--gray-300);
}
</style>
