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
        router.push({ name: 'customers' })
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
    <p class="customers-title"> {{ userData.first_name + ' ' + userData.last_name }} </p>

    <div class="customers-el-tab">
      <el-tabs v-model="activeName" class="demo-tabs">
        <el-tab-pane label="General" name="first">

          <div class="customers-up">
            <div class="customers-up-left">
              <div class="general-info">
                <div class="customers-general-info-header">
                  <font-awesome-icon icon="fa-regular fa-user" />
                  General Info
                  <el-button class="gear" @click="editUser"><font-awesome-icon icon="fa-solid fa-gear" /></el-button>
                </div>

                <div class="customers-info-item">
                  <p class="customers-info-title">Email</p>
                  <p class="customers-info-value">{{ userData.email }}</p>
                </div>
                <div class="customers-info-item">
                  <p class="customers-info-title">Phone</p>
                  <p class="customers-info-value">{{ userData.phone }}</p>
                </div>
                <div class="customers-info-item">
                  <p class="customers-info-title">Country</p>
                  <p class="customers-info-value">{{ userData.country }}</p>
                </div>
                <div class="customers-info-item">
                  <p class="customers-info-title">Language</p>
                  <p class="customers-info-value">{{ userData.language }}</p>
                </div>
                <div class="customers-info-item">
                  <p class="customers-info-title">Binding Cards</p>
                  <el-button @click="binding_card_detail"> Card Detail</el-button>
                </div>

                <div class="customers-info-item">
                  <p class="customers-info-title">Device</p>
                  <el-button @click="device_detail"> Device Detail</el-button>
                </div>

                <div class="customers-info-item">
                  <p class="customers-info-title">Permission</p>
                  <p class="customers-info-value">{{ userData.permission_str }}</p>
                </div>

                <div class="customers-info-item">
                  <p class="customers-info-title">Updated Date</p>
                  <p class="customers-info-value">{{ userData.updated_date_str }}</p>
                </div>
                <div class="customers-info-item">
                  <p class="customers-info-title">Created Date</p>
                  <p class="customers-info-value">{{ userData.created_date_str }}</p>
                </div>

              </div>
            </div>

            <div class="customers-up-right">
              <div class="real-time-info">
                <div class="customers-general-info-header">
                  <font-awesome-icon icon="fa-regular fa-user" />
                  Real-time Info
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">EVSE Info</p>
                  <p class="real-time-info-value">{{ userData.evse_list_id }}</p>
                  <el-button v-if="company === 'MSI'" class="gear" @click="clearEvseList"><font-awesome-icon
                      icon="fa-solid fa-gear" /> Clear</el-button>
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">Status</p>
                  <p class="real-time-info-value">{{ }}</p>
                </div>
              </div>
              <div class="total-record">
                <div class="customers-general-info-header">
                  <font-awesome-icon icon="fa-regular fa-user" />
                  Total Record
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">Total Used Power</p>
                  <p class="real-time-info-value">{{ paymentData.charge_kwh }}</p>
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">Total Cost</p>
                  <p class="real-time-info-value">{{ paymentData.cost_str }}</p>
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">Total Times</p>
                  <p class="real-time-info-value">{{ paymentData.amount_str }}</p>
                </div>
                <div class="real-time-info-item">
                  <p class="real-time-info-title">Total Charging Time</p>
                  <p class="real-time-info-value">{{ paymentData.charge_hr + ":" + paymentData.charge_min + ":" +
                    paymentData.charge_sec }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="customers-down">
            <div class="rfid">
              <div class="customers-general-info-header">
                <font-awesome-icon icon="fa-regular fa-user" />
                RFID
                <el-button class="gear" @click="editRfid"><font-awesome-icon icon="fa-solid fa-gear" />
                   Add RFID</el-button>
              </div>
              <div class="rfid-detail">
                <el-table :data="userData.rfids" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell
                  :header-cell-style=msi.tb_header_cell size="large">
                  <el-table-column prop="rfid" label="Number" min-width="80" />
                  <el-table-column prop="cash" label="Cash" min-width="80" />
                  <el-table-column prop="nickname" label="Name" min-width="80" />
                  <el-table-column prop="enable" label="Enable" min-width="80" />
                  <el-table-column>
                    <template #default="scope">
                      <el-button @click="card_detail(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" />
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Payment" name="second">
          <el-table :data="paymentData" style="width: 95%; height:900px" stripe :cell-style=msi.tb_cell
            :header-cell-style=msi.tb_header_cell size="large" v-loading="isLoading">
            <el-table-column prop="evse_id" label="EVSE ID" min-width="80" />
            <el-table-column prop="location_name" label="Station Name" min-width="80" />
            <el-table-column prop="price" label="Price" min-width="80" />
            <el-table-column prop="currency" label="Currency" min-width="80" />
            <el-table-column prop="created_date_str" label="Created Time" min-width="80" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="EditCustomerFormVisible" title="Edit Customer" draggable>
      <el-form>
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
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editUserDialog('delete')">Delete</el-button>
          <el-button @click="editUserDialog('cancel')">Cancel</el-button>
          <el-button type="primary" @click="editUserDialog('confirm')"> Confirm</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="EditRfidFormVisible" :title=rfid_title draggable>
      <el-form>
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
      <template #footer>
        <span class="dialog-footer">
          <el-button v-if="modify_card_index!==-1" @click="confirmRfid('delete')">Delete</el-button>
          <el-button @click="confirmRfid('cancel')">Cancel</el-button>
          <el-button type="primary" @click="confirmRfid('confirm')"> Confirm</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="DeviceDialogVisible" title="Device">
      <el-table :data="userData.deviceId_list">
        <el-table-column property="device_name" label="Name" width="300" />
        <el-table-column property="device_platform" label="Platform" width="100" />
        <el-table-column property="device_os_version" label="OS Version" />
        <el-table-column property="app_version" label="App Version" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="BindingCardDialogVisible" title="Binding Card">
      <el-table :data="userData.paylistArrObj">
        <el-table-column property="card_num" label="Card Num " width="150" />
        <!-- <el-table-column property="card4No" label="Card 4" width="200" /> -->
        <el-table-column property="expireDate" label="Expire Date(YYMM)" />
        <el-table-column property="bindingDate" label="Binding Date" />
      </el-table>
    </el-dialog>

  </div>
</template>

<style lang="scss" scoped >
.customers-detail {
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;

  .customers-title {
    width: 100%;
    height: 40px;
    margin: 0px;
    padding: 0px;
    font-size: 40px;
  }

  .customers-el-tab {
    width: 100%;
    height: calc(100% - 40px);

    .customers-up {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-left: 10px;
      width: 1600px;
      height: 500px;

      .customers-up-left {
        width: 700px;
        height: 480px;
        margin-right: 20px;
        background-color: #f8f9f9;

        .customers-info-item {
          display: flex;
          flex-direction: row;
          margin-bottom: 7px;

          p {
            margin: 0;
            padding: 0;
          }

          .customers-info-title {
            width: 300px;
            color: #566575;
          }

          .customers-info-value {
            width: 200px;
          }
        }

      }

      .customers-up-right {
        .real-time-info-item {
          display: flex;
          flex-direction: row;
          margin-bottom: 7px;

          p {
            margin: 0;
            padding: 0;
          }

          .real-time-info-title {
            width: 300px;
            color: #566575;
          }

          .real-time-info-value {
            width: 200px;
          }
        }
      }

      .customers-up-right {
        display: flex;
        gap: 20px;
        flex-direction: column;
        width: 700px;
        height: 480px;

        .real-time-info {
          width: 700px;
          height: 230px;
          background-color: #f8f9f9;
        }

        .total-record {
          width: 700px;
          height: 230px;
          background-color: #f8f9f9;
        }
      }
    }

    .customers-down {
      width: 1600px;
      height: 400px;
      background-color: #f8f9f9;

      .rfid {
        height: 100%;

        .rfid-detail {
          height: 100%;
        }
      }
    }

  }

}

.test {
  height: 50%;
}
</style>