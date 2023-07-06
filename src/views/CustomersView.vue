<template>
  <div class="customer">
    <el-input class="search-input" v-model="input" placeholder="Please input" @keyup.enter="search">
      <template #append>
        <el-button :icon="Search" @click="search" />
      </template>
    </el-input>

    <el-button class="add-user-btn" @click="addUser('', true)"> Add User </el-button>

    <div class="customer-list">
      <el-table :data="UserData" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large"
      v-loading = "isLoading">
        <el-table-column v-for="item in UserTable" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable">
          <template #default="scope" v-if ="item.type === 'button'">
            <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogFormVisible" title="Add User" draggable>
      <p> First Name </p>
        <el-input v-model="newUser.first_name" />
        <br><br>
        <p> Last Name </p>
        <el-input v-model="newUser.last_name" />
        <br><br>
        <p> Email </p>
        <el-input v-model="newUser.email" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUser('cancel', false)">Cancel</el-button>
          <el-button type="primary" @click="addUser('confirm', false)">Confirm</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import {  ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"

const MStore = useMStore();

const router = useRouter()
const MsiApi = ApiFunc()
const UserData = reactive([])
const input = ref('')
const isLoading = ref(false)
const dialogFormVisible = ref(false)
const user_type = reactive([])
const newUser = reactive({first_name:'', last_name:'', email:'', password:'msi32345599'})

const UserTable = [
  {label:'First Name', value:'first_name', width:'40'}, {label:'Last Name', value:'last_name', width:'40'}, 
  {label:'Email', value:'email', width:'80'}, {label:'EVSE List', value:'evse_list_str', width:'40'}, 
  {label:'Used Times', value:'payment_length', width:'30'}, {label:'Updated Date', value:'updated_date_str', width:'80'}, 
  {label:'', value:'detail', width:'20', type:'button'}
]

const GetPermission = async () => {
  let queryData = { "database":"CPO", "collection":"UserPermission", "query": {}}
  let response = await MsiApi.mongoQuery(queryData)
  user_type.length = 0
  Object.assign(user_type, response.data.all)

  for( let i = 0; i < user_type.length-1; i++){ 
   if (user_type[i].name ===  'AdminUser') 
      user_type.splice(i, 1); 
  }
  for( let i = 0; i < user_type.length-1; i++){ 
   if ( user_type[i].name === 'EngineerUser' ) 
    user_type.splice(i, 1); 
  }
  for( let i = 0; i < user_type.length-1; i++){ 
   if ( user_type[i].name === 'CustomerServiceUser' ) 
    user_type.splice(i, 1); 
  }
  for( let i = 0; i < user_type.length-1; i++){ 
   if ( user_type[i].name === 'DeveloperUser' ) 
    user_type.splice(i, 1); 
  }
}

const detail_info = (detail) => {
  router.push({ name: 'customersDetail', query:{id:detail._id} })
}


const search = async () => {
  let queryData = null
  if (input.value === '') {
    queryData = { "database":"CPO", "collection":"UserData", "query": {}}
  }
  else {
    queryData = { "database":"CPO", "collection":"UserData", "query": {
      "$or" : [
        {"first_name":{"$regex": input.value ,"$options":"i"} } , 
        {"last_name":{"$regex": input.value ,"$options":"i"} } , 
        {"email":{"$regex": input.value ,"$options":"i"} } , 
        {"updated_date":{"$regex": input.value ,"$options":"i"} } , 
      ]
    }}
  }
  await MongoQurey(queryData)
}

const MongoQurey = async (queryData) => {
  isLoading.value = true
  let response = await MsiApi.mongoQuery(queryData)
  UserData.length = 0
  Object.assign(UserData, response.data.all)
  for (let i = 0; i < UserData.length; i++) {
    let localEndTime =  new Date( (new Date(UserData[i].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    UserData[i].updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    UserData[i].payment_length = UserData[i]?.payment_history?.length
    UserData[i].evse_list_str = ''
    for (let j = 0; j < UserData[i]?.evse_list?.length; j++) {
      UserData[i].evse_list_str += UserData[i]?.evse_list[j]?.evseId + ' / '
    }
  }
  isLoading.value = false
  return response
}

const addUser = async (action, visible) => {
  dialogFormVisible.value = visible

  if (action === 'confirm') {
    let sendData = {'first_name' : newUser.first_name, 'last_name' : newUser.last_name,
     'email' : newUser.email, 'password': newUser.password, company:MStore.permission.company.name} 
    
    ElMessageBox.confirm('Do you want to create?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
    .then(async () => {
      isLoading.value = true
      let res = await MsiApi.register_member(sendData)
      console.log(res)
      if (res.status === 200) {
        ElMessage.error('email already exists')
      }
      else if (res.status === 201) {
        let queryData = { "database":"CPO", "collection":"UserData", "query": {}}
        await MongoQurey(queryData)
      }
      else { 
        ElMessage.error(res.data.message)
      }
      isLoading.value = false
    })
    .catch((e)=>{
      ElMessage.error(e)
    })
  }
  newUser.first_name = newUser.last_name = newUser.email = ''
}

onMounted( async() => {
    let queryData = { "database":"CPO", "collection":"UserData", "query": {}}
    console.log( await MongoQurey(queryData))
    GetPermission()
})
</script>

<style lang="scss" scoped>

.customer {
  position: relative;
  width: 100%;
  height: 100%;
  .customer-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left : 40px;
    position: absolute;
  }

  .customer-list-btn {
    top: 40px;
    left: 40px;
    position: absolute;
  }
  .guest-list-btn {
    top: 40px;
    left: 160px;
    position: absolute;
  }

  .search-input {
    width: 400px;
    height: 40px;
    top: 40px;
    right : 300px;
    position: absolute;
  }

  .add-user-btn {
    width: 220px;
    height: 40px;
    top: 40px;
    right : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
}


.el-dialog {
  p{
    width: 200px;
  }
  .el-input {
    --el-input-bg-color: rgb(86, 101, 117);
    --el-input-text-color: rgb(255, 255, 255);
    width: 200px;
  }
}

</style>