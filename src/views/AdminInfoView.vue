<script setup>
import msi from '@/assets/msi_style'
import ApiFunc from '@/composables/ApiFunc'
import moment from "moment"
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const first_name = ref('')
const last_name = ref('')
const email = ref('')
const due_date_time_str = ref('')
const ProgramVisible = ref(false)
const CheckProgramVisible = ref(false)
const ProgramRuleVisible = ref(false)
const CardData = reactive([])
const program_plan = reactive([])
const select_plan = reactive([])
const ProgramData = reactive([])
const NextProgramData = reactive([])
const companyData = reactive({})
const Effective = ref('1')
const EffectiveRestriction = ref(false)
const currentRow = ref()
const isLoading = ref(false)
const selectProgram = ref('1')
let companyId = ''
let upgrade_manager = {}
let queryData = null
let response = null
let language = localStorage.getItem("lang")
const first_login = ref(false)
const adminInfo_ref = ref()
const adminInfo_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  address_str: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  phone: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  tax_id: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})

const getNextProgramDate = (date) => {
  let arr = date.split('-')
  let year = arr[0]
  let month = arr[1]
  let day = arr[2]
  let newYear = year
  let newMonth = parseInt(month) + 1
  let newDay = day
  let newDay2 = new Date(newYear, newMonth, 0)
  newDay2 = newDay2.getDate()
  if (newMonth > 12) {
    newYear = parseInt(newYear) + 1
    newMonth = 1
  }
  if (newDay > newDay2) {
    newDay = newDay2
  }
  if (newMonth < 10) {
    newMonth = '0' + newMonth
  }

  // let newProgramDate = newYear + '-' + newMonth + '-' + newDay
  // console.log(date)
  // console.log(newProgramDate)
}
const tableRowClassName  = (row) => {
  if (row.row._id === ProgramData[0]._id && selectProgram.value === '1') {
    selectProgram.value = ProgramData[0]._id
  }
  if (row.row.disable === true) {
    return 'disable-row'
  }
}
const checkAvailableProgram = async() => {
  let station_cnt = 0
  let evse_cnt = 0
  let plan_cnt = 0
  let user_cnt = 0
  let admin_user_cnt = 0

  // station_cnt
  queryData = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [{ $project: { _id: 0, facilities: 1 } }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  station_cnt = response?.data?.result?.length

  // evse_cnt
  queryData = {
    database: 'OCPI',
    collection: 'EVSE',
    pipelines: [
      {
        $facet: {
          totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
        },
      },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)
  evse_cnt = response.data.result[0].totalCount?.[0]?.totalCount

  // plan_cnt
  queryData  = { 
    database: "OCPI", 
    collection: "Tariff", 
    pipelines: [ { $project: {   last_updated:0} }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  plan_cnt = response?.data?.result?.length

  // user_cnt
  queryData = {
    database: 'CPO',
    collection: 'UserData',
    pipelines: [{ $count: 'memberCount' }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  user_cnt = response?.data?.result?.[0]?.memberCount

  // admin_user_cnt
  queryData = {
    database: 'CPO',
    collection: 'AdminUserData',
    pipelines: [
      { $match: { "byCompany": { "$eq": { "ObjectId" : companyId} } } },
      { $count: 'adminCount' }
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)
  admin_user_cnt = response.data.result[0].adminCount

  for (let i=0; i<program_plan.length; i++) {
    if (
      station_cnt > program_plan[i].location ||
      evse_cnt > program_plan[i].evse ||
      plan_cnt > program_plan[i].tariff ||
      user_cnt > program_plan[i].user ||
      admin_user_cnt > program_plan[i].admin_user) 
    {
      program_plan[i].disable = true
    }
  }
}

const cancelProgram = () => {
  ProgramVisible.value = false
  selectProgram.value = '1'
}
const subscribeProgram = async () => {
  adminInfo_ref.value.validate(async valid => {
    if (valid) {
      let sendData = {
        class: 'CompanyInformation',
        pk: companyId,
        plan: select_plan[0]._id,
        invoice_detail: {
          title: companyData.name,
          address: companyData.address_str,
          phone: companyData.phone,
          email: companyData.email,
        },
        tax_id: companyData.tax_id,
      }
      console.log(await MsiApi.subscribe_plan(sendData))
      if (Effective.value === '1') {
        sendData = {}
        console.log(await MsiApi.auth_payment(sendData))

        // reset program data
        let queryData = {}
        if (companyData.name !== 'MSI') {
          queryData = {
            database: 'CPO',
            collection: 'LimitPlan',
            pipelines: [{ $match: { name: { $ne: 'MSI-Free' } } }],
          }
        } else {
          queryData = {
            database: 'CPO',
            collection: 'LimitPlan',
            pipelines: [
              { $project: { aaa: 0 } },
            ],
          }
        }
        let response = await MsiApi.mongoAggregate(queryData)
        if (response.status === 200) {
          program_plan.length = 0
          Object.assign(program_plan, response.data.result)
          for (let i = 0; i < program_plan.length; i++) {
            if (program_plan[i]._id === select_plan[0]._id) {
              ProgramData.length = 0
              Object.assign(ProgramData, [program_plan[i]])
              break
            }
          }
        }
      }
      CheckProgramVisible.value = false
    }
    else {
      return false
    }
  })
}
const cancelCheckProgram = () => {
  CheckProgramVisible.value = false
  Effective.value = '1'
  companyData.email = MStore.user_data.email
  companyData.name = MStore.permission.company.name
  companyData.address = MStore.permission.company.address
  companyData.city = MStore.permission.company.city
  companyData.phone = MStore.permission.company.phone
  companyData.tax_id = MStore.permission.company.tax_id
  companyData.address_str = ''
  if (MStore.permission.company.city !== undefined) {
    companyData.address_str += MStore.permission.company.city
  }
  if (MStore.permission.company.address !== undefined) {
    companyData.address_str += MStore.permission.company.address
  }
}
const confirmProgram = () => {
  if (currentRow.value === undefined) {
    ElMessage.error(t('please_select_program'))
  } else {
    if (CardData.length === 0) {
      ElMessage.error(t('please_binding_credit_card'))
    } else {
      ProgramVisible.value = false
      CheckProgramVisible.value = true
      Object.assign(select_plan, [currentRow.value])
      if (ProgramData[0].price > select_plan[0].price) {
        EffectiveRestriction.value = true
        Effective.value = '2'
      }
      else {
        EffectiveRestriction.value = false
        Effective.value = '1'
      }
    }
  }
}
const handleCurrentChange = (val) => {
  if (val === null || val.disable === true)
    return
  currentRow.value = val
  selectProgram.value = val._id
}
const card_delete = async () => {
  const json = JSON.stringify({
    c6n: CardData[0].card6No,
    c4n: CardData[0].card4No,
    bindD: CardData[0].bindingDate,
  })
  let response = await MsiApi.unregister_bind_card(json)
  if (response.status === 200) CardData.length = 0
  else ElMessage.error(response.data.message)
}
const add_program = () => {
  ProgramVisible.value = true
}
const add_card = async () => {
  let response = await MsiApi.bind_card()
  if (response.status === 200) {
    document.body.innerHTML += response.data
    document.getElementById('formMSI').submit()
  } else {
    ElMessage.error(response.data.message)
  }
}
const display_eula = () => {
  first_login.value=true
  language = localStorage.getItem("lang")
}
onMounted(async () => {
  if (MStore.permission)
  first_name.value = MStore.user_data.first_name
  last_name.value = MStore.user_data.last_name
  email.value = MStore.user_data.email
  companyData.email = MStore.user_data.email
  companyData.name = MStore.permission.company.name
  companyData.address = MStore.permission.company.address
  companyData.city = MStore.permission.company.city
  companyData.phone = MStore.permission.company.phone
  companyData.tax_id = MStore.permission.company.tax_id
  companyData.address_str = ''
  if (MStore.permission.company.city !== undefined) {
    companyData.address_str += MStore.permission.company.city
  }
  if (MStore.permission.company.address !== undefined) {
    companyData.address_str += MStore.permission.company.address
  }

  queryData = {
    database: 'CPO',
    collection: 'CompanyInformation',
    pipelines: [
      { $match: { name: { $eq: companyData.name } } },
      { $project: { _id: 1, upgrade_manager: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    companyId = response.data.result[0]._id
    upgrade_manager = response.data.result[0]?.upgrade_manager
    let localEndTime = new Date( (new Date(upgrade_manager.subscribe.due_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))

    due_date_time_str.value = getNextProgramDate(moment(localEndTime).format("YYYY-MM-DD"))
  } else {
    ElMessage.error(response.data.message)
  }

  response = await MsiApi.search_bind_card()
  if (response.status === 200) {
    if (response.data.cards.length > 0) {
      Object.assign(CardData, [response.data.cards[0].detail])
      CardData[0].card_num_str = CardData[0].card6No + '******' + CardData[0].card4No
      CardData[0].expireDate = 
        (response.data.cards[0].detail.expireDate % 100).toString().padStart(2, '0') + 
        (Math.floor(response.data.cards[0].detail.expireDate / 100)).toString().padStart(2, '0')
    }
  } else {
    ElMessage.error(response.data.message)
  }
  if (companyData.name !== 'MSI') {
    queryData = {
      database: 'CPO',
      collection: 'LimitPlan',
      pipelines: [{ $match: { name: { $ne: 'MSI-Free' } } }],
    }
  } else {
    queryData = {
      database: 'CPO',
      collection: 'LimitPlan',
      pipelines: [
        { $project: { aaa: 0 } },
        // { $match: { "name": {"$eq": "MSI-Free"}} }
      ],
    }
  }
  response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    Object.assign(program_plan, response.data.result)
    for (let i = 0; i < program_plan.length; i++) {
      if (program_plan[i]._id === upgrade_manager?.subscribe?.due_plan) {
        Object.assign(ProgramData, [program_plan[i]])
        break
      }
    }
    if (upgrade_manager?.subscribe?.due_plan !== upgrade_manager?.subscribe?.plan) {
      for (let i = 0; i < program_plan.length; i++) {
        if (program_plan[i]._id === upgrade_manager?.subscribe?.plan) {
          Object.assign(NextProgramData, [program_plan[i]])
          break
        }
      }
    }
  } else {
    ElMessage.error(response.data.message)
  }

  checkAvailableProgram()
})
</script>

<template>
<div class="adminInfo">
    <div class="container lg">
      <div class="flex-col justify-start flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-36px" v-if="first_name === undefined && last_name === undefined">{{ t('admin_info') }}</p>
        <p class="text-36px" v-else>{{ first_name }} {{ last_name }}</p>
        
        <div class="overflow-x-auto">
          <div class="mt-20px flex w-100px h-40px pb-20px">
            <div v-if="email !== undefined" class="flex mr-100px">
              <img class="w-20px h-20px" src="@/assets/img/setting_mail.png" alt="">
              <p class="ml-8px">{{ email }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container lg bg-blue-100">
      <div class="main-container pt-24px pb-40px">
        <div class="flex credit-card">
          <font-awesome-icon icon="fa-regular fa-credit-card" class="w-20px h-20px" />
          <div class="ml-8px w-full pr-20px">
            <p class="text-22px text-blue-1100 mb-20px">{{ t('credit_card') }}</p>
            <div class="overflow-x-auto" v-if="CardData.length !== 0">
              <el-table
                :data="CardData"
                class="white-space-nowrap text-primary"
                style="width: 100%"
                stripe
                :cell-style="msi.tb_cell"
                :header-cell-style="msi.tb_header_cell"
                size="large"
                v-loading.fullscreen.lock="isLoading"
              >
                <el-table-column prop="card_num_str" :label="t('card_no')" min-width="150" />
                <el-table-column
                  prop="expireDate"
                  :label="t('expire_date_mm_yy')"
                  min-width="200"
                />
                <el-table-column prop="bindingDate" :label="t('binding_date')" min-width="150" />
                <el-table-column min-width="150">
                  <el-button @click="card_delete"> {{ t('delete_card') }}</el-button>
                </el-table-column>
              </el-table>
            </div>
            <el-button class="w-400px" v-else-if="companyData.name === 'MSI'" @click="add_card" disabled> 
              {{ t('msi_not_support_binding_card') }} </el-button>
            <el-button class="w-200px" v-else-if="CardData.length !== 0 || (first_name === undefined && last_name === undefined)" @click="add_card" disabled>
              {{ t('add_card') }} </el-button>
            <el-button class="w-200px" v-else @click="add_card">
              {{ t('add_card') }} </el-button>
          </div>
        </div>

        <div class="flex mt-32px program">
          <font-awesome-icon icon="fa-solid fa-bell" class="w-20px h-20px" />
          <div class="ml-8px w-full  pr-20px">
            <p class="text-22px text-blue-1100 mb-20px">{{ t('program') }}</p>
            <div class="overflow-x-auto">
              <el-table
                :data="ProgramData"
                class="white-space-nowrap text-primary"
                style="width: 100%"
                stripe
                :cell-style="msi.tb_cell"
                :header-cell-style="msi.tb_header_cell"
                size="large"
                v-loading.fullscreen.lock="isLoading"
              >
                <el-table-column
                  prop="name"
                  :label="t('name')"
                  align="center"
                  min-width="200"
                />
                <el-table-column
                  prop="location"
                  :label="t('station')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="evse"
                  :label="t('evse_quantity')"
                  align="center"
                  min-width="200"
                />
                <!-- <el-table-column
                  prop="connector"
                  :label="t('connector')"
                  align="center"
                  min-width="150"
                /> -->
                <el-table-column
                  prop="tariff"
                  :label="t('rate_plan')"
                  align="center"
                  min-width="150"
                />
                <el-table-column prop="user" :label="t('user')" align="center" min-width="150" />
                <el-table-column
                  prop="admin_user"
                  :label="t('admin_user')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="currency"
                  :label="t('currency')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="price"
                  :label="t('price')"
                  align="center"
                  min-width="150"
                />
                <!-- <el-table-column
                  :label="t('due_date_time')"
                  align="center"
                  min-width="200"
                >
                  {{ due_date_time_str }}
                </el-table-column> -->
                <el-table-column>
                  <el-button @click="add_program" disabled v-if="(first_name === undefined && last_name === undefined)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
                  <el-button v-else class="btn-more" @click="add_program">
                    <font-awesome-icon icon="fa-solid fa-ellipsis"
                  /></el-button>
                </el-table-column>
              </el-table>
            </div>

            <p class="text-22px text-blue-1100 mt-32px mb-20px" v-if="NextProgramData.length !== 0">{{ t('next_program') }}</p>
            <div class="overflow-x-auto" v-if="NextProgramData.length !== 0">
              <el-table
                :data="NextProgramData"
                class="white-space-nowrap text-primary"
                style="width: 100%"
                stripe
                :cell-style="msi.tb_cell"
                :header-cell-style="msi.tb_header_cell"
                size="large"
                v-loading.fullscreen.lock="isLoading"
              >
                <el-table-column
                  prop="name"
                  :label="t('name')"
                  align="center"
                  min-width="200"
                />
                <el-table-column
                  prop="location"
                  :label="t('station')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="evse"
                  :label="t('evse_quantity')"
                  align="center"
                  min-width="200"
                />
                <el-table-column
                  prop="tariff"
                  :label="t('rate_plan')"
                  align="center"
                  min-width="150"
                />
                <el-table-column prop="user" :label="t('user')" align="center" min-width="150" />
                <el-table-column
                  prop="admin_user"
                  :label="t('admin_user')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="currency"
                  :label="t('currency')"
                  align="center"
                  min-width="150"
                />
                <el-table-column
                  prop="price"
                  :label="t('price')"
                  align="center"
                  min-width="150"
                />
              </el-table>
            </div>
          </div>
        </div>

        <div class="flex mt-32px policy">
          <font-awesome-icon icon="fa-regular fa-file" class="w-20px h-20px" />
          <div class="ml-8px">

            <p class="text-22px text-blue-1100 mb-20px">Policy</p>
            <p class="text-blue-1100 decoration-underline cursor-pointer" @click="display_eula">User Agreement</p>
          </div>
        </div>
      </div>
    </div>

    <el-dialog 
      append-to-body 
      v-model="ProgramVisible" 
      class="max-w-1100px" 
      width="90%"
      @close="cancelProgram"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ t('select_program') }}
            <el-tooltip
              class=""
              effect="dark"
              placement="top-start"
            >
              <el-icon class="w-20px" @click="ProgramRuleVisible = true"><QuestionFilled /></el-icon>
              <template #content>
                <table>
                  <tr class="text-16px v-top">
                    <td>1.</td>
                    <td>{{ t('unable_to_select_a_plan_beyond_the_current_configuration') }}</td>
                  </tr>
                  <tr class="text-16px v-top">
                    <td>2.</td>
                    <td>{{ t('when_selecting_a_plan_with_a_lower_price_than_the_current_one_you_can_only_choose_effective_date_will_start_in_a_month') }}</td>
                  </tr>
                </table>
              </template>
            </el-tooltip>
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="pr-10px">
          <el-table
            :data="program_plan"
            @current-change="handleCurrentChange"
            highlight-current-row
            :row-class-name="tableRowClassName"
          >
            <el-table-column min-width="40"  >
              <template #default="scope">
                <el-radio-group v-model="selectProgram">
                  <el-radio :label="scope.row._id" size="large" v-if="scope.row.disable === true" disabled> {{""}}</el-radio>
                  <el-radio :label="scope.row._id" size="large" v-else> {{""}}</el-radio>
                </el-radio-group>
              </template>
            </el-table-column>
            

            <el-table-column 
              prop="name" 
              :label="t('name')" 
              min-width="150" 
            />
            <el-table-column
              prop="location"
              :label="t('station')"
              align="center"
              min-width="100"
            />
            <el-table-column
              prop="evse"
              :label="t('evse_quantity')"
              align="center"
              min-width="150"
            />
            <!-- <el-table-column
              prop="connector"
              :label="t('connector')"
              align="center"
              min-width="150"
            /> -->
            <el-table-column
              prop="tariff"
              :label="t('rate_plan')"
              align="center"
              min-width="150"
            />
            <el-table-column 
              prop="user" 
              :label="t('user')" 
              align="center" 
              min-width="80" 
            />
            <el-table-column
              prop="admin_user"
              :label="t('admin_user')"
              align="center"
              min-width="150"
            />
            <el-table-column
              prop="currency"
              :label="t('currency')"
              align="center"
              min-width="100"
            />
            <el-table-column 
              prop="price" 
              :label="t('price')" 
              align="center" 
              min-width="100" 
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelProgram"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="confirmProgram"
            >{{ t('confirm') }}</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      append-to-body
      v-model="CheckProgramVisible"
      class="max-w-1000px"
      width="90%"
      @close="cancelCheckProgram"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ t('check_program') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="pr-10px">
          <div class="mb-2 flex items-center text-sm">
            <el-radio-group v-model="Effective">
              <el-radio v-if="EffectiveRestriction === true" disabled label="1" size="large">{{ t('effective_immediately') }}</el-radio>
              <el-radio v-else label="1" size="large">{{ t('effective_immediately') }}</el-radio>
              <el-radio label="2" size="large">{{ t('effective_date_will_start_in_a_month') }}</el-radio>
            </el-radio-group>
          </div>
          <el-form label-position="left" label-width="100px" :rules="adminInfo_rules" :model="companyData" ref="adminInfo_ref" :scroll-to-error=true>
            <el-table
              :data="select_plan"
              @current-change="handleCurrentChange"
              highlight-current-row
            >
              <el-table-column prop="name" :label="t('program_name')" min-width="150" />
              <el-table-column prop="location" :label="t('station')" min-width="150" />
              <el-table-column prop="evse" :label="t('evse_quantity')" min-width="150" />
              <!-- <el-table-column prop="connector" :label="t('connector')" min-width="150" /> -->
              <el-table-column prop="tariff" :label="t('rate_plan')" min-width="150" />
              <el-table-column prop="user" :label="t('user')" min-width="150" />
              <el-table-column prop="admin_user" :label="t('admin_user')" min-width="150" />
              <el-table-column prop="currency" :label="t('currency')" min-width="150" />
              <el-table-column prop="price" :label="t('price')" min-width="150" />
            </el-table>
            <br />
            <el-form-item :label="t('title')" prop="name">
              <el-input v-model="companyData.name" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('address')" prop="address_str">
              <el-input v-model="companyData.address_str" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('phone')" prop="phone">
              <el-input v-model="companyData.phone" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('tax_id')" prop="tax_id">
              <el-input v-model="companyData.tax_id" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('e_mail')" prop="email">
              <el-input v-model="companyData.email" style="width: 300px"/>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelCheckProgram"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            v-if="companyData.name === 'MSI'"
            disabled
            @click="subscribeProgram"
            >{{ t('confirm') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            v-else
            @click="subscribeProgram"
            >{{ t('confirm') }}</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="first_login"
      class="max-w-992px h-90% flex-col"
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
            {{t('user_agreement')}}
          </h4>
        </div>
      </template>
      <div class="h-full scrollbar">
        <div class="h-full" v-if="language === 'zh_tw'">
          <iframe
            class="w-full h-full"
            src="https://storage.googleapis.com/msi-common/file/EULA/MSI_m-Cloud_EULA_zh.htm"
            frameborder="0"
          ></iframe>
        </div>
        <div class="h-full" v-else>
          <iframe
            class="w-full h-full"
            src="https://storage.googleapis.com/msi-common/file/EULA/MSI_m-Cloud_EULA_en.htm"
            frameborder="0"
          ></iframe>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<style lang="scss" scoped>
.main-container {
  height: calc(100vh - 24rem);
}
:deep(.disable-row) {
  --el-table-tr-bg-color: var(--gray-100);
  --el-table-row-hover-bg-color: var(--gray-100);
  --el-table-current-row-bg-color: var(--gray-100);
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
.eula {
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    @media (min-width: 768px) {
      margin-left: 10rem !important;
    }
  }
}
</style>
