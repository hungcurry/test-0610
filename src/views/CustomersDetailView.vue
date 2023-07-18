<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const clearEvseList = async () => {
  let sendData = { 'class': 'UserData', 'pk': userData._id, 'evse_list': [] }
  console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
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
  modify_card_index.value = data.$index
  rfidData.rfid = data.row.rfid
  rfidData.cash = data.row.cash
  rfidData.enable = data.row.enable
  rfidData.nickname = data.row.nickname
}

const confirmRfid = async (confirm) => {

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
    userData.evse_list_id += userData.evse_list?.[i]?.evseId + ' / '
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
    for (let j = 0; j < paymentData[i].operator_types.length; j++) {
      if (paymentData[i].operator_types[j].type === 'charge') {
        charge_time_sec += paymentData[i].operator_types[j].time
        charge_kwh += paymentData[i].operator_types[j].kwh
      }
    }
  }
  paymentData.cost_str = cost_str
  paymentData.charge_kwh = charge_kwh
  paymentData.charge_hr = moment( {h:moment.duration(charge_time_sec, 'second').hours()}).format('HH')
  paymentData.charge_min = moment( {m:moment.duration(charge_time_sec, 'second').minutes()}).format('mm')
  paymentData.charge_sec = moment( {s:moment.duration(charge_time_sec, 'second').hours()}).format('ss')
})

</script>

<template>
  <div class="customers-detail">
    <div class="container lg pb-40px">
      <p class="customers-title pt-24px pb-32px"> {{ userData.first_name + ' ' + userData.last_name }} </p>
      
      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane label="General" name="first" >
            <div class="overflow-x-auto scrollbar">
              <div class="card grid grid-cols-3 grid-rows-3 gap-24px pb-24px pr-12px">
                <div class="general-info col-span-2 row-span-3 card-rounded box-shadow">
                  <div class="flex justify-between">
                    <div class="flex">
                      <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-regular fa-user"/>
                      <span class="line-height-24px">General Info</span>
                    </div>
                    <font-awesome-icon class="general-edit-btn w-32px h-32px" icon="fa-regular fa-pen-to-square" @click="editUser()"/>
                  </div>
                  <div class="flex">
                    <div class="w-50% mt-16px">
                      <div class="flex mb-8px">
                        <p class="general-info-item">Email</p>
                        <p class="line-height-32px">{{ userData.email }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Phone</p>
                        <p class="line-height-32px">{{ userData.phone }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Country</p>
                        <p class="line-height-32px">{{ userData.country }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Language</p>
                        <p class="line-height-32px">{{ userData.language }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Permission</p>
                        <p class="line-height-32px">{{ userData.permission_str }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Updated Date</p>
                        <p class="line-height-32px">{{ userData.updated_date_str }}</p>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Created Date</p>
                        <p class="line-height-32px">{{ userData.created_date_str }}</p>
                      </div>
                    </div>
                    <div class="w-50% mt-16px">
                      <div class="flex mb-8px">
                        <p class="general-info-item">Binding Cards</p>
                        <el-button round class="button" @click="binding_card_detail"> Card Detail</el-button>
                      </div>
    
                      <div class="flex mb-8px">
                        <p class="general-info-item">Device</p>
                        <el-button round class="button" @click="device_detail"> Device Detail</el-button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="real-time-info col-span-1 row-span-1 card-rounded box-shadow">
                  <div class="flex">
                    <img class="icon w-24px h-24px mr-8px" src="@/assets/img/customer_time.png" alt="">
                    <span class="line-height-24px">Real-time Info</span>
                  </div>
                  <div class="flex mt-16px">
                    <p class="w-50% line-height-32px">EVSE Info</p>
                    <p class="line-height-32px">{{ userData.evse_list_id }}</p>
                    <el-button 
                      v-if="company === 'MSI'" 
                      round
                      class="ml-15px w-100px"
                      @click="clearEvseList"
                    >
                      <font-awesome-icon class="mr-8px" icon="fa-solid fa-gear" /> 
                      Clear
                    </el-button>
                  </div>
                  <div class="flex mt-8px">
                    <p class="w-50% line-height-32px">Status</p>
                    <p class="line-height-32px">{{ }}</p>
                  </div>
                </div>
                <div class="total-record-info col-span-1 row-span-2 card-rounded box-shadow">
                  <div class="flex">
                    <font-awesome-icon class="icon w-24px h-24px mr-8px" icon="fa-solid fa-chart-line" />
                    <span class="line-height-24px">Total Record</span>
                  </div>

                  <div class="flex mt-16px">
                    <p class="w-50% line-height-32px">Total Used Power</p>
                    <p class="line-height-32px">{{ paymentData.charge_kwh }}</p>
                  </div>
                  <div class="flex mt-8px">
                    <p class="w-50% line-height-32px">Total Cost</p>
                    <p class="line-height-32px">{{ paymentData.cost_str }}</p>
                  </div>
                  <div class="flex mt-8px">
                    <p class="w-50% line-height-32px">Total Times</p>
                    <p class="line-height-32px">{{ paymentData.amount_str }}</p>
                  </div>
                  <div class="flex mt-8px">
                    <p class="w-50% line-height-32px">Total Charging Time</p>
                    <p class="line-height-32px">{{ paymentData.charge_hr + ":" + paymentData.charge_min + ":" + paymentData.charge_sec }}</p>
                  </div>
                </div>

                <div class="rfid-info col-span-3 row-span-1 card-rounded box-shadow">
                  <div class="flex justify-between">
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
                      v-for="item in userData.rfids"
                      class="rfid-card box-shadow"
                    >
                      <div class="h-99px">
                        <div class="flex justify-between">
                          <span class="rfid-number pt-16px pb-16px pl-16px pr-16px">{{ item.rfid }}</span>
                          <div class="pt-5px pr-16px">
                            <el-button link type="primary" size="large" @click="confirmRfid('delete')" >
                              <img class="rfid-edit-btn" src="@/assets/img/tariff_delete1.png" alt="">
                            </el-button>
                            <el-button link type="primary" size="large" @click="card_detail(item)">
                              <font-awesome-icon class="rfid-edit-btn" icon="fa-regular fa-pen-to-square" />
                            </el-button>
                          </div>
                        </div>
                        <p class="rfid-name pl-16px">{{ item.nickname }}</p>
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
            </div>
          </el-tab-pane>

          <el-tab-pane label="Payment" name="second">
            <div class="overflow-x-auto">
              <div class="pb-40px">
                <el-table 
                  :data="paymentData"
                  class="white-space-nowrap text-primary"
                  height="calc(100vh - 220px)"
                  style="width: 100%"
                  stripe
                  size="large"
                  empty=""
                  :cell-style="msi.tb_cell"
                  :header-cell-style="msi.tb_header_cell"
                  v-loading.fullscreen.lock="isLoading"
                >
                  <el-table-column
                    prop="evse_id"
                    label="EVSE ID"
                    sortable
                    min-width="200"
                  />
                  <el-table-column
                    prop="location_name"
                    label="Station Name"
                    sortable
                    min-width="200"
                  />
                  <el-table-column
                    prop="price"
                    label="Price"
                    sortable
                    min-width="200"
                  />
                  <el-table-column
                    prop="currency"
                    label="Currency"
                    sortable
                    min-width="200"
                  />
                  <el-table-column
                    prop="created_date_str"
                    label="Created Time"
                    sortable
                    min-width="200"
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
              <el-input v-model="userDataMod.email" />
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
            <el-button v-if="modify_card_index!==-1" round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('delete')">Delete</el-button>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmRfid('cancel')">Cancel</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="confirmRfid('confirm')"> Confirm</el-button>
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
  .customers-title {
    font-size: 36px;
  }
  .general-info {
    border: 2px solid var(--gray-100);
    .general-edit-btn {
      color: var(--gray-300);
    }
    .general-info-item {
      width: 150px;
      line-height: 32px;
    }
  }
  .real-time-info {
    border: 2px solid var(--gray-100);
  }
  .total-record-info {
    border: 2px solid var(--gray-100);
  }
  .rfid-info {
    border: 2px solid var(--gray-100);
    .rfid-card {
      width: 354px;
      height: 150px;
      border-radius: 16px;
      margin: 0 20px 20px 0;
      border: 2px solid var(--gray-100);
    }
    .rfid-edit-btn {
      color: var(--blue-1100);
      width: 24px;
      height: 24px;
    }
    .rfid-number {
      font-size: 16px;
    }
    .rfid-name {
      font-size: 24px;
    }
    .rfid-card-down {
      border-top: 2px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }


  .card {
    width: 176rem;
    grid-template-rows: 18rem 18rem 1fr;
  }

  .enable {
    color: var(--blue-800);
  }
  .disable {
    color: var(--Error);
  }
  .icon {
    color: var(--blue-1100);
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