<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import Calendar from '@/components/icons/IconCalendar.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { export_json_to_excel }  from '@/composables/Export2Excel'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore();
const company = MStore?.permission?.company?.name
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const user_id = route.query.id
const modify_card_index = ref(-1)
const EditCustomerFormVisible = ref(false)
const EditRfidFormVisible = ref(false)
const BindingCardDialogVisible = ref(false)
const DeviceDialogVisible = ref(false)
const notificationDialogVisible = ref(false)
const userData = reactive([])
const userDataMod = reactive([])
const userData_ref = ref()
const SendNotification = async (action) => {
  if (action === 'cancel') {
    NotificationData.title = NotificationData.body = NotificationData.route = ''
    notificationDialogVisible.value = false
  }
  else if (action === 'confirm') {
    let sendData = { users:[userData.email], title:NotificationData.title, body:NotificationData.body, data: {route:NotificationData.route}}
    console.log(sendData)
    let response = await MsiApi.sendNotification (sendData)
    console.log(response)
    NotificationData.title = NotificationData.body = NotificationData.route = ''
    notificationDialogVisible.value = false
  }

}
const userData_rules = reactive({
  first_name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  last_name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  // email: [
  //   { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  // ],
})
const paymentData = reactive([])
const activeName = ref('first')
const user_type = reactive([])
const rfidData = reactive({ rfid: '', cash: 0, enable: true, nickname: '' })
const NotificationData = reactive({ title: '', data: '', route: ''})
const rfid_title = ref(t('add_rfid'))
const rfidData_ref = ref()
const rfidData_rules = reactive({
  rfid: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  cash: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})



const isLoading_skeleton = ref(true)
const parking_visible = ref(true)
const charging_visible = ref(true)
const now = new Date()
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
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
    'Created Time'
  ]
  const filterVal = [
    'location_name',
    'evse_id',
    'parking_time_str',
    'parking_price_str',
    'parking_currency_str',
    'parking_car_number_str',
    'charge_time_str',
    'charge_kwh_str',
    'charge_price_str',
    'charge_currency_str',
    'price',
    'currency',
    'paymethod_str',
    'created_date_str'
  ]
  const data = paymentData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'User Payment' })
}
const select_date = async () => {
  try {
    if (select_time.value === null) {
      return
    }
    let queryData = { "database": "CPO", "collection": "PaymentHistory", 
      "pipelines": [ 
        {
          "$match": {
            "$expr": { 
              "$and" : [ 
                { "$gte" : [ "$created_date", { "$dateFromString": {"dateString": select_time.value[0]}}]},
                { "$lte" : [ "$created_date", { "$dateFromString": {"dateString": select_time.value[1]}}]}
              ]
            }
          }
        },
      ]
    }
    let localEndTime = ''
    let response = await MsiApi.mongoAggregate(queryData)
    let PaymentDataAll = []
    PaymentDataAll = response.data.result
    paymentData.length = 0
    let cost_str = 0
    let charge_time_sec = 0
    let charge_kwh = 0
  
    for (let i = 0; i < userData?.payment_history?.length; i++) {
      for (let j = 0; j < PaymentDataAll.length; j++) {
        if (userData.payment_history[i] === PaymentDataAll[j]._id) {
          paymentData.push(PaymentDataAll[j])
        }
      }
    }
    paymentData.amount_str = paymentData.length
    for (let i = 0; i < paymentData.length; i++) {
      localEndTime =  new Date( (new Date(paymentData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      paymentData[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
      cost_str += paymentData[i].price
      paymentData[i].price_str = paymentData[i].price.toLocaleString()
      for (let j = 0; j < paymentData[i].operator_types.length; j++) {
        if (paymentData[i].operator_types[j].type === 'charge') {
          charge_time_sec += paymentData[i].operator_types[j].time
          charge_kwh += paymentData[i].operator_types[j].kwh
          let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
          paymentData[i].charge_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          paymentData[i].charge_price_str = paymentData[i].operator_types[j].price.toLocaleString()
          paymentData[i].charge_kwh_str = paymentData[i].operator_types[j].kwh
          paymentData[i].charge_currency_str = paymentData[i].operator_types[j]?.currency
        }
        else if (paymentData[i].operator_types[j].type === 'parking') {
          let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
          paymentData[i].parking_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          paymentData[i].parking_price_str = paymentData[i].operator_types[j].price.toLocaleString()
          paymentData[i].parking_car_number_str = paymentData[i].operator_types[j].car_num
          paymentData[i].parking_currency_str = paymentData[i].operator_types[j]?.currency
        }
      }
      switch (paymentData[i].paymethod.method) {
        case 'CREDIT':
          paymentData[i].paymethod_str = t('credit_card')
          break
        case 'GOOGLEPAY':
          paymentData[i].paymethod_str = t('google_pay')
          break
        case 'SAMSUNGPAY':
          paymentData[i].paymethod_str = t('samsung_pay')
          break
        case 'RFID':
          paymentData[i].paymethod_str = t('rfid')
          break
        case 'FREE':
          paymentData[i].paymethod_str = t('free')
          break
        default:
          paymentData[i].paymethod_str = paymentData[i]?.paymethod?.method
          break
      }
      switch (paymentData[i].currency) {
        case 'TWD':
          paymentData[i].currency = t('twd')
          break
        case 'USD':
          paymentData[i].currency = t('usd')
          break
        case 'JPY':
          paymentData[i].currency = t('jpy')
          break
        case 'EUR':
          paymentData[i].currency = t('eur')
          break
        default:
          break
      }
    }
    paymentData.cost_str = cost_str
    paymentData.charge_kwh = charge_kwh
    paymentData.charge_hr = moment( {h:moment.duration(charge_time_sec, 'second').hours()}).format('HH')
    paymentData.charge_min = moment( {m:moment.duration(charge_time_sec, 'second').minutes()}).format('mm')
    paymentData.charge_sec = moment( {s:moment.duration(charge_time_sec, 'second').hours()}).format('ss')
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const filters = [
  { text: t('credit_card'), value: t('credit_card') },
  { text: t('rfid'), value: t('rfid') },
  { text: t('free'), value: t('free') },
  { text: t('google_pay'), value: t('google_pay') },
  { text: t('samsung_pay'), value: t('samsung_pay') },
]
const filterTag = (value, rowData) => {
  return rowData.paymethod_str === value
}
const sortFunc = (obj1, obj2, column) => {
  let convertedNumber1 = undefined
  let convertedNumber2 = undefined
  if(column === 'parking_price_str' || column === 'price_str' || column === 'charge_price_str') {   
    if (obj1[column] !== undefined) {
      convertedNumber1 = parseFloat(obj1[column].replace(/,/g, ""))
    }
    if (obj2[column] !== undefined) {
      convertedNumber2 = parseFloat(obj2[column].replace(/,/g, ""))
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

const tableRowClassName = (row) => {
  if (row.row.card_enable === false) {
    return 'disable-row'
  }
}


const clearEvseList = async () => {
  try {
    ElMessageBox.confirm(t('do_you_want_to_clear'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
      .then(async () => {
        let sendData = { 'class': 'UserData', 'pk': userData._id, 'evse_list': [] }
        let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
        if (res.status === 200) {
          userData.evse_list_id = ''
          userData.evse_list_id_detail = ''
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const binding_card_detail = () => {
  BindingCardDialogVisible.value = true

}
const device_detail = () => {
  DeviceDialogVisible.value = true
}

const notification = () => {
  notificationDialogVisible.value = true
}

const card_detail = (data, index) => {
  rfid_title.value= t('edit_rfid')
  EditRfidFormVisible.value = true
  modify_card_index.value = userData.rfids.indexOf(data)
  rfidData.rfid = data.rfid
  rfidData.cash = data.cash
  rfidData.enable = data.enable
  rfidData.nickname = data.nickname
  rfidData.index = index
}

const checkRfidCard = async() => {
  try {
    let queryData = { 
      "database": 'CPO', 
      "collection": 'UserData', 
      "pipelines": [
        {
          $unwind: "$rfids"
        },
        { 
          $match: { 
            $and: [
              {
                "rfids.rfid": rfidData.rfid.toUpperCase()
              },
              {
                _id: { $ne: {"ObjectId" : userData._id}}
              }
            ]
          },
        },
        {
          $project: { _id: 1, first_name: 1, last_name: 1, rfids: 1 } 
        }
      ]
    }
    let response = await MsiApi.mongoAggregate(queryData) 
    if (response.data.result.length !== 0) {
      let user_name = response.data.result[0].first_name + ' ' + response.data.result[0].last_name
      ElMessage({ type: 'error', message: t(`card_number_is_duplicated_with_user`, { user_name }) })
      return false
    }
    
    for (let i=0; i<userData.rfids.length; i++) {
      if (rfidData.rfid.toUpperCase() === userData.rfids[i].rfid.toUpperCase() && rfidData.index !== i) {
        ElMessage({ type: 'error', message: t('card_number_already_exists') })
        return false
      }
    }
  
    return true
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
    return false
  }
}
const confirmRfid = async (confirm, index) => {

  // const hex_pair= rfidData.rfid.match(/.{1,2}/g)
  // const reversedHexPairs = hex_pair.reverse().map(pair => pair.split('').join(''));  
  // const reversedHex = reversedHexPairs.join('');
  // console.log(reversedHex)

  try {
    if (confirm === 'confirm') {
      rfidData_ref.value.validate(async valid => {
        if (valid && await checkRfidCard() === true) {
          EditRfidFormVisible.value = false
          if (modify_card_index.value === -1) {
            userData.rfids.push({
              rfid: rfidData.rfid.toUpperCase(), cash: parseInt(rfidData.cash),
              enable: rfidData.enable, nickname: rfidData.nickname
            })
            let sendData = { 'class': 'UserData', 'pk': userData._id, 'rfids': userData.rfids }
            let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
            if (res.status === 200) {
              ElMessage({ type: 'success', message: `${t('add')} ${rfidData.rfid.toUpperCase()} ${t('card_no')}` })
            }
            else {
              userData.rfids.pop()
              // ElMessage.error(t('error'))
              ElMessage.error(res.response.data.message)
            }
          }
          else {
            userData.rfids[modify_card_index.value].rfid = rfidData.rfid.toUpperCase()
            userData.rfids[modify_card_index.value].cash = rfidData.cash
            userData.rfids[modify_card_index.value].enable = rfidData.enable
            userData.rfids[modify_card_index.value].nickname = rfidData.nickname
            let sendData = { 'class': 'UserData', 'pk': userData._id, 'rfids': userData.rfids }
            MsiApi.setCollectionData('patch', 'cpo', sendData)
          }
        }
        else {
          return false
        }
      })
    }
    else if (confirm === 'delete') {
      ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          if (index !== undefined) {
            modify_card_index.value = index
          }
          userData.rfids.splice(modify_card_index.value, 1)
          let sendData = { 'class': 'UserData', 'pk': userData._id, 'rfids': userData.rfids }
          await MsiApi.setCollectionData('patch', 'cpo', sendData)
        })
        .catch((e) => {
          console.log(e)
        })
    }
    else if (confirm === 'cancel')
      EditRfidFormVisible.value = false
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const GetPermission = async () => {
  try {
    let queryData = { 
      database: 'CPO', 
      collection: 'UserPermission', 
      pipelines: [
        { 
          $project: { _id: 1, name: 1 } 
        }
      ]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    user_type.length = 0
    let member_permission = []
    for (let i = 0; i < response.data.result.length; i++) {
      if (response.data.result[i].name === 'AnonymousUser' || response.data.result[i].name === 'MemberUser') {
        member_permission.push(response.data.result[i])
      }
    }
    Object.assign(user_type, member_permission)
    for (let i=0; i<user_type.length; i++) {
      switch (user_type[i].name) {
        case 'AnonymousUser':
          user_type[i].name = t('anonymous_user')
          break
        case 'AdminUser':
          user_type[i].name = t('admin_user')
          break
        case 'CustomerServiceUser':
          user_type[i].name = t('customer_service_user')
          break
        case 'DeveloperUser':
          user_type[i].name = t('developer_user')
          break
        case 'EngineerUser':
          user_type[i].name = t('engineer_user')
          break
        case 'MemberUser':
          user_type[i].name = t('member_user')
          break
        default:
          break
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const editRfid = () => {
  modify_card_index.value = -1
  rfid_title.value= t('add_rfid')
  EditRfidFormVisible.value = true
  rfidData.rfid = ''
  rfidData.cash = ''
  rfidData.nickname = ''
  rfidData.enable = true
}

const editUser = () => {
  userDataMod.first_name = userData.first_name
  userDataMod.last_name = userData.last_name
  userDataMod.email = userData.email
  userDataMod.phone = userData.phone
  userDataMod.permission_str = userData.permission_str
  userDataMod.permission_active_str = userData.permission.active
  EditCustomerFormVisible.value = true 
  GetPermission()
}

const editUserDialog = (action) => {
  try {
    if (action === 'confirm') {
      userData_ref.value.validate(valid => {
        if (valid) {
          EditCustomerFormVisible.value = false
          let permission_id = ''
          for (let i = 0; i < user_type.length; i++) {
            if (user_type[i].name === userDataMod.permission_str) {
              permission_id = user_type[i]._id
            }
          }
          
          ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
            .then(async () => {
              let sendData = { class: 'UserData', pk: userData._id, first_name: userDataMod.first_name, last_name: userDataMod.last_name,
                email: userDataMod.email , phone: userDataMod.phone , permission: { user: permission_id, active: userDataMod.permission_active_str },
              }
              let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
              if (res.status === 200) {
                let queryData = { 
                  "database": 'CPO', 
                  "collection": 'UserData', 
                  "pipelines": [
                    { 
                      $match: { 
                        "_id": { "ObjectId": user_id }
                      },
                    },
                    {
                      $project: { _id: 1, first_name: 1, last_name: 1, name: 1, permission: 1, phone: 1, updated_date: 1 } 
                    }
                  ]
                }
                let response = await MsiApi.mongoAggregate(queryData)
                userData.first_name = response.data.result[0]?.first_name
                userData.last_name = response.data.result[0]?.last_name
                userData.phone = response.data.result[0]?.phone
                for (let i = 0; i < user_type.length; i++) {
                  if (user_type[i]._id === response.data.result[0].permission.user) {
                    userData.permission_str = user_type[i].name
                  }
                }
                userData.permission.active = response.data.result[0]?.permission.active
                let localEndTime =  new Date( (new Date(response.data.result[0].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
                userData.updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
              }
            })
            .catch((e) => {
              console.log(e)
            })
        }
        else {
          return false
        }
      })
  
    }
    else if (action === 'delete') {
      EditCustomerFormVisible.value = false
      let sendData = { class: 'UserData', pk: userData._id }
      ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          console.log(await MsiApi.setCollectionData('delete', 'cpo', sendData))
          router.push({ name: 'user' })
        })
        .catch((e) => {
          console.log(e)
        })
    }
    else if (action === 'cancel') {
      EditCustomerFormVisible.value = false
      userDataMod.first_name = userData.first_name
      userDataMod.last_name = userData.last_name
      userDataMod.email = userData.email
      userDataMod.phone = userData.phone
      userDataMod.permission_str = userData.permission_str
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

onMounted(async () => {
  let queryData = null
  let response = null
  let localEndTime = null
  try {
    queryData = { 
      "database": 'CPO', 
      "collection": 'UserData', 
      "pipelines": [
        { 
          $match: { 
            "_id": { "ObjectId": user_id }
          },
        },
        {
          $project: { _id: 1, salt: 0, hashed_password_1: 0, hashed_password_2: 0, image: 0, byCompany: 0 } 
        }
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    Object.assign(userData, response.data.result[0])
    localEndTime =  new Date( (new Date(userData.updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    userData.updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    localEndTime =  new Date( (new Date(userData.created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    userData.created_date_str =  (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    userData.paylist = userData.binding_cards?.paylist
    userData.paylistArrObj = []
    userData.evse_list_id = ''
    userData.evse_list_id_detail = ''
    if (userData.evse_list[0]?.evseId) {
      userData.evse_list_id += userData.evse_list[0]?.evseId 
    }
    if (userData?.evse_list?.length > 1) {
      userData.evse_list_id += ' / ...'
      for (let i = 0; i < userData.evse_list.length; i++) {
        userData.evse_list_id_detail += userData.evse_list?.[i]?.evseId 
        if (i !== userData.evse_list.length-1)
          userData.evse_list_id_detail += ' /<br> '
      }
    }
    await GetPermission()
  
    for (let i = 0; i < user_type.length; i++) {
      if (user_type[i]._id === userData.permission.user) {
        userData.permission_str = user_type[i].name
      }
    }
    for (let i = 0; i < userData?.paylist?.length; i++) {
      userData.paylistArrObj.push(JSON.parse(userData?.paylist?.[i].detail))
      userData.paylistArrObj[i].card_enable = userData?.paylist?.[i].enable
      userData.paylistArrObj[i].card_num = userData.paylistArrObj[i].card6No + '******' +
      userData.paylistArrObj[i].card4No
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }

  try {
    queryData = { 
      "database": 'CPO', 
      "collection": 'PaymentHistory', 
      "pipelines": [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$created_date',
                    { $dateFromString: { dateString: select_time.value[0]  } },
                  ],
                },
                {
                  $lte: [
                    '$created_date',
                    { $dateFromString: { dateString: select_time.value[1]  } },
                  ],
                },
              ]
            }
          }
        },
        {
          $project: { sessionId: 0, locationId: 0, location: 0, invoice: 0, detail: 0, byCompany: 0 } 
        }
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    let PaymentDataAll = response.data.result
    
    for (let i = 0; i < userData?.payment_history?.length; i++) {
      for (let j = 0; j < PaymentDataAll.length; j++) {
        if (userData.payment_history[i] === PaymentDataAll[j]._id) {
          paymentData.push(PaymentDataAll[j])
        }
      }
    }

    let cost_str = 0
    let charge_time_sec = 0
    let charge_kwh = 0
    paymentData.amount_str = paymentData.length
    for (let i = 0; i < paymentData.length; i++) {
      localEndTime =  new Date( (new Date(paymentData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      paymentData[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
      cost_str += paymentData[i].price
      paymentData[i].price_str = paymentData[i].price.toLocaleString()
      for (let j = 0; j < paymentData[i].operator_types.length; j++) {
        if (paymentData[i].operator_types[j].type === 'charge') {
          charge_time_sec += paymentData[i].operator_types[j].time
          charge_kwh += paymentData[i].operator_types[j].kwh
          let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
          paymentData[i].charge_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          paymentData[i].charge_price_str = paymentData[i].operator_types[j].price.toLocaleString()
          paymentData[i].charge_kwh_str = paymentData[i].operator_types[j].kwh
          paymentData[i].charge_currency_str = paymentData[i].operator_types[j]?.currency
        }
        else if (paymentData[i].operator_types[j].type === 'parking') {
          let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
          paymentData[i].parking_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          paymentData[i].parking_price_str = paymentData[i].operator_types[j].price.toLocaleString()
          paymentData[i].parking_car_number_str = paymentData[i].operator_types[j].car_num
          paymentData[i].parking_currency_str = paymentData[i].operator_types[j]?.currency
        }
      }
      switch (paymentData[i].paymethod.method) {
        case 'CREDIT':
          paymentData[i].paymethod_str = t('credit_card')
          break
        case 'GOOGLEPAY':
          paymentData[i].paymethod_str = t('google_pay')
          break
        case 'SAMSUNGPAY':
          paymentData[i].paymethod_str = t('samsung_pay')
          break
        case 'RFID':
          paymentData[i].paymethod_str = t('rfid')
          break
        case 'FREE':
          paymentData[i].paymethod_str = t('free')
          break
        default:
          paymentData[i].paymethod_str = paymentData[i]?.paymethod?.method
          break
      }
      switch (paymentData[i].currency) {
        case 'TWD':
          paymentData[i].currency = t('twd')
          break
        case 'USD':
          paymentData[i].currency = t('usd')
          break
        case 'JPY':
          paymentData[i].currency = t('jpy')
          break
        case 'EUR':
          paymentData[i].currency = t('eur')
          break
        default:
          break
      }
    }
    paymentData.cost_str = cost_str
    paymentData.charge_kwh = charge_kwh
    paymentData.charge_hr = moment( {h:moment.duration(charge_time_sec, 'second').hours()}).format('HH')
    paymentData.charge_min = moment( {m:moment.duration(charge_time_sec, 'second').minutes()}).format('mm')
    paymentData.charge_sec = moment( {s:moment.duration(charge_time_sec, 'second').hours()}).format('ss')
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }

  setTimeout(isLoading_skeleton.value = false , 3000)
})

</script>

<template>
  <div class="customers-detail">
    <div class="container lg pb-40px">
      <p class="text-36px pt-24px pb-32px"> {{ userData.first_name + ' ' + userData.last_name }} </p>
      
      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('general')" name="first" >
            <div class="flex flex-col 2xl:flex-row">
              <div class="general-info overflow-x-auto scrollbar py-24px lg:pr-24px">
                <div class="card-container card-rounded box-shadow p-4 md:p-6">
                  <div class="flex justify-between">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-regular fa-user"/>
                      <span class="line-height-24px">{{ t('gerernal_info') }}</span>
                    </div>
                    <el-button 
                      v-if="MStore.rule_permission.UserDetail.userEdit === 'O' || MStore.permission.isCompany"
                      link type="primary" @click="editUser()">
                      <font-awesome-icon class="text-gray-300 w-32px h-32px" icon="fa-regular fa-pen-to-square" />
                    </el-button>
                  </div>
                  <div class="flex-col lg:flex-row">
                    <el-skeleton :rows="8" v-if="isLoading_skeleton" />
                    <div v-if="isLoading_skeleton === false" class="mt-16px lg:w-50%">
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('e_mail') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ userData.email }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('phone') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ userData.phone }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('country') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ userData.country }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('language') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ userData.language }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('permission') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ userData.permission_str }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px white-space-nowrap">{{ t('updated_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ userData.updated_date_str }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px white-space-nowrap">{{ t('created_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ userData.created_date_str }}</span>
                      </div>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-0px lg:mt-16px lg:w-50%">
                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('binding_card') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.cardDetails === 'O' || MStore.permission.isCompany"
                        round class="button w-full" @click="binding_card_detail">{{ t('card_details') }}</el-button>
                      </div>
    
                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('device') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.deviceDetail === 'O' || MStore.permission.isCompany"
                        round class="button w-full" @click="device_detail">{{ t('device_details') }}</el-button>
                      </div>
                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.deviceDetail === 'O' || MStore.permission.isCompany"
                        round class="button w-full" @click="notification">{{ t('send_notification') }}</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex-col w-full  2xl:flex-col 2xl:w-40%">
                <div class="real-time-info overflow-x-auto scrollbar py-24px lg:pr-10px">
                  <div class="card-container card-rounded box-shadow p-4 md:p-6">
                    <div class="flex">
                      <img class="icon w-24px h-24px mr-8px" src="@/assets/img/customer_time.png" alt="">
                      <span class="line-height-24px">{{ t('real_time_info') }}</span>
                    </div>
                    <el-skeleton :rows="2" v-if="isLoading_skeleton" class="mt-16px" />
                    <div v-if="isLoading_skeleton === false" class="md:flex mt-16px">
                      <span class="info-item min-w-150px">{{ t('occupied_evse_id') }}</span>
                      <p v-if="userData.evse_list_id_detail === ''" class="line-height-32px font-500 text-blue-1200">{{ userData.evse_list_id }}</p>
                      <el-tooltip v-else placement="bottom-start">
                        <template #content>
                          <div v-html="userData.evse_list_id_detail"></div>
                          <!-- <div class="max-h-300px overflow-y-auto w-200px text-16px line-height-32px"> {{ userData.evse_list_id_detail }} </div> -->
                        </template>
                        <el-button class="overflow-hidden border-0 evse-tooltip-btn">
                          <span class="font-400 text-16px line-height-32px text-black-200"> {{ userData.evse_list_id }} </span>
                        </el-button>
                      </el-tooltip>
                      <el-button 
                        v-if="company === 'MSI' && (MStore.rule_permission.UserDetail.clear === 'O' || MStore.permission.isCompany)" 
                        round
                        class="button md:ml-auto w-full"
                        @click="clearEvseList"
                      >
                        <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> 
                        {{ t('clear') }}
                      </el-button>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('status') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ }}</span>
                    </div>
                  </div>
                </div>
                <div class="total-record-info overflow-x-auto scrollbar py-24px lg:pr-10px">
                  <div class="card-container card-rounded box-shadow p-4 md:p-6">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-solid fa-chart-line" />
                      <span class="line-height-24px">{{ t('usage_summary') }}</span>
                    </div>
  
                    <el-skeleton :rows="3" v-if="isLoading_skeleton" class="mt-16px" />
                    
                    <div v-if="isLoading_skeleton === false" class="mt-16px">
                      <span class="info-item min-w-150px">{{ t('total_used_power') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ paymentData.charge_kwh }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_cost') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ paymentData.cost_str }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_times') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ paymentData.amount_str }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_charging_time') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ paymentData.charge_hr + ":" + paymentData.charge_min + ":" + paymentData.charge_sec }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="rfid-info overflow-x-auto scrollbar py-24px lg:pr-10px">
              <div class="card-container card-rounded box-shadow p-4 md:p-6">
                <div class="md:flex justify-between mb-24px min-w-250px">
                  <div class="flex mb-8px md:mb-0">
                    <img class="icon w-24px h-24px mr-8px" src="@/assets/img/customer_rfid.png" alt="">
                    <span class="line-height-24px">{{ t('rfid') }}</span>
                  </div>
                  <el-button 
                    v-if="MStore.rule_permission.UserDetail.addRFID === 'O' || MStore.permission.isCompany"
                    class="button h-32px w-full md:w-150px" 
                    round
                    @click="editRfid"
                  >
                    <!-- <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> -->
                    {{ t('add_rfid') }}
                  </el-button>
                </div>
                <div class="flex flex-wrap">
                  <div 
                    v-for="(item, index) in userData.rfids"
                    :key="item.value"
                    class="rfid-card box-shadow"
                  >
                    <div class="h-99px">
                      <div class="flex justify-between">
                        <span class="text-16px pt-16px pb-16px pl-16px pr-16px">{{ item.rfid }}</span>
                        <div class="pt-5px pr-16px">
                          <el-button 
                          v-if="MStore.rule_permission.UserDetail.deleteRFID === 'O' || MStore.permission.isCompany"
                          link type="primary" size="large" @click="confirmRfid('delete', index)" >
                            <img class="text-blue-1100 w-24px h-24px" src="@/assets/img/tariff_delete1.png" alt="">
                          </el-button>
                          <el-button 
                          v-if="MStore.rule_permission.UserDetail.detailRFID === 'O' || MStore.permission.isCompany"
                          link type="primary" size="large" @click="card_detail(item, index)">
                            <font-awesome-icon class="text-blue-1100 w-24px h-24px" icon="fa-regular fa-pen-to-square" />
                          </el-button>
                        </div>
                      </div>
                      <p class="text-24px pl-16px">{{ item.nickname }}</p>
                    </div>
                    <div class="rfid-card-down bg-blue-100 h-50px rounded-b-10px">
                      <p class="pl-16px pr-16px">$ {{ item.cash }}</p>
                      <p class="enable pl-16px pr-16px" v-if="item.enable">{{ t('enable') }}</p>
                      <p class="disable pl-16px pr-16px" v-else> {{ t('disable') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane 
          v-if="MStore.rule_permission.UserDetail.payment === 'O' || MStore.permission.isCompany"
          :label="t('payment')" name="second">
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

              <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center">
                <!-- <p class="total-count box-shadow"> {{ 'Total Count : ' + paymentData.length  }}</p> -->
                <div class="checkbox-container w-full lg:w-auto flex justify-between md:justify-start">
                  <el-checkbox class="mr-0 md:mr-30px" v-model="parking_visible" :label="t('parking')" />
                  <el-checkbox v-model="charging_visible" :label="t('charging')" />
                </div>
                <el-button class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px lg:mr-10px box-shadow" @click="download">
                  <span class="lg:hidden">{{ t('download') }}</span>
                  <img
                    class="w-24px h-24px ml-10px lg:ml-0"
                    src="@/assets/img/station_download.png"
                    alt="station_download"
                  />
                </el-button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <div class="">
                <el-table 
                  :data="paymentData"
                  class="white-space-nowrap text-primary"
                  height="calc(100vh - 350px)"
                  style="width: 100%"
                  stripe
                  size="large"
                  :cell-style="msi.tb_cell"
                  :header-cell-style="msi.tb_header_cell"
                >
                  <el-table-column 
                    :label= "t('station')" 
                    align="center" 
                    min-width="550"
                  >
                    <el-table-column
                      prop="location_name"
                      :label="t('name')"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'location_name')"
                      align="center"
                      min-width="250"
                    />
                    <el-table-column
                      prop="evse_id"
                      :label="t('evse_id')"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
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
                      prop="parking_time_str"
                      :label="t('used_time')"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_time_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="parking_price_str"
                      :label="t('price')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_price_str')"
                      min-width="100"
                    />
                    <el-table-column
                      prop="parking_currency_str"
                      :label="t('currency')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_currency_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="parking_car_number_str"
                      :label="t('license_plate')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_car_number_str')"
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
                      prop="charge_time_str"
                      :label="t('used_time')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_time_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="charge_kwh_str"
                      :label="t('kwh')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_kwh_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="charge_price_str"
                      :label="t('price')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_price_str')"
                      min-width="100"
                    />
                    <el-table-column
                      prop="charge_currency_str"
                      :label="t('currency')"
                      header-align="center"
                      align="right"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_currency_str')"
                      min-width="150"
                    />
                  </el-table-column>

                  <el-table-column
                    prop="price_str"
                    :label="t('final_paid')"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
                    header-align="center"
                    align="right"
                    min-width="150"
                  />
                  <el-table-column
                    prop="currency"
                    :label="t('currency')"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'currency')"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="paymethod_str"
                    :label="t('method')"
                    :filters="filters"
                    :filter-method="filterTag"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="created_date_str"
                    :label="t('created_time')"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'created_date_str')"
                    align="center"
                    min-width="250"
                  />
                </el-table>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>


      <el-dialog 
        v-model="EditCustomerFormVisible" 
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
          <el-form class="max-w-500px m-auto" :rules="userData_rules" ref="userData_ref" :model="userDataMod" :scroll-to-error=true>
            <el-form-item :label="t('first_name')" prop="first_name">
              <el-input v-model="userDataMod.first_name" />
            </el-form-item>
            <el-form-item :label="t('last_name')" prop="last_name">
              <el-input v-model="userDataMod.last_name" />
            </el-form-item>
            <el-form-item :label="t('e_mail')" prop="email">
              <el-input v-model="userDataMod.email" disabled/>
            </el-form-item>
            <el-form-item :label="t('phone')">
              <el-input v-model="userDataMod.phone" />
            </el-form-item>
            <el-form-item :label="t('permission')">
              <el-select class="el-select" v-model="userDataMod.permission_str" :placeholder="t('select')" size="large">
                <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('active')">
              <el-switch v-model="userDataMod.permission_active_str" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editUserDialog('delete')">{{ t('delete') }}</el-button>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editUserDialog('cancel')">{{ t('cancel') }}</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="editUserDialog('confirm')">{{ t('confirm') }}</el-button>
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
        <div class="dialog-context">
          <el-form class="max-w-500px m-auto" :rules="rfidData_rules" ref="rfidData_ref" :model="rfidData" :scroll-to-error=true>
            <el-form-item :label="t('number')" prop="rfid">
              <el-input v-model="rfidData.rfid" />
            </el-form-item>
            <el-form-item :label="t('cash')" prop="cash">
              <el-input v-model="rfidData.cash" />
            </el-form-item>
            <el-form-item :label="t('name')" prop="nickname">
              <el-input v-model="rfidData.nickname" />
            </el-form-item>
            <el-form-item :label="t('enable')" prop="enable">
              <el-switch v-model="rfidData.enable" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button 
            round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('cancel', undefined)">{{ t('cancel') }}</el-button>
            <el-button 
            v-if="MStore.rule_permission.UserDetail.confirmRFID === 'O' || MStore.permission.isCompany"
            round class="w-48% bg-btn-200 text-white max-w-140px" @click="confirmRfid('confirm', undefined)">{{ t('confirm') }}</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog 
        v-model="BindingCardDialogVisible"
        class="max-w-700px"
        width="90%"
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
            {{ t('binding_card') }}
            </h4>
          </div>
        </template>

        <div class="dialog-context pb-24px">
          <el-table :data="userData.paylistArrObj" :row-class-name="tableRowClassName">
            <el-table-column property="card_num" :label="t('card_no')" width="180" />
            <!-- <el-table-column property="card4No" label="Card 4" width="200" /> -->
            <el-table-column property="expireDate" :label="t('expire_date_YY_MM')" width="200" />
            <el-table-column property="bindingDate" :label="t('binding_date')" width="200" />
            <el-table-column property="card_enable" label='' width="49" >
              <template #default="scope">
                <font-awesome-icon v-if="scope.row.card_enable === false" class="icon w-24px h-24px mr-8px" icon="fa-solid fa-delete-left" />
                <div v-else class="h-26.2px"></div>
              </template>
            </el-table-column>
          </el-table>
        </div>

      </el-dialog>

      <el-dialog 
        v-model="DeviceDialogVisible" 
        class="max-w-700px"
        width="90%"
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ t('device') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context pb-24px">
          <el-table :data="userData.deviceId_list">
            <el-table-column property="device_name" :label="t('name')" min-width="250"  />
            <el-table-column property="device_platform" :label="t('platform')" width="100" />
            <el-table-column property="device_os_version" :label="t('os_version')" width="120" />
            <el-table-column property="app_version" :label="t('app_version')" width="140" />
          </el-table>
        </div>
      </el-dialog>


      <el-dialog 
        v-model="notificationDialogVisible" 
        class="max-w-700px"
        width="90%"
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ t('notification') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context pb-24px">
          <el-form-item :label="t('title')">
              <el-input v-model="NotificationData.title" style="width: 300px"  />
          </el-form-item>
          <el-form-item :label="t('body')">
              <el-input v-model="NotificationData.body" style="width: 300px"  />
          </el-form-item>

          <el-form-item :label="t('route')">
              <el-input v-model="NotificationData.route" style="width: 300px"  />
          </el-form-item>
        </div>
        <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="SendNotification('cancel')">
                {{ t('cancel') }}
              </el-button>
              <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click.stop="SendNotification('confirm')">
                {{ t('send') }}
              </el-button>
            </span>
          </template>
      </el-dialog>

    </div>
  </div>
</template>

<style lang="scss" scoped >
.customers-detail {
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
  .total-count {
    line-height: 40px;
    background-color: var(--blue-200);
    border-radius: 2rem;
    padding: 0 2rem;
    cursor: default;
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
:deep(.el-form-item__label) {
  width: 102px;
  display: block;
  font-size: 1.6rem;
}
:deep(.el-input__wrapper) {
  .el-icon {
    top: 0;
    right: 0;
    color: var(--white);
    width: 2rem;
  }
}
:deep(.disable-row) {
  --el-table-tr-bg-color: var(--gray-100);
  --el-table-row-hover-bg-color: var(--gray-100);
  --el-table-current-row-bg-color: var(--gray-100);
}
</style>