<template>
  <div class="program">
    <el-button class="add-program" @click="add_program"> Add Program</el-button>
    <el-table class="program-table" :data="ProgramData" style="width: 95%; height:80%" stripe 
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large" v-loading="isLoading">
      <el-table-column prop="name" label="Name" min-width="10"/>
      <el-table-column prop="location" label="Location" min-width="15"/>
      <el-table-column prop="evse" label="EVSE" min-width="10"/>
      <el-table-column prop="connector" label="Connector" min-width="10"/>
      <el-table-column prop="tariff" label="Rate Plan" min-width="10"/>
      <el-table-column prop="user" label="User" min-width="10"/>
      <el-table-column prop="admin_user" label="Administrator" min-width="10"/>
      <el-table-column prop="currency" label="Currency" min-width="10"/>
      <el-table-column prop="price" label="Price" min-width="10"/>
      <el-table-column  prop="" label="" min-width="5">
        <template #default="scope">
          <el-button v-if="scope.row.name === 'MSI-Free'" disabled @click="detail_info(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          <el-button v-else @click="detail_info(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
        </template>
      </el-table-column>
    </el-table>
  
    <el-dialog v-model="program_dialog_visible"  width="20%">
      <template #header="{}">
        <strong class="dialog-title" :id="titleId">{{ dialog_title }}</strong>
      </template>
      <el-form label-position="left" label-width="100px">
        <el-form-item label="Name">
          <el-input v-model="ProgramMod.name"/>
        </el-form-item>
        <el-form-item label="Station">
          <el-input v-model="ProgramMod.location"/>
        </el-form-item>
        <el-form-item label="EVSE">
          <el-input v-model="ProgramMod.evse"/>
        </el-form-item>
        <el-form-item label="Connector">
          <el-input v-model="ProgramMod.connector"/>
        </el-form-item>
        <el-form-item label="Rate Plan">
          <el-input v-model="ProgramMod.tariff"/>
        </el-form-item>
        <el-form-item label="User">
          <el-input v-model="ProgramMod.user"/>
        </el-form-item>
        <el-form-item label="Administrator">
          <el-input v-model="ProgramMod.admin_user"/>
        </el-form-item>
        <el-form-item label="Currency">
          <el-input v-model="ProgramMod.currency"/>
        </el-form-item>
        <el-form-item label="Price">
          <el-input v-model="ProgramMod.price"/>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">Cancel</el-button>
          <el-button v-if="dialog_title === 'Edit Program'" @click="deleteDialog">Delete</el-button>
          <el-button type="primary" @click="confirmDialog">Confirm</el-button>
        </span>
      </template>

    </el-dialog>
  </div>

</template>

<script setup>
import { ref, reactive, onMounted} from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import msi from '@/assets/msi_style'
import ApiFunc from '@/components/ApiFunc'
import { ElMessage, ElMessageBox } from 'element-plus'
const MsiApi = ApiFunc()
const ProgramData = reactive([])
const program_dialog_visible = ref(false)
const dialog_title = ref('Add Program')
const ProgramMod = reactive({})


const deleteDialog = async () => {
  let sendData = { 'class' : 'LimitPlan', 'pk' : ProgramMod._id }
  let res = undefined

  ElMessageBox.confirm('Do you want to delete program?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
    .then(async () => {
      res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
      if (res.status === 200) {
        program_dialog_visible.value = false
        ElMessage.success ('Delete Success')
        await getLimitPlan()
      }
      else {
        ElMessage.error(res.data.message)
      }
    })
}

const cancelDialog = () => {
  program_dialog_visible.value = false
}
const confirmDialog = async () => {
  let check_format_success = true
  let res = undefined
  let sendData = { 'class': 'LimitPlan', 'pk': ProgramMod._id, 'name': ProgramMod.name, 'location': ProgramMod.location, 'evse': ProgramMod.evse,
                  'connector': ProgramMod.connector, 'tariff': ProgramMod.tariff, 'user': ProgramMod.user, 'admin_user': ProgramMod.admin_user,
                  'currency': ProgramMod.currency, 'price': ProgramMod.price }

  if (ProgramMod.name === undefined || ProgramMod.name === '') {
    ElMessage.error('Oops, Name required.')
    check_format_success = false
  }
  if (ProgramMod.location === undefined || ProgramMod.location === '') {
    ElMessage.error('Oops, Location required.')
    check_format_success = false
  }
  if (ProgramMod.evse === undefined || ProgramMod.evse === '') {
    ElMessage.error('Oops, EVSE required.')
    check_format_success = false
  }
  if (ProgramMod.connector === undefined || ProgramMod.connector === '') {
    ElMessage.error('Oops, Connector required.')
    check_format_success = false
  }
  if (ProgramMod.tariff === undefined || ProgramMod.tariff === '') {
    ElMessage.error('Oops, Tariff required.')
    check_format_success = false
  }
  if (ProgramMod.user === undefined || ProgramMod.user === '') {
    ElMessage.error('Oops, User required.')
    check_format_success = false
  }
  if (ProgramMod.admin_user === undefined || ProgramMod.admin_user === '') {
    ElMessage.error('Oops, Admin User required.')
    check_format_success = false
  }    
  if (ProgramMod.currency === undefined || ProgramMod.currency === '') {
    ElMessage.error('Oops, Currency required.')
    check_format_success = false
  }    
  if (ProgramMod.price === undefined || ProgramMod.price === '') {
    ElMessage.error('Oops, Price required.')
    check_format_success = false
  }    
  if (check_format_success === true) {
    if (ProgramMod._id) {
    ElMessageBox.confirm('Do you want to edit program?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
        if (res.status === 200) {
            program_dialog_visible.value = false
            ElMessage.success ('Edit success')
            await getLimitPlan()
          }
        else {
          ElMessage.error (res.data.message)
        }
      })
  }
    else {
      ElMessageBox.confirm('Do you want to create program?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
        .then(async () => {
          res = await MsiApi.setCollectionData('post', 'cpo', sendData)
              if (res.status === 201) {
              program_dialog_visible.value = false
              ElMessage.success ('Create success')
              await getLimitPlan()
            }
            else {
              ElMessage.error (res.data.message)
            }
        })
    }
  }

}

const add_program = async () => {
  dialog_title.value = 'Add Program'
  program_dialog_visible.value = true
  ProgramMod.name = 'Hello'
  ProgramMod.location = 0
  ProgramMod.evse = 0
  ProgramMod.connector = 0
  ProgramMod.tariff = 0
  ProgramMod.user = 0
  ProgramMod.admin_user = 0
  ProgramMod.currency = 'TWD'
  ProgramMod.price = 0
  ProgramMod._id = undefined

}

const detail_info = async(scope) => {
  dialog_title.value = 'Edit Program'
  console.log(scope)
  console.log(scope.row)
  program_dialog_visible.value = true
  ProgramMod._id = scope.row._id
  ProgramMod.name = scope.row.name
  ProgramMod.location = scope.row.location
  ProgramMod.evse = scope.row.evse
  ProgramMod.connector = scope.row.connector
  ProgramMod.tariff = scope.row.tariff
  ProgramMod.user = scope.row.user
  ProgramMod.admin_user = scope.row.admin_user
  ProgramMod.currency = scope.row.currency
  ProgramMod.price = scope.row.price
}
const isLoading = ref(false)

const getLimitPlan = async() => {
  let queryData = { "database":"CPO", "collection":"LimitPlan", "query": {}}
  isLoading.value = true
  let res = await MsiApi.mongoQuery(queryData)
  if (res.status === 200) {
    ProgramData.length = 0
    Object.assign(ProgramData, res.data.all) 
  }
  else {
    ElMessage.error(res.data.message)
  }
  isLoading.value = false
}

onMounted( async() => {
  await getLimitPlan()
})


</script>

<style lang="scss" scoped>

.program {
  padding: 0px;
  margin: 0px;
  position: relative;
  width: 100%;
  height: 100%;

  .program-table {
    padding: 0px;
    margin: 0px;
    top: 100px;
    margin-left: 20px;
  //   margin: 20px 20px 20px 20px ;
  }

  .add-program {
    padding: 0px;
    margin: 0px;
    width: 220px;
    height: 40px;
    top: 20px;
    right : 60px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
}
.el-input {
    --el-input-bg-color: rgb(86, 101, 117);
    --el-input-text-color: rgb(255, 255, 255);
  }

.dialog-title {
  padding: 0px;
  margin: 0px;
  font-size: 20px;
}

</style>