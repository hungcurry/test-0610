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

let userData = []
let userPermission = []
let paymentHistory = []
let evseData = []
let paymentSummaryData = []
let chargePointInfo = []
let userSessionData = []
const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const company = MStore?.permission?.company?.name
const user_id = route.query.id


const getAddr = async (a) => {
  const ttt = await MsiApi.getAddress(a.Lat,a.Long)
  console.log(ttt.data.data.results[0].formatted_address)
}

const UserRenderData = reactive({
  first_name: '', last_name: '', email: '', phone: '',
  country: '', language: '', permission: '', updated_date: '',created_date: '',
  evse_list_id: '', evse_list_id_tooltip: '', paylist: [], device_list: [], location: []
})
const PaymentSummaryRenderData = reactive({ charge_kwh: 0,  cost_str: 0, amount_str: 0, charge_hr: 0, charge_min: 0, charge_sec: 0,})
const paymentHistoryRenderData = reactive([])
const userTypeRenderData = reactive([])          
const chargePointInfoRenderData = reactive ([])
const homeDeviceSession = reactive ([])
const userDataMod = reactive([])
const rfidData = reactive({ rfid: '', cash: 0, enable: true, nickname: '' })
const NotificationData = reactive({ title: '', data: '', route: ''})

// paylist = [{card_enable:'', card_num:'', expireDate:'', bindingDate:''}]
// device_list = [{device_name:'', device_platform:'', device_os_version:'', app_version:''}]
// paymentHistoryRenderData = [{ location_name:'', evse_id:'', parking_time_str:'', parking_price_str:'', parking_car_number_str:'',
//                               parking_currency_str:'', charge_time_str:'', charge_kwh_str:'', charge_price_str:'', charge_currency_str:'',
//                               price_str:'', currency:'', paymethod_str:'', created_date_str:'', }]

const layoutVisible = reactive({ home_device: false, notification: false, device: false,  binding_card: false, 
                                 edit_customer: false, edit_rfid: false, charging_visible: true, parking_visible: false
})

const activeName = ref('first')
const rfid_title = ref(t('add_rfid'))
const userData_ref = ref()
const rfidData_ref = ref()
const userData_rules = reactive({
  first_name: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' } ],
  last_name: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' } ],
})
const rfidData_rules = reactive({
  rfid: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' } ],
  cash: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' } ],
  nickname: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' }],
})
const isLoading_skeleton = ref(true)
const now = new Date()
const defaultTime = [
  new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
]

const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])

const convertPaymethodStr = (item) => {
  switch (item) {
    case 'CREDIT':                  return t('credit_card')
    case 'GOOGLEPAY':               return t('google_pay')
    case 'SAMSUNGPAY':              return t('samsung_pay')
    case 'RFID':                    return t('rfid')
    case 'FREE':                    return t('free')
    default:                        return item
  }
}

const getUserData = async () => {
  try {
    if (user_id) {
      let queryData = { database: 'CPO', collection: 'UserData', 
        pipelines: [ 
          { $match: { _id: { ObjectId: user_id } } },
          { $project: { _id: 1, salt: 0, hashed_password_1: 0, hashed_password_2: 0, image: 0, byCompany: 0 } }
        ]
      }
      let response = await MsiApi.mongoAggregate(queryData)
      if (response.status === 200) {
        if (response.data.result.length === 0) {
          router.push({ name: 'user' })
          return "user_not_exist"
        }
        else 
          userData = response.data.result
      }
      else {
        ElMessage.error(t('error')) 
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred3.')
  }
}

const getChargePointInfo = async () => {
  try {
    if (userData[0]?.home_info?.devices?.length > 0) {
      let home_devices_list = []
      for (let i = 0; i < userData[0].home_info.devices.length; i++) {
        home_devices_list.push( {ObjectId:userData[0].home_info.devices[i].device_id} )
      }
      let queryData = { database: 'CPO', collection: 'ChargePointInfo', 
        pipelines: [ { $match: { _id : {$in:  home_devices_list } } },
          { $project: { _id: 0, created_date:1, evse:1, evse_id:1, name:1 ,schedules:1, ocpp_info:1} }
        ]
      }
      let response = await MsiApi.mongoAggregate(queryData)
      if (response.status === 200) {
        chargePointInfo = response.data.result
      }
      else 
        ElMessage.error(t('error')) 
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred1.')
  }
}
const getUserPermission = async () => {
  try {
    let queryData = { database: 'CPO', collection: 'UserPermission', 
      pipelines: [ { $project: { _id: 1, name: 1 } }]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    if (response.status === 200) 
      userPermission = response.data.result
    else 
      ElMessage.error(t('error')) 
  }    
  catch {
    ElMessage.error('An unexpected error occurred4.')
  }
}
const getUserPaymentHistory = async () => {
  if (select_time.value == null) {
      return
    }
  try {
    if (userData[0]?.payment_history?.length) {
      let UserPaymentHistoryArray = []
      for(let i = 0; i < userData[0].payment_history.length; i++) {
        UserPaymentHistoryArray.push( {"ObjectId":userData[0].payment_history[i]}  )
      }
      
      let queryData = { database: 'CPO', collection: 'PaymentHistory', 
        pipelines: [ 
          { $match: 
            { _id: { $in: UserPaymentHistoryArray },
              $expr: {
                $and : [ 
                  { $gte : [ "$created_date", { "$dateFromString": { dateString: select_time.value[0]}}]},
                  { $lte : [ "$created_date", { "$dateFromString": { dateString: select_time.value[1]}}]}
                ]
              }
            }
          },
          { $project: { sessionId: 0, locationId: 0, location: 0, invoice: 0, detail: 0, byCompany: 0 } }
        ]
      }
      let response = await MsiApi.mongoAggregate(queryData)
      if (response.status === 200) 
        paymentHistory = response.data.result
      else 
      ElMessage.error(t('error')) 
    }
  }
  catch (e){
    ElMessage.error('An unexpected error occurred5.')
  }
}
const getUserPaymentsummary = async () => {
  try {
    if (userData[0].payment_history.length) {
      let UserPaymentHistoryArray = []
      for(let i = 0; i < userData[0].payment_history.length; i++) {
        UserPaymentHistoryArray.push( {"ObjectId":userData[0].payment_history[i]}  )
      }
      let jsonData = { database: "CPO", collection: "PaymentHistory", 
        pipelines: [
          { $match: {'_id': { $in: UserPaymentHistoryArray }}},
          { $facet: {
            summaryPrice: [{ $group: { _id: null, price: { $sum: "$price" } } }],
            summaryTimes: [{ $group: { _id: null, times: { $sum: 1 } } }],
            summaryPower: [{ $unwind: "$operator_types"}, { $match: { 'operator_types.type': 'charge' } }, { $group: { _id: null, power: { $sum: "$operator_types.kwh" } } }],
            summaryTime:  [{ $unwind: "$operator_types"}, { $match: { 'operator_types.type': 'charge' } }, { $group: { _id: null, time: { $sum: "$operator_types.time"} } }]
            },
          },
          { $project: { summary: {
                price: { $arrayElemAt: ["$summaryPrice.price", 0] }, times: { $arrayElemAt: ["$summaryTimes.times", 0] },
                power: { $arrayElemAt: ["$summaryPower.power", 0] }, time: { $arrayElemAt:  ["$summaryTime.time", 0] }
              }
            }
          }
        ]}
      let response = await MsiApi.mongoAggregate(jsonData)
      if (response.status === 200) 
        paymentSummaryData = response.data.result
      else 
        ElMessage.error(t('error')) 
    }
  } 
    catch (error) {
    console.log(error)
  }  
}

const getSession = async () => {
  try {
    if (userData[0]?.home_info?.sessions?.length) {
      let userSessionArr = []
      for (let i = 0; i < userData[0]?.home_info?.sessions?.length; i++) {
        userSessionArr.push ({"ObjectId": userData[0]?.home_info?.sessions[i]})
      }
      let queryData = { database: 'OCPI', collection: 'Session', 
        pipelines: [ { $match: { _id: { $in: userSessionArr } } },
                     { $project: { _id:0,  kwh:1, start_date_time:1, end_date_time:1, evse_uid:1 } }
                    ]
      }
      let response = await MsiApi.mongoAggregate(queryData)
      if (response.status === 200) {
        userSessionData = response.data.result
        let evse_uidArr = []
        for (let i = 0; i < userSessionData?.length; i++) {
          evse_uidArr.push ({UUID: userSessionData[i].evse_uid})
        }  
        let queryData = { database: 'OCPI', collection: 'EVSE', 
          pipelines: [ 
            // { $match: { "uid": { $in: evse_uidArr } } },
            { $project: { _id:1, evse_id:1, uid: 1  } }
          ]
        }
        response = await MsiApi.mongoAggregate(queryData)  
        console.log(response)
        if ((response.status === 200)) 
          evseData = response.data.result
      }
      else 
        ElMessage.error(t('error')) 
    }
  } catch (error) {
    ElMessage.error('An unexpected error occurred6.')
  }
}

const RenderSessionData = async () => {
  try {
    for (let i = 0; i < userSessionData.length; i++) {
      let homeDeviceSessionObj = {}
      for (let j = 0; j < evseData.length; j++ ) {        
        if (evseData[j].uid === userSessionData[i].evse_uid) {
          homeDeviceSessionObj.evse_id = evseData[j].evse_id
        }
      }
      homeDeviceSessionObj.kwh = userSessionData[i].kwh
      homeDeviceSessionObj.start_date_time = moment(new Date( (new Date(userSessionData[i].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss")
      homeDeviceSessionObj.end_date_time = moment(new Date( (new Date(userSessionData[i].end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss")
      homeDeviceSession.push(homeDeviceSessionObj)
    }
  } catch (error) {
    ElMessage.error('An unexpected error occurred7.')
  }

}

const RenderUserRenderData = async () => {
  try {
    if (userData.length === 1) {
      let updated_date = moment(new Date( (new Date(userData[0].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss")
      let create_date = moment(new Date( (new Date(userData[0].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss")
      if (userData[0]?.permission?.user) {
        for (let i = 0; i < userPermission.length; i++) {
          if (userPermission[i]._id === userData[0].permission.user) {
            switch (userPermission[i].name) {
              case 'AnonymousUser':
                UserRenderData.permission = t('anonymous_user')
                break
              case 'MemberUser':
                UserRenderData.permission = t('member_user')
                break
              default:
                break
            }
          }
        }
      }
      UserRenderData.first_name = userData[0].first_name
      UserRenderData.last_name = userData[0].last_name
      UserRenderData.email = userData[0].email
      UserRenderData.phone = userData[0].phone
      UserRenderData.country = userData[0].country
      UserRenderData.language = userData[0].language
      UserRenderData.updated_date = updated_date
      UserRenderData.created_date = create_date
      if (userData[0].evse_list.length > 0) {
        UserRenderData.evse_list_id = userData[0].evse_list[0].evseId   
      }
      if (userData[0].evse_list.length > 1) {        
        UserRenderData.evse_list_id += ' / ...'
        for (let i = 0; i < userData[0].evse_list.length; i++) {
          UserRenderData.evse_list_id_tooltip += userData[0].evse_list[i].evseId
          if (i < userData[0].evse_list.length) {
            UserRenderData.evse_list_id_tooltip += ' /<br> '
          }
        }
      }
      for (let i = 0; i < userData[0].binding_cards.paylist.length; i++) {
        let paylist_detail = JSON.parse(userData[0].binding_cards.paylist[i].detail)
        paylist_detail.card_num = paylist_detail.card6No + '******' + paylist_detail.card4No
        let paylist_obj = { card_enable: userData[0].binding_cards.paylist[i].enable, 
                            card_num: paylist_detail.card_num, 
                            expireDate: paylist_detail.expireDate, 
                            bindingDate: paylist_detail.bindingDate
                          }
        UserRenderData.paylist.push(paylist_obj)
      }
      for (let i = 0; i < userData[0].deviceId_list.length; i++) {
        let device_object = {
          device_name: userData[0].deviceId_list[i].device_name,
          device_platform: userData[0].deviceId_list[i].device_platform,
          device_os_version: userData[0].deviceId_list[i].device_os_version,
          app_version: userData[0].deviceId_list[i].app_version,
        }
        UserRenderData.device_list.push(device_object)
      }
    }
    for (let i = 0; i < userData[0]?.bt_keys?.length; i++) {
      if (userData[0]?.bt_keys[i]?.LocationId) {
        for (let j = 0; j < userData[0]?.bt_keys[i]?.Data?.length; j++) {
          if (userData[0]?.bt_keys[i]?.Data[j]?.Lat === 25.008314163700017)
            userData[0].bt_keys[i].Data[j].default = true
          UserRenderData.location.push(userData[0]?.bt_keys[i]?.Data[j])
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}
const RenderPaymentSummaryRenderData = async () => {
  try {
    if (paymentSummaryData.length) {
      const charge_hours = Math.floor(moment.duration(paymentSummaryData[0].summary.time, 'seconds').asHours())
      const charge_min = moment( {m:moment.duration(paymentSummaryData[0].summary.time, 'second').minutes()}).format('mm')
      const charge_sec = moment( {s:moment.duration(paymentSummaryData[0].summary.time, 'second').hours()}).format('ss')
      PaymentSummaryRenderData.charge_kwh = paymentSummaryData[0].summary.power
      PaymentSummaryRenderData.cost_str = paymentSummaryData[0].summary.price
      PaymentSummaryRenderData.amount_str = paymentSummaryData[0].summary.times
      PaymentSummaryRenderData.charge_hr = charge_hours
      PaymentSummaryRenderData.charge_min = charge_min
      PaymentSummaryRenderData.charge_sec = charge_sec
    }
  } catch (error) {
    console.log(error)
  }
}
const RenderPaymentHistoryRenderData = async () => {
  try {
    paymentHistoryRenderData.length = 0
    for (let i = 0; i < paymentHistory.length; i++ ) {
      let price = paymentHistory[i].price.toLocaleString()
      let create_time = (moment(new Date( (new Date(paymentHistory[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss"))
      let charge_time_str, charge_price_str, charge_kwh_str, charge_currency_str, 
      parking_time_str, parking_price_str, parking_car_number_str, parking_currency_str, paymethod_str
      paymethod_str = convertPaymethodStr(paymentHistory[i].paymethod.method)

      for (let j = 0; j < paymentHistory[i].operator_types.length; j++) {
        if (paymentHistory[i].operator_types[j].type === 'charge') {
          let time = moment.duration(paymentHistory[i].operator_types[j].time, 'seconds')
          charge_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          charge_price_str = paymentHistory[i].operator_types[j].price.toLocaleString()
          charge_kwh_str = paymentHistory[i].operator_types[j].kwh
          charge_currency_str = paymentHistory[i].operator_types[j]?.currency
        }
        else if (paymentHistory[i].operator_types[j].type === 'parking') {
          let time = moment.duration(paymentHistory[i].operator_types[j].time, 'seconds')
          parking_time_str = String(time.days()*24 + time.hours()).padStart(2, 0) + ':' + String(time.minutes()).padStart(2, 0) + ':' + String(time.seconds()).padStart(2, 0)
          parking_price_str = paymentHistory[i].operator_types[j].price.toLocaleString()
          parking_car_number_str = paymentHistory[i].operator_types[j].car_num
          parking_currency_str = paymentHistory[i].operator_types[j]?.currency
        }
      }
      let paymentHistoryRenderObj = {
        location_name: paymentHistory[i].location_name, 
        evse_id: paymentHistory[i].evse_id, 
        parking_time_str: parking_time_str, 
        parking_price_str: parking_price_str, 
        parking_car_number_str: parking_car_number_str, 
        parking_currency_str : parking_currency_str,
        charge_time_str: charge_time_str, 
        charge_kwh_str: charge_kwh_str, 
        charge_price_str: charge_price_str, 
        charge_currency_str: charge_currency_str,
        price_str: price, 
        currency: paymentHistory[i].currency, 
        paymethod_str: paymethod_str, 
        created_date_str: create_time
      }  
      paymentHistoryRenderData.push(paymentHistoryRenderObj)
    }
  } catch (error) {
    console.log(error)
}}

const RenderUserTypeRenderData = async () => {
  try {
    for (let i = 0; i < userPermission.length; i++) {
      let userTypeRenderObj = {}
      if (userPermission[i].name ==="AnonymousUser" ) {        
        userTypeRenderObj.name = t('anonymous_user')
        userTypeRenderObj._id = userPermission[i]._id
        userTypeRenderData.push(userTypeRenderObj)
      }
      else if (userPermission[i].name ==="MemberUser") {
        userTypeRenderObj.name = t('member_user')
        userTypeRenderObj._id = userPermission[i]._id
        userTypeRenderData.push(userTypeRenderObj)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const RenderChargePointInfoRenderData = async () => {
  try {
    for (let i = 0; i < chargePointInfo.length; i++) {
      let chargePointInfoRenderObj = {evse_id: '', created_date: '', binding_rfid_card: ''}
      chargePointInfoRenderObj.evse_id = chargePointInfo[i].evse_id
      let create_time = moment(new Date( (new Date(chargePointInfo[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))).format("YYYY-MM-DD HH:mm:ss")
      chargePointInfoRenderObj.created_date = create_time
      for ( let j = 0; j < userData[0]?.home_info?.devices?.[i]?.rfids?.length; j++) {
        chargePointInfoRenderObj.binding_rfid_card += userData[0].home_info.devices[i].rfids[j]
        if ( j !== userData[0]?.home_info?.devices?.[i]?.rfids?.length -1 )
          chargePointInfoRenderObj.binding_rfid_card += ' / '
      }
      chargePointInfoRenderData.push(chargePointInfoRenderObj)
    }
  } catch (error) {
    console.log(error)
  }
}

const SendNotification = async (action) => {
  if (action === 'confirm') {
    let sendData = { users:[userData[0].email], title:NotificationData.title, body:NotificationData.body, data: {route:NotificationData.route}}
    let response = await MsiApi.sendNotification(sendData)
    if (response?.data?.message === 'Accepted') ElMessage.success(t('success'))
    if (response.status !== 200)
      ElMessage.error(response.data.message)
  }
  layoutVisible.notification = false
  NotificationData.title = NotificationData.body = NotificationData.route = ''
}
const download = () => {
  const tHeader = ['Station Name', 'Station EVSE ID', 'Parking Used Time', 'Parking Price', 'Parking Currency', 'Parking License Plate',
    'Charging Used Time',  'Charging kWh', 'Charging Price', 'Charging Currency', 'Final Paid', 'Currency', 'Method', 'Created Time'
  ]
  const filterVal = ['location_name', 'evse_id', 'parking_time_str', 'parking_price_str', 'parking_currency_str', 'parking_car_number_str',
    'charge_time_str', 'charge_kwh_str', 'charge_price_str', 'charge_currency_str', 'price_str', 'currency', 'paymethod_str', 'created_date_str'
  ]
  const data = paymentHistoryRenderData.map(v => filterVal.map(j => v[j]))
  
  const indicesToConvert = [3, 8, 10] // parking_price_str, charge_price_str, price_str

  for (let i = 0; i < data.length; i++) {
    for (const index of indicesToConvert) {
      if (typeof data[i][index] === 'string') {
        data[i][index] = parseInt(data[i][index], 10);
      }
    }
  }
  export_json_to_excel ({ header: tHeader, data: data, filename: 'User Payment' })
}


const select_date = async () => {
  await getUserPaymentHistory()
  await RenderPaymentHistoryRenderData()
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
      let sendData = { 'class': 'UserData', 'pk': userData[0]._id, 'evse_list': [] }
      let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
      if (res.status === 200) {
        getUserData()
        RenderUserRenderData()
      }
    })
    .catch((e) => {
      console.log(e)
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred1.')
  }
}

const editUser = () => {
  userDataMod.first_name = userData[0].first_name
  userDataMod.last_name = userData[0].last_name
  userDataMod.email = userData[0].email
  userDataMod.phone = userData[0].phone
  userDataMod.permission_active = userData[0].permission.active

  if (userData[0]?.permission?.user) {
    for (let i = 0; i < userPermission.length; i++) {
      if (userPermission[i]._id === userData[0].permission.user) {
        switch (userPermission[i].name) {
          case 'AnonymousUser':
          userDataMod.permission = t('anonymous_user')
            break
          case 'MemberUser':
          userDataMod.permission = t('member_user')
            break
          default:
            break
        }
      }
    }
  }
  layoutVisible.edit_customer = true
}

const editUserDialog = (action) => {
  try {
    if (action === 'confirm') {
      userData_ref.value.validate(valid => {
        if (valid) {
          layoutVisible.edit_customer = false
          let permission_id = ''
          for (let i = 0; i < userTypeRenderData.length; i++) {
            if (userTypeRenderData[i].name === userDataMod.permission) {
              permission_id = userTypeRenderData[i]._id
            }
          }
          ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
          .then(async () => {
            let sendData = { class: 'UserData', pk: userData[0]._id, first_name: userDataMod.first_name, last_name: userDataMod.last_name,
              email: userDataMod.email , phone: userDataMod.phone , permission: { user: permission_id, active: userDataMod.permission_active },
              config: {company: userDataMod.company}
            }
            let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
            if (res.status === 200) {
              ElMessage.success('Success')
              await getUserData()
              await RenderUserRenderData()
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
      layoutVisible.edit_customer = false 
      ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          let res = await MsiApi.delete_account({ role:'member', id: userData[0]._id })
            if (res.data.message === 'Accepted') {
              ElMessage.error('Success')
              router.push({ name: 'user' })
            }
            else {
              ElMessage.error(t('error'))
            }
        })
        .catch((e) => {
          console.log(e)
        })
    }
    else if (action === 'cancel') {
      layoutVisible.edit_customer = false 
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred2.')
  }
}

onMounted(async () => {
  // const startTime = new Date().getTime()
  let status = await getUserData()
  if (status === 'user_not_exist')
    return
  await getChargePointInfo()
  await getUserPermission()
  await getUserPaymentHistory()
  await getUserPaymentsummary()
  await getSession()
  await RenderUserRenderData()
  await RenderPaymentSummaryRenderData()
  await RenderPaymentHistoryRenderData()
  await RenderUserTypeRenderData()  
  await RenderChargePointInfoRenderData()
  await RenderSessionData()
  setTimeout(isLoading_skeleton.value = false , 2000)
})

</script>

<template>
  <div class="customers-detail">
    <div class="container lg pb-40px">
      <p class="text-36px pt-24px pb-32px"> {{ UserRenderData.first_name + ' ' + UserRenderData.last_name }} </p>
      
      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('general')" name="first" >
            <div class="flex flex-col 2xl:flex-row">
              <div class="general-info overflow-x-auto scrollbar py-24px lg:pr-24px">
                <div class="card-container card-rounded box-shadow p-4 md:p-6">
                  <div class="flex justify-between">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-regular fa-user"/>
                      <span class="line-height-24px">{{ t('general_info') }}</span>
                    </div>
                    <el-button 
                      v-if="MStore.rule_permission.UserDetail.userEdit === 'O'"
                      link type="primary" @click="editUser()">
                      <font-awesome-icon class="text-gray-300 w-32px h-32px" icon="fa-regular fa-pen-to-square" />
                    </el-button>
                  </div>
                  <div class="flex-col lg:flex-row">
                    <el-skeleton :rows="8" v-if="isLoading_skeleton" />
                    <div v-if="isLoading_skeleton === false" class="mt-16px lg:w-50%">
                      <div class="mb-8px">
                        <span class="info-item min-w-110px">{{ t('e_mail') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ UserRenderData.email }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('phone') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ UserRenderData.phone }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('country') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ UserRenderData.country }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('language') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ UserRenderData.language }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px ">{{ t('permission') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200">{{ UserRenderData.permission }}</span>
                      </div>

                      <div class="mb-8px">
                        <span class="info-item min-w-110px white-space-nowrap">{{ t('updated_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ UserRenderData.updated_date }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item min-w-110px white-space-nowrap">{{ t('created_date') }}</span>
                        <span class="line-height-32px font-500 text-blue-1200 white-space-nowrap">{{ UserRenderData.created_date }}</span>
                      </div>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-0px lg:mt-16px lg:w-50%">
                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('binding_card') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.cardDetails === 'O'"
                        round class="button w-full" @click="layoutVisible.binding_card = true">{{ t('card_details') }}</el-button>
                      </div>
    
                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('device') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.deviceDetail === 'O'"
                        round class="button w-full" @click="layoutVisible.device = true">{{ t('device_details') }}</el-button>
                      </div>

                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ t('home_device') }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.homeDeviceDetails === 'O'"
                        round class="button w-full" @click="layoutVisible.home_device = true">{{ t('home_device_details') }}</el-button>
                      </div>

                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ '' }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.sendNotification === 'O'"
                        round class="button w-full" @click="layoutVisible.notification = true">{{ t('send_notification') }}</el-button>
                      </div>

                      <div class="md:flex mb-8px">
                        <span class="info-item min-w-110px">{{ '' }}</span>
                        <el-button 
                        v-if="MStore.rule_permission.UserDetail.sendNotification === 'O'"
                        round class="button w-full" @click="layoutVisible.location = true">{{ t('location') }}</el-button>
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
                      <p v-if="UserRenderData.evse_list_id_tooltip === ''" class="line-height-32px font-500 text-blue-1200">
                        {{ UserRenderData.evse_list_id }}
                      </p>
                      <el-tooltip v-else placement="bottom-start">
                        <template #content>
                          <div v-html="UserRenderData.evse_list_id_tooltip"></div>
                        </template>
                        <el-button class="overflow-hidden border-0 evse-tooltip-btn">
                          <span class="font-400 text-16px line-height-32px text-black-200"> {{ UserRenderData.evse_list_id }} </span>
                        </el-button>
                      </el-tooltip>
                      <el-button 
                        v-if="company === 'MSI' && (MStore.rule_permission.UserDetail.clear === 'O')" 
                        round
                        class="button md:ml-auto w-full"
                        @click="clearEvseList"
                      >
                        <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> 
                        {{ t('clear') }}
                      </el-button>
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
                      <span class="line-height-32px font-500 text-blue-1200">{{ PaymentSummaryRenderData.charge_kwh }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_cost') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ PaymentSummaryRenderData.cost_str }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_times') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ PaymentSummaryRenderData.amount_str }}</span>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <span class="info-item min-w-150px">{{ t('total_charging_time') }}</span>
                      <span class="line-height-32px font-500 text-blue-1200">{{ PaymentSummaryRenderData.charge_hr + ":" + PaymentSummaryRenderData.charge_min + ":" + PaymentSummaryRenderData.charge_sec }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane 
          v-if="MStore.rule_permission.UserDetail.payment === 'O'"
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
                <div class="checkbox-container w-full lg:w-auto flex justify-between md:justify-start">
                  <el-checkbox class="mr-0 md:mr-30px" v-model="layoutVisible.parking_visible" :label="t('parking')" />
                  <el-checkbox v-model="layoutVisible.charging_visible" :label="t('charging')" />
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
                  :data="paymentHistoryRenderData"
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
                    v-if="layoutVisible.parking_visible"
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
                    v-if="layoutVisible.charging_visible"
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


          <el-tab-pane 
          v-if="MStore.rule_permission.UserDetail.homeSession === 'O'"
          :label="t('home_session')" name="third">
            <div class="overflow-x-auto">
              <div class="">
                <el-table 
                  :data="homeDeviceSession"
                  class="white-space-nowrap text-primary"
                  height="calc(100vh - 350px)"
                  style="width: 100%"
                  stripe
                  size="large"
                  :cell-style="msi.tb_cell"
                  :header-cell-style="msi.tb_header_cell"
                >
                <el-table-column
                    prop="evse_id"
                    :label="t('evse_id')"
                    sortable
                    header-align="center"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="kwh"
                    :label="t('kwh')"
                    sortable
                    header-align="center"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="start_date_time"
                    :label="t('start_time')"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
                    header-align="center"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="end_date_time"
                    :label="t('end_time')"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
                    header-align="center"
                    align="center"
                    min-width="150"
                  />
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          
        </el-tabs>
      </div>


      <el-dialog 
        v-model="layoutVisible.edit_customer" 
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
              <el-select class="el-select" v-model="userDataMod.permission" :placeholder="t('select')" size="large">
                <el-option v-for="item in userTypeRenderData" :key="item.value" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('active')">
              <el-switch v-model="userDataMod.permission_active" />
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
        v-model="layoutVisible.edit_rfid" 
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
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('cancel', undefined)">{{ t('cancel') }}</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="confirmRfid('confirm', undefined)">{{ t('confirm') }}</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog 
        v-model="layoutVisible.binding_card"
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
          <el-table :data="UserRenderData.paylist" :row-class-name="tableRowClassName">
            <el-table-column property="card_num" :label="t('card_no')" width="180" />
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
        v-model="layoutVisible.device" 
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
          <el-table :data="UserRenderData.device_list">
            <el-table-column property="device_name" :label="t('name')" min-width="250"  />
            <el-table-column property="device_platform" :label="t('platform')" width="100" />
            <el-table-column property="device_os_version" :label="t('os_version')" width="120" />
            <el-table-column property="app_version" :label="t('app_version')" width="140" />
          </el-table>
        </div>
      </el-dialog>

      <el-dialog 
        v-model="layoutVisible.notification" 
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
              <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="SendNotification">
                {{ t('cancel') }}
              </el-button>
              <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click.stop="SendNotification('confirm')">
                {{ t('send') }}
              </el-button>
            </span>
          </template>
      </el-dialog>


      <el-dialog 
        v-model="layoutVisible.location" 
        class="max-w-700px"
        width="90%"
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4 :id="titleId" :class="titleClass" class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px">
              {{ t('location') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context pb-24px">
          <el-table :data="UserRenderData.location" @cell-dblclick="getAddr">
            <el-table-column property="Lat" :label="t('latitude')" min-width="100"  />
            <el-table-column property="Long" :label="t('longitude')" min-width="100" />
            <el-table-column  property="default" :label="t('default')" min-width="100" />


<!-- 
            <el-table-column prop="" label="Addr" align="center" min-width="50">

              <template #default="scope">
                <el-button class="btn-more" @click="getAddr(scope.row.Lat, scope.row.Long)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
              
            </el-table-column> -->


          </el-table>
        </div>
        <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="layoutVisible.location = false">
                {{ t('cancel') }}
              </el-button>
            </span>
          </template>
      </el-dialog>


      <el-dialog 
        v-model="layoutVisible.home_device" 
        class="max-w-800px"
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
              {{ t('home_device') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context pb-24px">
          <el-table :data="chargePointInfoRenderData">
            <el-table-column property="evse_id" :label="t('evse_id')" min-width="250" />
            <el-table-column property="created_date" :label="t('created_date')" min-width="250" />
            <el-table-column property="binding_rfid_card" :label="t('binding_rfid_card')" min-width="250" />
          </el-table>
        </div>
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
