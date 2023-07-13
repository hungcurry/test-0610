<script setup>
import { ref, reactive, onMounted} from 'vue'
import msi from '@/assets/msi_style'
import ApiFunc from '@/composables/ApiFunc'
import { useMStore } from "../stores/m_cloud"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {  ElMessage } from 'element-plus'
const MStore = useMStore()
const MsiApi = ApiFunc()
const first_name = ref('')
const last_name = ref('')
const email = ref('')
const ProgramVisible = ref(false)
const CheckProgramVisible = ref(false)
const CardData = reactive([])
const program_plan = reactive([])
const select_plan = reactive([])
const ProgramData = reactive([])
const companyData = reactive({})
let companyId = ''
let upgrade_manager = {}
let queryData = null
let response = null
let check_format_success = true
const Effective = ref('1')
const currentRow = ref()

const cancelProgram = () => {
  ProgramVisible.value = false
}

const subscribeProgram = async () => {
  check_format_success = true
    if (companyData.name === undefined || companyData.name === '') {
    ElMessage.error('Oops, Company name required.')
    check_format_success = false
  }
  if (companyData.address_str === undefined || companyData.address_str === '') {
    ElMessage.error('Oops, Address required.')
    check_format_success = false
  }
  if (companyData.phone === undefined || companyData.phone === '') {
    ElMessage.error('Oops, Phone required.')
    check_format_success = false
  }
  if (companyData.email === undefined || companyData.email === '') {
    ElMessage.error('Oops, Email required.')
    check_format_success = false
  }
  if (companyData.tax_id === undefined || companyData.tax_id === '') {
    ElMessage.error('Oops, Tax required.')
    check_format_success = false
  }
  if (check_format_success === true) {
  let sendData = { 'class': 'CompanyInformation', 'pk': companyId, 'plan': select_plan[0]._id, 
            invoice_detail:{title:companyData.name, address: companyData.address_str, phone: companyData.phone, email:companyData.email}, 
            tax_id:companyData.tax_id }
  console.log(await MsiApi.subscribe_plan(sendData))
  if (Effective.value === '1') {
    sendData = {}
    console.log(await MsiApi.auth_payment(sendData))
  }
  CheckProgramVisible.value = false
  }
}

const cancelCheckProgram = () => {
  CheckProgramVisible.value = false
}

const confirmProgram = () => {
  if (currentRow.value === undefined) {
    ElMessage.error('Please select program.')
  }
  else {
    if (CardData.length === 0) {
      ElMessage.error('Please binding card.')
    }
    else {
      ProgramVisible.value = false
      CheckProgramVisible.value = true
      Object.assign(select_plan, [currentRow.value]) 
    }
  }
}

const handleCurrentChange = (val) => {
  currentRow.value = val
}

const card_delete = async () => {
  const json = JSON.stringify({ c6n: CardData[0].card6No , c4n: CardData[0].card4No , bindD: CardData[0].bindingDate })
  let response = await MsiApi.unregister_bind_card(json)
  if (response.status === 200) 
      CardData.length = 0
  else 
    ElMessage.error(response.data.message)
}

const add_program = () => {
  ProgramVisible.value = true
}
const add_card = async () => {
  let response = await MsiApi.bind_card()
  if (response.status === 200) {
    document.body.innerHTML += response.data
    document.getElementById('formMSI').submit()
  }
  else {
    ElMessage.error(response.data.message)
  }
} 

onMounted( async () => {
  first_name.value = MStore.user_data.first_name
  last_name.value = MStore.user_data.last_name
  email.value = MStore.user_data.email
  companyData.email = MStore.user_data.email
  companyData.name = MStore.permission.company.name
  companyData.address = MStore.permission.company.address
  companyData.city = MStore.permission.company.city
  companyData.phone = MStore.permission.company.phone
  companyData.tax_id = MStore.permission.company.tax_id
  companyData.address_str = MStore.permission.company.city + MStore.permission.company.address

  queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
    { $match:  { "name": { "$eq": companyData.name } } }, { "$project": { "_id": 1, "upgrade_manager": 1 } }
  ]}
  response = await MsiApi.mongoAggregate(queryData)
  console.log(response)
  if (response.status === 200) {
    companyId = response.data.result[0]._id
    upgrade_manager = response.data.result[0]?.upgrade_manager
  }
  else {
    ElMessage.error(response.data.message)
  }

  response = await MsiApi.search_bind_card()
  if (response.status === 200) {
    if (response.data.cards.length > 0) {
      Object.assign(CardData, [response.data.cards[0].detail])
      CardData[0].card_num_str = CardData[0].card6No + '******' + CardData[0].card4No
    }
  }
  else {
    ElMessage.error(response.data.message)
  }
  if (companyData.name !== 'MSI') {
    queryData  = { "database": "CPO", "collection": "LimitPlan", "pipelines": [
    { $match: { "name": {"$ne": "MSI-Free"}} }, 
    { "$project": { "_id": 1, "connector":0} } ]}
  }
  else {
    queryData  = { "database": "CPO", "collection": "LimitPlan", "pipelines": [
    { $match: { "name": {"$eq": "MSI-Free"}} },  
    { "$project": { "_id": 1, "connector":0} } ]}
  }
  response = await MsiApi.mongoAggregate(queryData)
  
  if (response.status === 200) {
    Object.assign(program_plan, response.data.result )
    for (let i = 0; i < program_plan.length; i++ ) {
      if (program_plan[i]._id === upgrade_manager.subscribe.plan) {
        Object.assign(ProgramData, [program_plan[i]])
        break
      }
    }
  }
  else {
    ElMessage.error(response.data.message)
  }
})

</script>

<template>
<div>
  <h1>Personal Info</h1>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="First Name" >
      <el-input v-model="first_name" style="width: 300px"/>
    </el-form-item>
    <el-form-item label="Last Name" >
      <el-input v-model="last_name" style="width: 300px"/>
    </el-form-item>
    <el-form-item label="Email Name" >
      <el-input v-model="email" style="width: 300px"/>
    </el-form-item>
    <el-form-item label="Credit Card" >
      <el-button v-if="companyData.name === 'MSI' " @click="add_card" style="width: 300px" disabled> Add Card </el-button>
      <el-button v-else-if="CardData.length !== 0" @click="add_card" style="width: 300px" disabled> Add Card </el-button>
      <el-button v-else @click="add_card" style="width: 300px"> Add Card </el-button>
    </el-form-item>

    <el-form-item label="Card List" >
      <el-table :data="CardData" style="width: 80%; " stripe :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large" >
      <el-table-column prop="card_num_str" label="Card Number" min-width="80" />
      <el-table-column prop="expireDate" label="Expire Date(MM/YY)" min-width="80" />
      <el-table-column prop="bindingDate" label="Binding Date" min-width="80" />
      <el-table-column>
          <el-button @click="card_delete"> Delete Card</el-button>
      </el-table-column>
    </el-table>
    </el-form-item>

    <el-form-item label="Add Program" >
      <el-button v-if="ProgramData.length > 0" @click="add_program" style="width: 300px" disabled> Add Program </el-button>
      <el-button v-else-if="CardData.length > 0" @click="add_program" style="width: 300px"> Add Program </el-button>
      <el-button v-else @click="add_program" style="width: 300px" disabled>  Add Program </el-button>
    </el-form-item>

    <el-form-item label="Program" >
      <el-table :data="ProgramData" style="width: 80%; " stripe :cell-style=msi.tb_cell
      :header-cell-style=msi.tb_header_cell size="large">
      
      <el-table-column prop="name" label="Program Name" min-width="80" />
      <el-table-column prop="location" label="Location" min-width="60" />
      <el-table-column prop="evse" label="EVSE Quantity" min-width="80" />
      <el-table-column prop="connector" label="Connector" min-width="60"/>
      <el-table-column prop="tariff" label="Rate Plan" min-width="60"/>
      <el-table-column prop="user" label="User" min-width="40" />
      <el-table-column prop="admin_user" label="CPO Account" min-width="80" />
      <el-table-column prop="currency" label="Currency" min-width="80" />
      <el-table-column prop="price" label="Price" min-width="40" />
      <el-table-column>
        <el-button @click="add_program" disabled v-if="companyData.name === 'MSI' "> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
          <el-button @click="add_program" v-else> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
      </el-table-column>

    </el-table>
    </el-form-item>
  </el-form>

  <el-dialog v-model="ProgramVisible" title="Select Program">
    <el-table :data="program_plan" @current-change="handleCurrentChange" highlight-current-row>
      <el-table-column prop="name" label="Program Name" min-width="80" />
      <el-table-column prop="location" label="Location" min-width="60" />
      <el-table-column prop="evse" label="EVSE Quantity" min-width="80" />
      <el-table-column prop="connector" label="Connector" min-width="60"/>
      <el-table-column prop="tariff" label="Rate Plan" min-width="60"/>
      <el-table-column prop="user" label="User" min-width="40" />
      <el-table-column prop="admin_user" label="CPO Account" min-width="80" />
      <el-table-column prop="currency" label="Currency" min-width="80" />
      <el-table-column prop="price" label="Price" min-width="40" />
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelProgram">Cancel</el-button>
        <el-button type="primary" @click="confirmProgram">Confirm</el-button>
      </span>
    </template>
  </el-dialog>


  <el-dialog v-model="CheckProgramVisible" title="Check Program">
    <div class="mb-2 flex items-center text-sm">
    <el-radio-group v-model="Effective">
      <el-radio label="1" size="large">Effective immediately</el-radio>
      <el-radio label="2" size="large">Effective date will start in a month</el-radio>
    </el-radio-group>
  </div>
    <el-form label-position="left" label-width="100px">
      <el-table :data="select_plan" @current-change="handleCurrentChange" highlight-current-row>
        <el-table-column prop="name" label="Program Name" min-width="80" />
      <el-table-column prop="location" label="Location" min-width="60" />
      <el-table-column prop="evse" label="EVSE Quantity" min-width="80" />
      <el-table-column prop="connector" label="Connector" min-width="60"/>
      <el-table-column prop="tariff" label="Rate Plan" min-width="60"/>
      <el-table-column prop="user" label="User" min-width="40" />
      <el-table-column prop="admin_user" label="CPO Account" min-width="80" />
      <el-table-column prop="currency" label="Currency" min-width="80" />
      <el-table-column prop="price" label="Price" min-width="40" />
      </el-table>
      <br>
      <el-form-item label="Title" >
        <el-input v-model="companyData.name" style="width: 300px"/>
      </el-form-item>
      <el-form-item label="Address" >
        <el-input v-model="companyData.address_str" style="width: 300px"/>
      </el-form-item>
      <el-form-item label="Phone" >
        <el-input v-model="companyData.phone" style="width: 300px"/>
      </el-form-item>
      <el-form-item label="Tax" >
        <el-input v-model="companyData.tax_id" style="width: 300px"/>
      </el-form-item>
      <el-form-item label="Email" >
        <el-input v-model="companyData.email" style="width: 300px"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelCheckProgram">Cancel</el-button>
        <el-button type="primary" @click="subscribeProgram">Confirm</el-button>
      </span>
    </template>
  
  </el-dialog>
</div>
</template>

<style lang="scss" scoped>
  .el-input {
    --el-input-bg-color: rgb(86, 101, 117);
    --el-input-text-color: rgb(255, 255, 255);
  }
</style>