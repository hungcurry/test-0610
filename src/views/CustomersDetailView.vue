<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import  {export_json_to_excel}  from '@/composables/Export2Excel'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
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
const userData = reactive([])
const userDataMod = reactive([])
const paymentData = reactive([])
const activeName = ref('first')
const user_type = reactive([])
const rfidData = reactive({ rfid: '', cash: 0, enable: true, nickname: '' })
const rfid_title = ref('Add RFID')

const isLoading_skeleton = ref(true)
const parking_visible = ref(true)
const charging_visible = ref(true)
const now = new Date()
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const download = () => {
  const tHeader = ['EVSE ID','Station Name','Price', 'Currency', 'Created Time']
  const filterVal = ['evse_id','location_name','price', 'currency', 'created_date_str']
  const data = paymentData.map(v => filterVal.map(j => v[j]))
  export_json_to_excel ({ header: tHeader, data: data, filename: 'User Payment' })
}
const select_date = async () => {
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
  for (let i = 0; i < paymentData.length; i++) {
    localEndTime =  new Date( (new Date(paymentData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    paymentData[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    paymentData.amount_str = paymentData.length
    cost_str += paymentData[i].price
    paymentData[i].price_str = paymentData[i].price.toLocaleString()
    for (let j = 0; j < paymentData[i].operator_types.length; j++) {
      if (paymentData[i].operator_types[j].type === 'charge') {
        charge_time_sec += paymentData[i].operator_types[j].time
        charge_kwh += paymentData[i].operator_types[j].kwh
        let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
        paymentData[i].charge_time_str = moment({ h: time.hours(), m: time.minutes(), s: time.seconds(), }).format('HH:mm:ss')
        paymentData[i].charge_price_str = paymentData[i].operator_types[j].price.toLocaleString()
        paymentData[i].charge_kwh_str = paymentData[i].operator_types[j].kwh
      }
      else if (paymentData[i].operator_types[j].type === 'parking') {
        let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
        paymentData[i].parking_time_str = moment({ h: time.hours(), m: time.minutes(), s: time.seconds(), }).format('HH:mm:ss')
        paymentData[i].parking_price_str = paymentData[i].operator_types[j].price.toLocaleString()
        paymentData[i].parking_car_number_str = paymentData[i].operator_types[j].car_num
      }
    }
  }
  paymentData.cost_str = cost_str
  paymentData.charge_kwh = charge_kwh
  paymentData.charge_hr = moment( {h:moment.duration(charge_time_sec, 'second').hours()}).format('HH')
  paymentData.charge_min = moment( {m:moment.duration(charge_time_sec, 'second').minutes()}).format('mm')
  paymentData.charge_sec = moment( {s:moment.duration(charge_time_sec, 'second').hours()}).format('ss')
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


const clearEvseList = async () => {
  ElMessageBox.confirm('Do you want to delete?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        let sendData = { 'class': 'UserData', 'pk': userData._id, 'evse_list': [] }
        console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
      })
      .catch((e) => {
        console.log(e)
      })
}

const binding_card_detail = () => {
  BindingCardDialogVisible.value = true

}
const device_detail = () => {
  DeviceDialogVisible.value = true
}

const card_detail = (data) => {
  rfid_title.value= 'Edit RFID'
  EditRfidFormVisible.value = true
  modify_card_index.value = userData.rfids.indexOf(data)
  rfidData.rfid = data.rfid
  rfidData.cash = data.cash
  rfidData.enable = data.enable
  rfidData.nickname = data.nickname
}

const confirmRfid = async (confirm, index) => {

  // const hex_pair= rfidData.rfid.match(/.{1,2}/g)
  // const reversedHexPairs = hex_pair.reverse().map(pair => pair.split('').join(''));  
  // const reversedHex = reversedHexPairs.join('');
  // console.log(reversedHex)

  EditRfidFormVisible.value = false
  if (confirm === 'confirm') {
    if (modify_card_index.value === -1) {
      userData.rfids.push({
        rfid: rfidData.rfid.toUpperCase(), cash: parseInt(rfidData.cash),
        enable: rfidData.enable, nickname: rfidData.nickname
      })
      let sendData = { 'class': 'UserData', 'pk': userData._id, 'rfids': userData.rfids }
      await MsiApi.setCollectionData('patch', 'cpo', sendData)
      ElMessage({ type: 'success', message: `Add ${rfidData.rfid.toUpperCase()} card number` })
    }
    else {
      userData.rfids[modify_card_index.value].rfid = rfidData.rfid
      userData.rfids[modify_card_index.value].cash = rfidData.cash
      userData.rfids[modify_card_index.value].enable = rfidData.enable
      userData.rfids[modify_card_index.value].nickname = rfidData.nickname
      let sendData = { 'class': 'UserData', 'pk': userData._id, 'rfids': userData.rfids }
      await MsiApi.setCollectionData('patch', 'cpo', sendData)
    }
  }
  else if (confirm === 'delete') {
    ElMessageBox.confirm('Do you want to delete?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
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
}

const GetPermission = async () => {
  let queryData = { "database": "CPO", "collection": "UserPermission", "query": {} }
  let response = await MsiApi.mongoQuery(queryData)
  user_type.length = 0
  let member_permission = []
  for (let i = 0; i < response.data.all.length; i++) {
    if (response.data.all[i].name === 'AnonymousUser' || response.data.all[i].name === 'MemberUser') {
      member_permission.push(response.data.all[i])
    }
  }
  Object.assign(user_type, member_permission)
}

const editRfid = () => {
  modify_card_index.value = -1
  rfid_title.value= 'Add RFID'
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
  EditCustomerFormVisible.value = false

  if (action === 'confirm') {
    let permission_id = ''
    for (let i = 0; i < user_type.length; i++) {
      if (user_type[i].name === userDataMod.permission_str) {
        permission_id = user_type[i]._id
      }
    }
    
    ElMessageBox.confirm('Do you want to modify?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        let sendData = { class: 'UserData', pk: userData._id, first_name: userDataMod.first_name, last_name: userDataMod.last_name,
          email: userDataMod.email , phone: userDataMod.phone , permission: { user: permission_id, active: userDataMod.permission_active_str },
        }
        let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
        if (res.status === 200) {
          let queryData = { "database": "CPO", "collection": "UserData", "query": { "_id": { "ObjectId": user_id } } }
          let response = await MsiApi.mongoQuery(queryData)
          userData.first_name = response.data.all[0]?.first_name
          userData.last_name = response.data.all[0]?.last_name
          userData.phone = response.data.all[0]?.phone
          for (let i = 0; i < user_type.length; i++) {
            if (user_type[i]._id === response.data.all[0].permission.user) {
              userData.permission_str = user_type[i].name
            }
          }
          let localEndTime =  new Date( (new Date(response.data.all[0].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
          userData.updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
  else if (action === 'delete') {
    let sendData = { class: 'UserData', pk: userData._id }
    ElMessageBox.confirm('Do you want to delete?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        console.log(await MsiApi.setCollectionData('delete', 'cpo', sendData))
        router.push({ name: 'user' })
      })
      .catch((e) => {
        console.log(e)
      })
  }
  else if (action === 'cancel') {
    userDataMod.first_name = userData.first_name
    userDataMod.last_name = userData.last_name
    userDataMod.email = userData.email
    userDataMod.phone = userData.phone
    userDataMod.permission_str = userData.permission_str
  }
}

onMounted(async () => {
  let queryData = { "database": "CPO", "collection": "UserData", "query": { "_id": { "ObjectId": user_id } } }
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(userData, response.data.all[0])
  let localEndTime =  new Date( (new Date(userData.updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  userData.updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  localEndTime =  new Date( (new Date(userData.created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  userData.created_date_str =  (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  queryData = { "database": "CPO", "collection": "PaymentHistory", "query": {} }
  response = await MsiApi.mongoQuery(queryData)
  let PaymentDataAll = response.data.all
  userData.paylist = userData.binding_cards?.paylist
  userData.paylistArrObj = []
  userData.evse_list_id = ''
  for (let i = 0; i < userData.evse_list.length; i++) {
    userData.evse_list_id += userData.evse_list?.[i]?.evseId 
    if (userData.evse_list.length > 1)
      userData.evse_list_id + ' / '
  }
  await GetPermission()

  for (let i = 0; i < user_type.length; i++) {
    if (user_type[i]._id === userData.permission.user) {
      userData.permission_str = user_type[i].name
    }
  }

  for (let i = 0; i < userData?.paylist?.length; i++) {
    userData.paylistArrObj.push(JSON.parse(userData?.paylist?.[i].detail))
    userData.paylistArrObj[i].card_num = userData.paylistArrObj[i].card6No + '******' +
    userData.paylistArrObj[i].card4No
  }

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
  for (let i = 0; i < paymentData.length; i++) {
    localEndTime =  new Date( (new Date(paymentData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    paymentData[i].created_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    paymentData.amount_str = paymentData.length
    cost_str += paymentData[i].price
    paymentData[i].price_str = paymentData[i].price.toLocaleString()
    for (let j = 0; j < paymentData[i].operator_types.length; j++) {
      if (paymentData[i].operator_types[j].type === 'charge') {
        charge_time_sec += paymentData[i].operator_types[j].time
        charge_kwh += paymentData[i].operator_types[j].kwh
        let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
        paymentData[i].charge_time_str = moment({ h: time.hours(), m: time.minutes(), s: time.seconds(), }).format('HH:mm:ss')
        paymentData[i].charge_price_str = paymentData[i].operator_types[j].price.toLocaleString()
        paymentData[i].charge_kwh_str = paymentData[i].operator_types[j].kwh
      }
      else if (paymentData[i].operator_types[j].type === 'parking') {
        let time = moment.duration(paymentData[i].operator_types[j].time, 'seconds')
        paymentData[i].parking_time_str = moment({ h: time.hours(), m: time.minutes(), s: time.seconds(), }).format('HH:mm:ss')
        paymentData[i].parking_price_str = paymentData[i].operator_types[j].price.toLocaleString()
        paymentData[i].parking_car_number_str = paymentData[i].operator_types[j].car_num
      }
    }
  }
  paymentData.cost_str = cost_str
  paymentData.charge_kwh = charge_kwh
  paymentData.charge_hr = moment( {h:moment.duration(charge_time_sec, 'second').hours()}).format('HH')
  paymentData.charge_min = moment( {m:moment.duration(charge_time_sec, 'second').minutes()}).format('mm')
  paymentData.charge_sec = moment( {s:moment.duration(charge_time_sec, 'second').hours()}).format('ss')

  setTimeout(isLoading_skeleton.value = false , 3000)
})

</script>

<template>
  <div class="customers-detail">
    <div class="container lg pb-40px">
      <p class="text-36px pt-24px pb-32px"> {{ userData.first_name + ' ' + userData.last_name }} </p>
      
      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane label="General" name="first" >
            <div class="flex flex-col 2xl:flex-row">

              <div class="general-info overflow-x-auto scrollbar p-24px pl-0px">
                <div class="card-container card-rounded box-shadow">
                  <div class="flex justify-between">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-regular fa-user"/>
                      <span class="line-height-24px">General Info</span>
                    </div>
                    <el-button link type="primary" @click="editUser()">
                      <font-awesome-icon class="text-gray-300 w-32px h-32px" icon="fa-regular fa-pen-to-square" />
                    </el-button>
                  </div>
                  <div class="flex-col lg:flex-row">
                    <el-skeleton :rows="8" v-if="isLoading_skeleton" />
                    <div v-if="isLoading_skeleton === false" class="mt-16px lg:w-50%">
                      <div class="mb-8px">
                        <span class="info-item">Email</span>
                        <span class="line-height-32px">{{ userData.email }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item">Phone</span>
                        <span class="line-height-32px">{{ userData.phone }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item">Country</span>
                        <span class="line-height-32px">{{ userData.country }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item">Language</span>
                        <span class="line-height-32px">{{ userData.language }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item">Permission</span>
                        <span class="line-height-32px">{{ userData.permission_str }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item white-space-nowrap">Updated Date</span>
                        <span class="line-height-32px white-space-nowrap">{{ userData.updated_date_str }}</span>
                      </div>
    
                      <div class="mb-8px">
                        <span class="info-item white-space-nowrap">Created Date</span>
                        <span class="line-height-32px white-space-nowrap">{{ userData.created_date_str }}</span>
                      </div>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-0px lg:mt-16px lg:50%">
                      <div class="flex mb-8px">
                        <span class="info-item">Binding Cards</span>
                        <el-button round class="button" @click="binding_card_detail"> Card Detail</el-button>
                      </div>
    
                      <div class="flex mb-8px">
                        <span class="info-item">Device</span>
                        <el-button round class="button" @click="device_detail"> Device Detail</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex-col w-full  2xl:flex-col 2xl:w-40%">
                <div class="real-time-info overflow-x-auto scrollbar p-24px pl-0px">
                  <div class="card-container card-rounded box-shadow">
                    <div class="flex">
                      <img class="icon w-24px h-24px mr-8px" src="@/assets/img/customer_time.png" alt="">
                      <span class="line-height-24px">Real-time Info</span>
                    </div>
                    <el-skeleton :rows="2" v-if="isLoading_skeleton" class="mt-16px" />
                    <div v-if="isLoading_skeleton === false" class="flex mt-16px">
                      <sapn class="info-item">Occupied EVSE ID</sapn>
                      <p class="line-height-32px">{{ userData.evse_list_id }}</p>
                      <el-button 
                        v-if="company === 'MSI'" 
                        round
                        class="button ml-15px w-100px"
                        @click="clearEvseList"
                      >
                        <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> 
                        Clear
                      </el-button>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <sapn class="info-item">Status</sapn>
                      <sapn class="line-height-32px">{{ }}</sapn>
                    </div>
                  </div>
                </div>

                <div class="total-record-info overflow-x-auto scrollbar p-24px pl-0px">
                  <div class="card-container card-rounded box-shadow">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-solid fa-chart-line" />
                      <span class="line-height-24px">Total Record</span>
                    </div>
  
                    <el-skeleton :rows="3" v-if="isLoading_skeleton" class="mt-16px" />
                    
                    <div v-if="isLoading_skeleton === false" class="mt-16px">
                      <sapn class="info-item">Total Used Power</sapn>
                      <sapn class="line-height-32px">{{ paymentData.charge_kwh }}</sapn>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <sapn class="info-item">Total Cost</sapn>
                      <sapn class="line-height-32px">{{ paymentData.cost_str }}</sapn>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <sapn class="info-item">Total Times</sapn>
                      <sapn class="line-height-32px">{{ paymentData.amount_str }}</sapn>
                    </div>
                    <div v-if="isLoading_skeleton === false" class="mt-8px">
                      <sapn class="info-item">Total Charging Time</sapn>
                      <sapn class="line-height-32px">{{ paymentData.charge_hr + ":" + paymentData.charge_min + ":" + paymentData.charge_sec }}</sapn>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rfid-info overflow-x-auto scrollbar p-24px pl-0px">
              <div class="card-container card-rounded box-shadow">
                <div class="flex justify-between mb-24px min-w-250px">
                  <div class="flex">
                    <img class="icon w-24px h-24px mr-8px" src="@/assets/img/customer_rfid.png" alt="">
                    <span class="line-height-24px">RFID</span>
                  </div>
                  <el-button 
                    class="button h-32px w-150px" 
                    round
                    @click="editRfid"
                  >
                    <!-- <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> -->
                    Add RFID
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
                          <el-button link type="primary" size="large" @click="confirmRfid('delete', index)" >
                            <img class="text-blue-1100 w-24px h-24px" src="@/assets/img/tariff_delete1.png" alt="">
                          </el-button>
                          <el-button link type="primary" size="large" @click="card_detail(item)">
                            <font-awesome-icon class="text-blue-1100 w-24px h-24px" icon="fa-regular fa-pen-to-square" />
                          </el-button>
                        </div>
                      </div>
                      <p class="text-24px pl-16px">{{ item.nickname }}</p>
                    </div>
                    <div class="rfid-card-down bg-blue-100 h-50px rounded-b-10px">
                      <p class="pl-16px pr-16px">$ {{ item.cash }}</p>
                      <p class="enable pl-16px pr-16px" v-if="item.enable"> Enable</p>
                      <p class="disable pl-16px pr-16px" v-else> Disable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Payment" name="second">

            <div class="flex justify-between flex-wrap lg:flex-nowrap pt-24px pb-32px">
              <div class="date-picker w-full">
                <el-date-picker 
                  v-model="select_time" 
                  class="mr-16px"
                  type="datetimerange" 
                  range-separator="-"
                  :prefix-icon="Calendar"
                  start-placeholder="Start Date" 
                  end-placeholder="End Date" 
                  @change="select_date()"
                  :default-time="defaultTime" 
                  />
              </div>

              <div class="w-full mt-4 md:mt-8 lg:mt-0 md:flex justify-between lg:justify-end items-center">
                <!-- <p class="total-count box-shadow"> {{ 'Total Count : ' + paymentData.length  }}</p> -->
                <div class="checkbox-container w-full lg:w-auto flex justify-between md:justify-start">
                  <el-checkbox class="mr-0 md:mr-30px" v-model="parking_visible" label="Parking" />
                  <el-checkbox v-model="charging_visible" label="Charging" />
                </div>
                <el-button class="download-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow" @click="download">
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
                  v-loading.fullscreen.lock="isLoading"
                >
                <el-table-column
                    prop="location_name"
                    label="Station"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'location_name')"
                    align="center"
                    min-width="200"
                  />
                  <el-table-column
                    prop="evse_id"
                    label="EVSE ID"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
                    align="center"
                    min-width="200"
                  />
                  <el-table-column
                    v-if="parking_visible"
                    label="Parking"
                    align="center"
                    min-width="450"
                  >
                    <el-table-column
                      prop="parking_time_str"
                      label="Used Time"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_time_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="parking_price_str"
                      label="Price"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'parking_price_str')"
                      min-width="150"
                    />
                  </el-table-column>

                  <el-table-column
                    v-if="charging_visible"
                    label="Charging"
                    align="center"
                    min-width="450"
                  >
                    <el-table-column
                      prop="charge_kwh_str"
                      label="kWh"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_kwh_str')"
                      min-width="150"
                    />
                    <el-table-column
                      prop="charge_price_str"
                      label="Price"
                      align="center"
                      sortable
                      :sort-method="(a, b) => sortFunc(a, b, 'charge_price_str')"
                      min-width="150"
                    />
                  </el-table-column>

                  <el-table-column
                    prop="price_str"
                    label="Final Paid"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'price_str')"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="paymethod.method"
                    label="Payment Method"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'paymethod.method')"
                    align="center"
                    min-width="200"
                  />
                  <el-table-column
                    prop="currency"
                    label="Currency"
                    sortable
                    :sort-method="(a, b) => sortFunc(a, b, 'currency')"
                    align="center"
                    min-width="150"
                  />
                  <el-table-column
                    prop="created_date_str"
                    label="Created Time"
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
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              Edit Customer
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <el-form class="max-w-500px m-auto">
            <el-form-item label="First Name">
              <el-input v-model="userDataMod.first_name" />
            </el-form-item>
            <el-form-item label="Last Name">
              <el-input v-model="userDataMod.last_name" />
            </el-form-item>
            <el-form-item label="E-Mail">
              <el-input v-model="userDataMod.email" disabled/>
            </el-form-item>
            <el-form-item label="Phone">
              <el-input v-model="userDataMod.phone" />
            </el-form-item>
            <el-form-item label="Permission">
              <el-select class="el-select" v-model="userDataMod.permission_str" placeholder="Select" size="large">
                <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item.name" />
              </el-select>
            </el-form-item>
            <el-form-item label="Active">
              <el-switch v-model="userDataMod.permission_active_str" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editUserDialog('delete')">Delete</el-button>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editUserDialog('cancel')">Cancel</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="editUserDialog('confirm')">Confirm</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog 
        v-model="EditRfidFormVisible" 
        class="max-w-600px"
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
              {{ rfid_title }}
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <el-form class="max-w-500px m-auto">
            <el-form-item label="Number">
              <el-input v-model="rfidData.rfid" />
            </el-form-item>
            <el-form-item label="Cash">
              <el-input v-model="rfidData.cash" />
            </el-form-item>
            <el-form-item label="Name">
              <el-input v-model="rfidData.nickname" />
            </el-form-item>
            <el-form-item label="Enable">
              <el-switch v-model="rfidData.enable" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <!-- <el-button v-if="modify_card_index!==-1" round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('delete', undefined)">Delete</el-button> -->
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('cancel', undefined)">Cancel</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="confirmRfid('confirm', undefined)"> Confirm</el-button>
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
              Binding Card
            </h4>
          </div>
        </template>

        <div class="dialog-context pb-24px">
          <el-table :data="userData.paylistArrObj">
            <el-table-column property="card_num" label="Card Num " width="180" />
            <!-- <el-table-column property="card4No" label="Card 4" width="200" /> -->
            <el-table-column property="expireDate" label="Expire Date(YYMM)" width="200" />
            <el-table-column property="bindingDate" label="Binding Date" width="240" />
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
              Device
            </h4>
          </div>
        </template>
        <div class="dialog-context pb-24px">
          <el-table :data="userData.deviceId_list">
            <el-table-column property="device_name" label="Name" min-width="250"  />
            <el-table-column property="device_platform" label="Platform" width="100" />
            <el-table-column property="device_os_version" label="OS Version" width="120" />
            <el-table-column property="app_version" label="App Version" width="140" />
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
    min-width: 150px;
    line-height: 32px;
    margin-right: 24px;
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
      width: 300px;
      height: 150px;
      border-radius: 16px;
      margin: 0 20px 20px 0;
      border: 2px solid var(--gray-100);
      @media (min-width: 992px) {
        width: 354px;
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
    width: 15rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--secondary);
    border-color: var(--secondary);
    border-radius: 2rem;
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
  width: 100px;
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
</style>