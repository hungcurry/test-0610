<template>
  <div class="customer">
    <el-input class="search-input" v-model="input" placeholder="Please input" @keyup.enter.native="search">
      <template #append>
        <el-button :icon="Search" @click="search" />
      </template>
    </el-input>

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
          <el-input v-model="AddAdminData.first_name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Last Name">
          <el-input v-model="AddAdminData.last_name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="E-Mail">
          <el-input v-model="AddAdminData.email" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="AddAdminData.phone" autocomplete="off" />
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
          <el-input v-model="editAdminData.first_name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Last Name">
          <el-input v-model="editAdminData.last_name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="E-Mail">
          <el-input v-model="editAdminData.email" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="editAdminData.phone" autocomplete="off" />
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

<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud";
const MStore = useMStore()
const MsiApi = ApiFunc()
const AddAdminFormVisible = ref(false)
const EditAdminFormVisible = ref(false)
const isLoading = ref(false)

const AddAdminData = reactive([])
const UserData = reactive([])
const user_type = reactive([])
const editAdminData = reactive([])

const input = ref('')
const UserTable = [{ label: 'First Name', value: 'first_name', width: '80' }, { label: 'Last Name', value: 'last_name', width: '80' },
{ label: 'Email', value: 'email', width: '80' }, { label: 'Phone', value: 'phone', width: '80' },
{ label: 'Permission', value: 'permission_str', width: '80' }, { label: 'Updated Date', value: 'updated_date', width: '80' },
{ label: '', value: 'detail', width: '80', type: 'button' }
]

const setPermission = (test) => {
  editAdminData.permission = test
}

const detail_info = (detail) => {
  EditAdminFormVisible.value = true
  editAdminData.length = 0
  Object.assign(editAdminData, UserData[detail.$index])
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
    if (editAdminData.permission_edit === true) {
      editAdminData.permission_edit = 1
    }
    let sendData = {
      class: 'AdminUserData', pk: editAdminData._id,
      first_name: editAdminData.first_name, last_name: editAdminData.last_name,
      email: editAdminData.email, phone: editAdminData.phone,
      permission: { user: editAdminData.permission, edit: editAdminData.permission_edit, active: editAdminData.permission_active },
      dashboard: true
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
  let check_format_sucess = true
  if (action === 'confirm') {
    let sendData = {
      first_name: AddAdminData.first_name, last_name: AddAdminData.last_name,
      email: AddAdminData.email, phone: AddAdminData.phone, company: MStore.permission.company.name, password: "msi32345599", dashboard: true
    }

    if (AddAdminData.email === undefined || AddAdminData.email === '') {
      ElMessage.error('Oops, Email required.')
      check_format_sucess = false
    }
    if (AddAdminData.first_name === undefined || AddAdminData.first_name === '') {
      ElMessage.error('Oops, First name required.')
      check_format_sucess = false
    }
    if (AddAdminData.last_name === undefined || AddAdminData.last_name === '') {
      ElMessage.error('Oops, Last name required.')
      check_format_sucess = false
    }
    if (check_format_sucess === true) {
      ElMessageBox.confirm('Do you want to create?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
        .then(async () => {
          let res = await MsiApi.register_member(sendData)
          if (res.status === 201) {
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
}

const search = async () => {
  let queryData = null
  if (input.value === '') {
    queryData = { "database": "CPO", "collection": "CompanyInformation", "query": {} }
  }
  else {
    queryData = {
      "database": "CPO", "collection": "CompanyInformation", "query": {
        "$or": [
          { "name": { "$regex": input.value, "$options": "$i" } }, { "party_id": { "$regex": input.value, "$options": "$i" } },
          { "country": { "$regex": input.value, "$options": "$i" } }, { "city": { "$regex": input.value, "$options": "$i" } },
          { "address": { "$regex": input.value, "$options": "$i" } }, { "phone": { "$regex": input.value, "$options": "$i" } },
          { "remark": { "$regex": input.value, "$options": "$i" } }, { "taxID": { "$regex": input.value, "$options": "$i" } },
          { "updated_date": { "$regex": input.value, "$options": "$i" } },
        ]
      }
    }
  }
  await MongoQurey(queryData)
}

const MongoQurey = async (queryData) => {
  isLoading.value = true
  let response = await MsiApi.mongoQuery(queryData)
  UserData.length = 0
  Object.assign(UserData, response.data.all)
  for (let i = 0; i < UserData.length; i++) {
    for (let j = 0; j < user_type.length; j++) {
      if (UserData[i].permission.user === user_type[j]._id) {
        UserData[i].permission_str = user_type[j].name
      }
    }
  }
  isLoading.value = false
  return response
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
  AddAdminFormVisible.value = true
}

onMounted(async () => {
  GetPermission()
  let queryData = { "database": "CPO", "collection": "AdminUserData", "query": {} }
  console.log(await MongoQurey(queryData))
})
</script>

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
}</style>