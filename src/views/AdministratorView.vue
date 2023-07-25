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

const setPermission = (permission_id) => {
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
    <div class="container lg">
      <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button class="btn-secondary box-shadow" @click="addAdminUser"> Add Admin </el-button>
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
              label="E-mail"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'email')"
              min-width="200"
            />

            <el-table-column
              prop="phone"
              label="Phone"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'phone')"
              min-width="200"
            />

            <el-table-column
              prop="permission_str"
              label="Permission"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'permission_str')"
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
                <el-button class="btn-more" @click="detail_info(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-dialog
          v-model="AddAdminFormVisible"
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
                Add Admin User
              </h4>
            </div>
          </template>

          <div class="dialog-context">
            <el-form class="max-w-500px m-auto">
              <el-form-item class="mb-24px" label="First Name">
                <el-input v-model.trim="AddAdminData.first_name" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Last Name">
                <el-input v-model.trim="AddAdminData.last_name" />
              </el-form-item>

              <el-form-item class="mb-24px" label="E-mail">
                <el-input v-model.trim="AddAdminData.email"/>
              </el-form-item>

              <el-form-item class="mb-24px" label="Phone">
                <el-input v-model.trim="AddAdminData.phone" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Permission">
                <el-select 
                  class="el-select" 
                  v-model="AddAdminData.permission_str" 
                  placeholder="Select" 
                  size="large"
                  @change="setPermission"
                >
                  <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
                </el-select>
              </el-form-item>

              <el-form-item class="mb-24px" label="Edit">
                <el-switch v-model.trim="AddAdminData.permission_edit" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Active">
                <el-switch v-model.trim="AddAdminData.permission_active" />
              </el-form-item>
            </el-form>
          </div>

          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="AddAdmin('cancel', false)"
              >
                Cancel
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="AddAdmin('confirm', false)"
              >
                Confirm
              </el-button>
            </span>
          </template>
        </el-dialog>

        <el-dialog
          v-model="EditAdminFormVisible"
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
                Edit Admin User
              </h4>
            </div>
          </template>

          <div class="dialog-context">
            <el-form class="max-w-500px m-auto">
              <el-form-item class="mb-24px" label="First Name">
                <el-input v-model.trim="editAdminData.first_name" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Last Name">
                <el-input v-model.trim="editAdminData.last_name" />
              </el-form-item>

              <el-form-item class="mb-24px" label="E-mail">
                <el-input v-model.trim="editAdminData.email" disabled/>
              </el-form-item>

              <el-form-item class="mb-24px" label="Phone">
                <el-input v-model.trim="editAdminData.phone" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Permission">
                <el-select 
                  class="el-select" 
                  v-model.trim="editAdminData.permission_str" 
                  placeholder="Select" 
                  size="large"
                  @change="setPermission"
                >
                  <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
                </el-select>
              </el-form-item>

              <el-form-item class="mb-24px" label="Edit">
                <el-switch v-model.trim="editAdminData.permission_edit" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Active">
                <el-switch v-model.trim="editAdminData.permission_active" />
              </el-form-item>
            </el-form>
          </div>

          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editAdmin('delete')"
              >
              Delete
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editAdmin('cancel')"
              >
                Cancel
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editAdmin('confirm')"
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
  .el-form-item {
    display: block;
  }
  :deep(.el-form-item__label) {
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
}
</style>