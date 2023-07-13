<script setup>
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud";
import moment from "moment"
const MStore = useMStore()
const MsiApi = ApiFunc()
const AddAdminFormVisible = ref(false)
const EditAdminFormVisible = ref(false)
const isLoading = ref(false)

const AddAdminData = reactive([])
const UserData = reactive([])
const user_type = reactive([])
const editAdminData = reactive([])

const UserTable = [{ label: 'First Name', value: 'first_name', width: '80' }, { label: 'Last Name', value: 'last_name', width: '80' },
{ label: 'E-mail', value: 'email', width: '80' }, { label: 'Phone', value: 'phone', width: '80' },
{ label: 'Permission', value: 'permission_str', width: '80' }, { label: 'Updated Date', value: 'updated_date_str', width: '80' },
{ label: '', value: 'detail', width: '80', type: 'button' }
]

const setPermission = (permission_id) => {
  
  console.log(permission_id)

  if (AddAdminFormVisible.value === true) {
    AddAdminData.permission_id = permission_id
  }

  else if (EditAdminFormVisible.value === true) {
    editAdminData.permission_id = permission_id
  }
}

const detail_info = (detail) => {
  EditAdminFormVisible.value = true
  editAdminData.length = 0
  Object.assign(editAdminData, UserData[detail.$index])
  console.log(editAdminData?.permission?.user)
  editAdminData.permission_id = editAdminData?.permission?.user
  if (editAdminData.permission.edit === 1) {
    editAdminData.permission_edit = true
  }
  if (editAdminData.permission.active === true) {
    editAdminData.permission_active = true
  }
}

const editAdmin = async (action) => {
  EditAdminFormVisible.value = false
  if (action === 'confirm') {
    editAdminData.permission_edit ? 1 : 3
    let sendData = {
      class: 'AdminUserData', pk: editAdminData._id,
      first_name: editAdminData.first_name, last_name: editAdminData.last_name,
      email: editAdminData.email, phone: editAdminData.phone,
      permission: { user: editAdminData.permission_id, edit: editAdminData.permission_edit, active: editAdminData.permission_active },
    }
    ElMessageBox.confirm('Do you want to modify?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
        if (res.status === 200) {
          GetPermission()
          let queryData = { "database": "CPO", "collection": "AdminUserData", "query": {} }
          console.log(await MongoQurey(queryData))
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
  else if (action === 'delete') {
    let sendData = { class: 'AdminUserData', pk: editAdminData._id }

    ElMessageBox.confirm('Do you want to delete?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        let res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
        if (res.status === 200) {
          GetPermission()
          let queryData = { "database": "CPO", "collection": "AdminUserData", "query": {} }
          console.log(await MongoQurey(queryData))
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
}

const AddAdmin = async (action, visable) => {

  AddAdminFormVisible.value = visable
  let check_format_success = true
  if (action === 'confirm') {
    console.log(AddAdminData.permission_edit)
    let edit = AddAdminData.permission_edit ? 1 : 3
    let sendData = {
      first_name: AddAdminData.first_name, last_name: AddAdminData.last_name,
      permission: AddAdminData.permission_id, edit: edit, active: AddAdminData.permission_active ,
      email: AddAdminData.email, phone: AddAdminData.phone, company: MStore.permission.company.name, password: "msi32345599", dashboard: true
    }

    if (AddAdminData.email === undefined || AddAdminData.email === '') {
      ElMessage.error('Oops, Email required.')
      check_format_success = false
    }
    if (AddAdminData.first_name === undefined || AddAdminData.first_name === '') {
      ElMessage.error('Oops, First name required.')
      check_format_success = false
    }
    if (AddAdminData.first_name === undefined || AddAdminData.last_name === '') {
      ElMessage.error('Oops, Last name required.')
      check_format_success = false
    }
    if (AddAdminData.permission_id === undefined || AddAdminData.permission_id === '') {
      ElMessage.error('Oops, Permission name required.')
      check_format_success = false
    }

    if (check_format_success === true) {
      ElMessageBox.confirm('Do you want to create?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
        .then(async () => {
          isLoading.value = true
          let res = await MsiApi.register_member(sendData)
          if (res.status === 201) {
            GetPermission()
            let queryData = { "database": "CPO", "collection": "AdminUserData", "query": {} }
            console.log(await MongoQurey(queryData))
          }
          else if(res.status === 200) {
            ElMessage.error('email already exists')
            isLoading.value = false
          }
        })
        .catch((e) => {
          console.log(e)
        })
    }
  }
}

const MongoQurey = async (queryData) => {
  isLoading.value = true
  
  queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
    { $match:  { "name": { "$eq": MStore.permission.company.name } } }, { "$project": { "_id": 1} }
  ]}
  let res = await MsiApi.mongoAggregate(queryData)

  queryData = { "database": "CPO", "collection": "AdminUserData", "pipelines": [
                { $match: { "byCompany": { "$eq": { "ObjectId" : res.data.result[0]._id} } } }, 
                { "$project": {  "hashed_password_1": 0,"hashed_password_2": 0,"salt": 0} }
  ]}
  res = (await MsiApi.mongoAggregate(queryData))
  UserData.length = 0
  Object.assign(UserData, res.data.result)
  for (let i = 0; i < UserData.length; i++) {
    let localEndTime =  new Date( (new Date(UserData[i].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    UserData[i].updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    for (let j = 0; j < user_type.length; j++) {     
      if (UserData[i].permission.user === user_type[j]._id) {
        UserData[i].permission_str = user_type[j].name
      }
    }
  }
  isLoading.value = false
  return res.data.result
}

const GetPermission = async () => {
  let queryData = { "database": "CPO", "collection": "UserPermission", "query": {} }
  let response = await MsiApi.mongoQuery(queryData)
  user_type.length = 0
  const filteredArr = response.data.all.filter(item => item.name !== 'AnonymousUser' && item.name !== 'MemberUser'
    && item.name !== 'DeveloperUser' && item.name !== 'CustomerServiceUser')
  Object.assign(user_type, filteredArr)
}

const addAdminUser = async () => {
  AddAdminData.first_name = ''
  AddAdminData.last_name = ''
  AddAdminData.email = ''
  AddAdminData.phone = ''
  AddAdminData.permission_str = ''
  AddAdminData.permission_edit = true
  AddAdminData.permission_active = true 
  AddAdminFormVisible.value = true
}

onMounted(async () => {
  await GetPermission()
  let queryData = { "database": "CPO", "collection": "AdminUserData", "query": {} }
  console.log(await MongoQurey(queryData))
})
</script>

<template>
  <div class="customer">

    <el-button class="add-user-btn" @click="addAdminUser"> Add Admin </el-button>

    <div class="customer-list">
      <el-table :data="UserData" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell
        :header-cell-style=msi.tb_header_cell size="large" v-loading="isLoading">
        <el-table-column v-for="item in UserTable" :key="item" :prop=item.value :label=item.label :min-width=item.width
          :sortable="item.sortable">
          <template #default="scope" v-if="item.type === 'button'">
            <el-button @click="detail_info(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="AddAdminFormVisible" title="Add Admin User" draggable>
      <el-form :model="AddAdminData">
        <el-form-item label="First Name">
          <el-input v-model="AddAdminData.first_name" />
        </el-form-item>
        <el-form-item label="Last Name">
          <el-input v-model="AddAdminData.last_name" />
        </el-form-item>
        <el-form-item label="E-Mail">
          <el-input v-model="AddAdminData.email" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="AddAdminData.phone" />
        </el-form-item>
        <el-form-item label="Permission">
          <el-select class="el-select" v-model="AddAdminData.permission_str" placeholder="Select" size="large"
            @change="setPermission">
            <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Edit">
          <el-switch v-model="AddAdminData.permission_edit" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="AddAdminData.permission_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddAdmin('cancel', false)">Cancel</el-button>
          <el-button type="primary" @click="AddAdmin('confirm', false)">Confirm</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="EditAdminFormVisible" title="Edit Admin User" draggable>
      <el-form :model="editAdminData">
        <el-form-item label="First Name">
          <el-input v-model="editAdminData.first_name" />
        </el-form-item>
        <el-form-item label="Last Name">
          <el-input v-model="editAdminData.last_name" />
        </el-form-item>
        <el-form-item label="E-Mail">
          <el-input v-model="editAdminData.email" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="editAdminData.phone" />
        </el-form-item>
        <el-form-item label="Permission">
          <el-select class="el-select" v-model="editAdminData.permission_str" placeholder="Select" size="large"
            @change="setPermission">
            <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Edit">
          <el-switch v-model="editAdminData.permission_edit" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="editAdminData.permission_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editAdmin('delete')">Delete</el-button>
          <el-button @click="editAdmin('cancel')">Cancel</el-button>
          <el-button type="primary" @click="editAdmin('confirm')">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.customer {
  position: relative;
  width: 100%;
  height: 100%;

  .customer-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left: 40px;
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
    right: 300px;
    position: absolute;
  }

  .add-user-btn {
    width: 220px;
    height: 40px;
    top: 40px;
    right: 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color: #FFFFFF;
    border-radius: 20px;
  }
}
</style>