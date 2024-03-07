<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const router = useRouter()
const MsiApi = ApiFunc()
let UserData = []
const UserDataRender = reactive([])
const search_input = ref('')
const isLoading = ref(false)
const dialogFormVisible = ref(false)
const newUser = reactive({first_name:'', last_name:'', email:'', password:'msi32345599'})
const add_user_ref = ref()
const add_user_rules = reactive({
  first_name: [{required: true, message: t('the_item_is_required'), trigger: 'blur'}],
  last_name: [{required: true, message: t('the_item_is_required'), trigger: 'blur'}],
  email: [{required: true, message: t('the_item_is_required'), trigger: 'blur'}]
})


const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]

  if (bt === undefined) return -1
  if (at > bt) return -1
}

const detail_info = (email) => {
  let user = UserData.find(item => item.email === email)
  router.push({ name: 'userDetail', query: {id: user._id} })
}

const search = async () => {
  try { 
    isLoading.value = true
    if (search_input.value === '') {
      await getUserData()
      await RenderUserData()
    }
    else {
      let hour = (Math.floor(Math.abs(MStore.timeZoneOffset) / 60)).toString().padStart(2, '0')
      let min = (Math.abs(MStore.timeZoneOffset) % 60).toString().padStart(2, '0')
      let timezone = MStore.timeZoneOffset > 0? '-' + hour + min : '+' + hour + min
      let queryData = { database: 'CPO', collection: 'UserData', 
        pipelines: [
          { 
            $addFields: { 
              updated_date_str: { $dateToString: { format: '%Y-%m-%d %H:%M:%S', date: { $dateFromString: { dateString: { $toString: '$updated_date'}}}, timezone: timezone}}
            }
          },
          { 
            $match : {
              $and: [ { first_name: {$ne: 'DELETE'} }, { last_name: {$ne: 'DELETE'} },
                { $or: [ { first_name: { $regex: search_input.value, $options: "i"}},
                         { last_name: { $regex: search_input.value, $options: "i"}},
                         { email: { $regex: search_input.value, $options: "i"}},
                         { updated_date_str: { $regex: search_input.value, $options: "i" }}]
                }
              ]
            }
          },
          { $project: { _id: 1, first_name: 1, last_name: 1, email: 1, evse_list: 1, payment_history:1, updated_date: 1,  home_info:1} }
        ]
      }
      let response = await MsiApi.mongoAggregate(queryData)
      if (response.status === 200)
        UserData = response.data.result
      else 
        ElMessage.error(response.data.message)
      await RenderUserData()
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
  finally {
    isLoading.value = false
  }
}

const addUser = async () => {
  if (UserData.length >= MStore.program.user && MStore.permission.isMSI === false) {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
    dialogFormVisible.value = true
    newUser.first_name = newUser.last_name = newUser.email = ''
}

const addUserDialog = async () => {
  try {
    add_user_ref.value.validate(valid => {
      if (valid) {
        ElMessageBox.confirm(t('do_you_want_to_create'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
        .then(async () => {
          isLoading.value = true
          let sendData = {role:'member', first_name: newUser.first_name, last_name: newUser.last_name, email: newUser.email, password: newUser.password} 
          let res = await MsiApi.register_member(sendData)
          if (res.data.message === 'Accepted') {
            dialogFormVisible.value = false
            isLoading.value = true
            await getUserData()
            await RenderUserData()
            isLoading.value = false
            ElMessage.success('Success')
          }
          else if (res.data.message === 'User is exist') {
            ElMessage.error(t('email_already_exists'))
          }
          else { 
            ElMessage.error(res.data.message)
          }
          isLoading.value = false
        })
      }
      else {
        return false
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const RenderUserData = async () => {
  try {
    UserDataRender.length = 0
    for (let i = 0; i < UserData.length; i++) {
      let UserDataRenderObj = { first_name:'', last_name:'', email:'', evse_list:'', updated_date_str: '', payment_length: 0,
                                home_device: 0, evse_list_str: '', evse_list_str_detail: '' , created_date_str:''}
      UserDataRenderObj.first_name = UserData[i].first_name
      UserDataRenderObj.last_name = UserData[i].last_name
      UserDataRenderObj.email = UserData[i].email

      let localEndTime = new Date( (new Date(UserData[i].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      UserDataRenderObj.updated_date_str= moment(localEndTime).format("YYYY-MM-DD HH:mm:ss")
      let localEndTime1 = new Date( (new Date(UserData[i].created_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      UserDataRenderObj.created_date_str = moment(localEndTime1).format("YYYY-MM-DD HH:mm:ss")
      if (UserData[i]?.payment_history)
        UserDataRenderObj.payment_length = UserData[i].payment_history.length
      if (UserData[i]?.home_info?.devices?.length)
        UserDataRenderObj.home_device = UserData[i].home_info.devices.length
      if (UserData[i]?.evse_list?.length) {
        UserDataRender.evse_list_str += UserData[i].evse_list[0].evseId 
        if (UserData[i]?.evse_list?.length > 1) {
          UserDataRender.evse_list_str += ' / ...'
          for (let j = 0; j < UserData[i]?.evse_list?.length; j++) {
            UserDataRender.evse_list_str_detail += UserData[i]?.evse_list[j]?.evseId 
            if (j !== UserData?.evse_list?.length - 1)
              UserDataRender.evse_list_str_detail += ' / '
          }
        }
      }
      UserDataRender.push(UserDataRenderObj)
    }
  } catch (error) {
    ElMessage.error('An unexpected error occurred.')
  }
}

const getUserData = async () => {
  let queryData = { database: 'CPO', collection: 'UserData', 
    pipelines: [ 
      { $match: { $and: [{ first_name: {$ne: 'DELETE'} }, { last_name: {$ne: 'DELETE'} }]}},
      { $project: { _id: 1, first_name: 1, last_name: 1, email: 1, evse_list: 1, payment_history:1, updated_date: 1, home_info:1, created_date:1} }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200)
    UserData = response.data.result
  else 
  ElMessage.error(response.data.message)
}

onMounted( async() => {
  try {
    isLoading.value = true
    await getUserData()
    await RenderUserData()
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
  finally{
    isLoading.value = false
  }
})
</script>

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input mb-12px lg:mb-0" v-model="search_input" :placeholder="t('first_name_last_name_email_time')" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <el-button 
        v-if="MStore.rule_permission.User.addUser === 'O'"
        class="btn-secondary box-shadow" @click="addUser"> {{ t('add_user') }} </el-button>
      </div>
      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="UserDataRender" 
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
              min-width="150"
            />
            <el-table-column
              prop="last_name"
              :label="t('last_name')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'last_name')"
              min-width="150"
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
              prop="evse_list_str"
              :label="t('occupied_evse_id')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'evse_list_str')"
              min-width="200"
            >
              <template #default="scope">
                <span v-if="scope.row.evse_list_str_detail === ''">{{ scope.row.evse_list_str }}</span>
                <el-tooltip v-else placement="bottom-start">
                  <template #content>
                    <div v-html="scope.row.evse_list_str_detail"></div>
                    <!-- <div class="max-h-300px overflow-y-auto w-200px text-16px line-height-30px"> {{ scope.row.evse_list_str_detail }} </div> -->
                  </template>
                  <el-button class="overflow-hidden evse-tooltip-btn">
                    <span class="font-400 text-1.8rem line-height-2rem text-black-200"> {{ scope.row.evse_list_str }} </span>
                  </el-button>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              prop="payment_length"
              :label="t('used_times')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'payment_length')"
              min-width="200"
            />

            <el-table-column
              prop="home_device"
              :label="t('home_device')"
              align="center"
              sortable
              min-width="150"
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
              prop="created_date_str"
              :label="t('created_date')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'created_date_str')"
              min-width="200"
            />
            <el-table-column
              prop="detail"
              label=""
              align="center"
              min-width="150"
            >
              <template #default="scope">
                <el-button v-if="MStore.rule_permission.User.userDetail === 'O'"
                class="btn-more" @click="detail_info(scope.row.email)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
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
                {{ t('add_user') }}
              </h4>
            </div>
          </template>
          <div class="dialog-context">
            <el-form class="max-w-500px m-auto" :rules="add_user_rules" ref="add_user_ref" :model="newUser" :scroll-to-error=true>
              <div class="w-full flex justify-between flex-wrap">
                <el-form-item class="mb-24px sm:w-45% w-100%" :label="t('first_name')" prop="first_name">
                  <el-input v-model="newUser.first_name" />
                </el-form-item>
                <el-form-item class="mb-24px sm:w-45% w-100%" :label="t('last_name')" prop="last_name">
                  <el-input v-model="newUser.last_name" />
                </el-form-item>
              </div>
              <el-form-item class="mb-24px" :label="t('e_mail')" prop="email">
                <el-input v-model="newUser.email" />
              </el-form-item>
            </el-form>
          </div>
          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="dialogFormVisible = false"
                >{{ t('cancel') }}</el-button
              >
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="addUserDialog('confirm')"
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
  .evse-tooltip-btn {
    background-color: unset;
  }
  .el-form-item {
    display: block;
  }
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
}

::-webkit-scrollbar {
  width: 0.8rem;
  height: 0.8rem;
}
::-webkit-scrollbar-thumb {
  background-color: var(--gray-300);
}
::-webkit-scrollbar-thumb {
  border-radius: 2rem;
}

</style>