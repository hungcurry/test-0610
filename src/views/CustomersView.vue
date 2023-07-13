<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/composables/ApiFunc'
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

const UserTable = [
  {label:'First Name', value:'first_name', width:'40'}, {label:'Last Name', value:'last_name', width:'40'}, 
  {label:'E-mail', value:'email', width:'80'}, {label:'EVSE List', value:'evse_list_str', width:'40'}, 
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

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input" v-model="input" placeholder="Search" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <el-button class="add-user-btn" @click="addUser('', true)"> Add User </el-button>
      </div>
      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="UserData" 
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe 
            size="large"
            :cell-style=msi.tb_cell 
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column
              prop="first_name"
              label="First Name"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'first_name')"
              min-width="200"
            />
            <el-table-column
              prop="last_name"
              label="Last Name"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'last_name')"
              min-width="200"
            />
            <el-table-column
              prop="email"
              label="Email"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'email')"
              min-width="350"
            />
            <el-table-column
              prop="evse_list_str"
              label="EVSE List"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'evse_list_str')"
              min-width="150"
            />
            <el-table-column
              prop="payment_length"
              label="Used Times"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'payment_length')"
              min-width="200"
            />
            <el-table-column
              prop="updated_date_str"
              label="Updated Date"
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
                <el-button class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
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
                Add User
              </h4>
            </div>
          </template>
          <div class="dialog-context">
            <el-form class="max-w-500px m-auto">
              <div class="w-full flex justify-between flex-wrap">
                <el-form-item class="mb-24px sm:w-45% w-100%" label="First Name">
                  <el-input v-model.trim="newUser.first_name" />
                </el-form-item>
                <el-form-item class="mb-24px sm:w-45% w-100%" label="Last Name">
                  <el-input v-model.trim="newUser.last_name" />
                </el-form-item>
              </div>
              <el-form-item class="mb-24px" label="Email">
                <el-input v-model.trim="newUser.email" />
              </el-form-item>
            </el-form>
          </div>
          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="addUser('cancel', false)"
                >Cancel</el-button
              >
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="addUser('confirm', false)"
              >
                Confirm
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.customer {
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
  .add-user-btn {
    width: 15rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
    box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
  }
  .el-form-item {
    display: block;
  }
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
}

</style>