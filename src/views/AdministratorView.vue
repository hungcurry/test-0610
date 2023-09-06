<script setup>
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud";
import moment from "moment"
import { useI18n } from "vue-i18n"
import { useRouter } from 'vue-router'

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const AddAdminFormVisible = ref(false)
const EditAdminFormVisible = ref(false)
const isLoading = ref(false)
const router = useRouter()

const AddAdminData = reactive([])
const UserData = reactive([])
const user_type = reactive([])
const editAdminData = reactive([])
const AdminData_ref = ref()
const AdminData_rules = reactive({
  first_name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  last_name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  permission_str: [
    { required: true, message: t('the_item_is_required'), trigger: 'change' },
  ],
})

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
  editAdminData.permission_edit = editAdminData.permission.edit === 1? true : false
  editAdminData.permission_active = editAdminData.permission.active === true? true : false
}

const editAdmin = async (action) => {
  if (action === 'confirm') {
    AdminData_ref.value.validate(valid => {
      if (valid) {
        EditAdminFormVisible.value = false
        // if (editAdminData.permission_edit !== true && editAdminData.permission.edit !== 1) {
        //   return
        // }
        editAdminData.permission_edit ? 1 : 3
        let sendData = {
          class: 'AdminUserData', pk: editAdminData._id,
          first_name: editAdminData.first_name, last_name: editAdminData.last_name,
          email: editAdminData.email, phone: editAdminData.phone,
          permission: { user: editAdminData.permission_id, edit: editAdminData.permission_edit, active: editAdminData.permission_active },
        }
        ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
          .then(async () => {
            let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
            if (res.status === 200) {
              GetPermission()
              console.log(await MongoAggregate())
            }
          })
          .catch((e) => {
            console.log(e)
            editAdminData.permission_edit = editAdminData.permission.edit === 1? true : false
            editAdminData.permission_active = editAdminData.permission.active === true? true : false
          })
      }
      else {
        return false
      }
    })

  }
  else if (action === 'delete') {
    EditAdminFormVisible.value = false
    let sendData = { class: 'AdminUserData', pk: editAdminData._id }

    ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
      .then(async () => {
        let res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
        if (res.status === 200) {
          GetPermission()
          console.log(await MongoAggregate())
        }
      })
      .catch((e) => {
        console.log(e)
        editAdminData.permission_edit = editAdminData.permission.edit === 1? 1 : 0
        editAdminData.permission_active = editAdminData.permission.active === true? true : false
      })
  }
  else if (action === 'cancel') {
    EditAdminFormVisible.value = false
    editAdminData.permission_edit = editAdminData.permission.edit === 1? true : false
    editAdminData.permission_active = editAdminData.permission.active === true? true : false
  }
}

const AddAdmin = async (action, visable) => {
  if (action === 'confirm') {
    if (MStore.permission.company.name !== 'MSI') {
      user_type.forEach((item) => {
        if (item.name === 'AdminUser') {
          AddAdminData.permission_id = item._id
        }
      })
    }
    AdminData_ref.value.validate(valid => {
      if (valid) {
        AddAdminFormVisible.value = visable
        let edit = AddAdminData.permission_edit ? 1 : 3
        let sendData = {
          first_name: AddAdminData.first_name, last_name: AddAdminData.last_name,
          permission: AddAdminData.permission_id, edit: edit, active: AddAdminData.permission_active ,
          email: AddAdminData.email, phone: AddAdminData.phone, company: MStore.permission.company.name, password: "msi32345599", dashboard: true
        }
    
        ElMessageBox.confirm(t('do_you_want_to_create'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
          .then(async () => {
            isLoading.value = true
            let res = await MsiApi.register_member(sendData)
            if (res.status === 201) {
              GetPermission()
              console.log(await MongoAggregate())
            }
            else if(res.status === 200) {
              ElMessage.error(t('email_already_exists'))
              isLoading.value = false
              AddAdminFormVisible.value = true
            }
            else {
              console.log(res)
              ElMessage.error(res.data.message)    // 404: "Mail not found."
              isLoading.value = false
              AddAdminFormVisible.value = true
            }
          })
          .catch((e) => {
            console.log(e)
            isLoading.value = false
          })
      }
      else {
        return false
      }
    })
  }
  else {
    AddAdminFormVisible.value = visable
  }
}

const MongoAggregate = async () => {
  isLoading.value = true
  
  let queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
    { $match:  { "name": { "$eq": MStore.permission.company.name } } }, { "$project": { "_id": 1} }
  ]}
  let res = await MsiApi.mongoAggregate(queryData)
  if (res.data.result === undefined) {
    router.push({ name: 'login' })
  }

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
        UserData[i].permission_str = user_type[j].name_str
      }
    }
  }
  isLoading.value = false
  return res.data.result
}

const GetPermission = async () => {
  let queryData = ''
  if (import.meta.env.VITE_NAME === 'dev') {
    queryData = { 
      database: 'CPO', 
      collection: 'UserPermission', 
      pipelines: [
        {
          $match: {
            name: {
              $nin: ['AnonymousUser', 'MemberUser', 'DeveloperUser', 'CustomerServiceUser']
            }
          }
        },
        { 
          $project: { _id: 1, name: 1 } 
        }
      ]
    }
  }
  else {
    queryData = {
      database: 'CPO', 
      collection: 'UserPermission', 
      pipelines: [
        {
          $match: {
            name: {
              $nin: ['AnonymousUser', 'MemberUser', ]
            }
          }
        },
        { 
          $project: { _id: 1, name: 1 } 
        }
      ]
    }
  }
  let response = await MsiApi.mongoAggregate(queryData)
  user_type.length = 0
  Object.assign(user_type, response.data.result)
  for (let i=0; i<user_type.length; i++) {
    if (user_type[i].name === 'EngineerUser') {
      user_type[i].name_str = t('engineer_user')
    }
    else if (user_type[i].name === 'AdminUser') {
      user_type[i].name_str = t('admin_user')
    }
    else if (user_type[i].name === 'DeveloperUser') {
      user_type[i].name_str = t('developer_user')
    }
    else if (user_type[i].name === 'ViewerUser') {
      user_type[i].name_str = t('viwer_user')
    }
    else if (user_type[i].name === 'FAEUser') {
      user_type[i].name_str = t('fae_user')
    }
    else if (user_type[i].name === 'CustomerServiceUser') {
      user_type[i].name_str = t('customer_service_user')
    }
  }
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
  console.log(await MongoAggregate())
})
</script>

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button class="btn-secondary box-shadow" @click="addAdminUser"> {{ t('add_admin') }} </el-button>
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
              :label="t('first_name')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'first_name')"
              min-width="200"
            />

            <el-table-column
              prop="last_name"
              :label="t('last_name')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'last_name')"
              min-width="200"
            />

            <el-table-column
              prop="email"
              :label="t('e_mail')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'email')"
              min-width="300"
            />

            <el-table-column
              prop="phone"
              :label="t('phone')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'phone')"
              min-width="200"
            />

            <el-table-column v-if="MStore.permission.company.name === 'MSI'"
              prop="permission_str"
              :label="t('permission')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'permission_str')"
              min-width="200"
            />

            <el-table-column
              prop="updated_date_str"
              :label="t('updated_date')"
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
                {{ t('add_admin') }}
              </h4>
            </div>
          </template>

          <div class="dialog-context">
            <el-form class="max-w-500px m-auto" :rules="AdminData_rules" ref="AdminData_ref" :model="AddAdminData" :scroll-to-error=true>
              <el-form-item class="mb-24px" :label="t('first_name')" prop="first_name">
                <el-input v-model="AddAdminData.first_name" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('last_name')" prop="last_name">
                <el-input v-model="AddAdminData.last_name" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('e_mail')" prop="email">
                <el-input v-model="AddAdminData.email"/>
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
                <el-input v-model="AddAdminData.phone" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('permission')" prop="permission_str"
              v-if="MStore.permission.company.name === 'MSI'"
              >
                <el-select 
                  class="el-select" 
                  v-model="AddAdminData.permission_str" 
                  :placeholder="t('select')" 
                  size="large"
                  @change="setPermission"
                >
                  <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
                </el-select>
              </el-form-item>

              <el-form-item class="mb-24px w-4em" :label="t('edit')">
                <el-switch v-model="AddAdminData.permission_edit" />
              </el-form-item>

              <el-form-item class="mb-24px w-4em" :label="t('active')">
                <el-switch v-model="AddAdminData.permission_active" />
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
                {{ t('cancel') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="AddAdmin('confirm', false)"
              >
                {{ t('confirm') }}
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
                {{ t('edit_admin') }}
              </h4>
            </div>
          </template>

          <div class="dialog-context">
            <el-form class="max-w-500px m-auto" :rules="AdminData_rules" ref="AdminData_ref" :model="editAdminData" :scroll-to-error=true>
              <el-form-item class="mb-24px" :label="t('first_name')" prop="first_name">
                <el-input v-model="editAdminData.first_name" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('last_name')" prop="last_name">
                <el-input v-model="editAdminData.last_name" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('e_mail')" prop="email">
                <el-input v-model="editAdminData.email" disabled/>
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
                <el-input v-model="editAdminData.phone" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('permission')" prop="permission_str" v-if="MStore.permission.company.name === 'MSI'">
                <el-select 
                  class="el-select" 
                  v-model="editAdminData.permission_str" 
                  :placeholder="t('select')" 
                  size="large"
                  @change="setPermission"
                >
                  <el-option v-for="item in user_type" :key="item.value" :label="item.name" :value="item._id" />
                </el-select>
              </el-form-item>

              <el-form-item class="mb-24px w-4em" :label="t('edit')">
                <el-switch v-model="editAdminData.permission_edit" />
              </el-form-item>

              <el-form-item class="mb-24px w-4em" :label="t('active')">
                <el-switch v-model="editAdminData.permission_active" />
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
              {{ t('delete') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editAdmin('cancel')"
              >
                {{ t('cancel') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editAdmin('confirm')"
                v-if="editAdminData.permission_edit === false"
                disabled
              >
                {{ t('confirm') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editAdmin('confirm')"
                v-else
              >
                {{ t('confirm') }}
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