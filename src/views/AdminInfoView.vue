<script setup>
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from "vue-i18n"
import { useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import moment from "moment"
import * as echarts from 'echarts'

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const router = useRouter()
const isLoading = ref(false)
const eula_visible = ref(false)
const agreeFee = ref(0)
const sessionFee = ref(0)
const currency = ref('')

let companyId = null
let current_date = null
let language = localStorage.getItem("lang")
const adminUserData = reactive({})
const companyData = reactive({})
const ProgramData = reactive([])
const credirCardData = reactive({})
const UserData = reactive([])
const UserPermission = reactive([])
const program_chartData = reactive([
  {name: 'Station', name_str: t('station'), count: ' -', max_count: '-'},
  {name: 'EVSE', name_str: t('evse'), count: ' -', max_count: '-'},
  {name: 'Rate Plan', name_str: t('rate_plan'), count: ' -', max_count: '-'},
  {name: 'Admin', name_str: t('admin_user'), count: ' -', max_count: '-'},
  {name: 'User', name_str: t('user'), count: ' -', max_count: '-'},
])
const program_card_item = reactive([
  t('station'),
  t('evse'),
  t('rate_plan'),
  t('admin_user'),
  t('user'),
  t('currency'),
])
const original_program = reactive([])
const selected_program = reactive([])

const chargeProgramVisible = ref(false)
const adminDialogVisible = ref(false)
const newebDialogVisible = ref(false)

const program_title = ref(t('change_program'))
const program_steps = ref(1)
const program_next_btn = ref(t('change'))
const selectProgram = ref('1')
const Effective = ref('1')
const EffectiveRestriction = ref(false)

const program_paymentData = reactive([])
const program_ref = ref()
const program_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  address: [
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

const admin_title = ref(t('add_admin'))
const AdminData = reactive([])
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

const neweb_title = ref(t('create_neweb_pay_account'))
const neweb_id = ref()
const neweb_create_failed = ref(false)

const validNewebId = (value) => {
  const newebId = value.replace(/[^\d]/g, "");
  if (newebId.length > 12) {
    return newebId.slice(0, 12)
  }
  else {
    return newebId
  }
}

const fill_program_chartData = () => {
  program_chartData.forEach((item) => {
    switch (item.name) {
      case 'Station': 
        item.count = companyData.station_cnt
        item.max_count = MStore.program.location
        break
      case 'EVSE': 
        item.count = companyData.evse_cnt
        item.max_count = MStore.program.evse
        break
      case 'Rate Plan': 
        item.count = companyData.ratePlan_cnt
        item.max_count = MStore.program.tariff
        break
      case 'Admin': 
        item.count = companyData.admin_user_cnt
        item.max_count = MStore.program.admin_user
        break
      case 'User': 
        item.count = companyData.user_cnt
        item.max_count = MStore.program.user
        break
      default:
        break
    }
  })
}
const drawProgram = async() => {
  let program_chart_List = document.getElementsByClassName('program-chart')
  fill_program_chartData()
  for (let i=0; i<program_chart_List.length; i++) {
    let program_chart = echarts.init(program_chart_List[i])
    let program_option = {
      xAxis: { type: 'value', splitNumber: 1, show: false },
      yAxis: { type: 'category', inverse: true, show: false },
      grid: { left: '2%', right: '3%', top: '3%', bottom: '5%', containLabel: true },
      series: [
        {
          type: 'bar', 
          barWidth: '30%', 
          color: "#76bbf4",
          showBackground: true,
        },
      ]
    }
    if (i <= 2) {
      program_option.series[0].color = '#76bbf4'
    }
    else {
      program_option.series[0].color = '#64bfae'
    }
    program_option.xAxis.max = program_chartData[i].max_count
    program_option.series[0].data = [ {value: program_chartData[i].count, name: program_chartData[i].name} ]
    program_option && program_chart.setOption(program_option)
    window.addEventListener('resize', () => {
      program_chart.resize();
    })
  }
}
const getNextProgramDate = (date) => {
  let arr = date.split('-')
  let year = arr[0]
  let month = arr[1]
  let day = arr[2]
  let newYear = year
  let newMonth = parseInt(month)
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
  let newProgramDate_str = String(new Date(newYear + '-' + newMonth + '-' + newDay))
  return newProgramDate_str.split(' ')[1] + ' ' + newProgramDate_str.split(' ')[2] + ', ' + newProgramDate_str.split(' ')[3]
}

const openChangeProgramDialog = () => {
  if (Object.keys(credirCardData).length === 0) {
    ElNotification({
      title: t('error'),
      message: t('please_binding_credit_card'),
      type: 'error',
      'custom-class': 'w-auto',
    });
    return
  }
  selectProgram.value = companyData.program_id
  Effective.value = '1'
  program_steps.value = 1
  program_title.value = t('change_program')
  program_next_btn.value = t('change')
  chargeProgramVisible.value = true
  EffectiveRestriction.value = false
}
const handleSelectProgram = (item) => {
  selected_program.length = 0
  Object.assign(selected_program, item)
  if (original_program.price > selected_program.price) {
    EffectiveRestriction.value = true
    Effective.value = '2'
  }
  else {
    EffectiveRestriction.value = false
    Effective.value = '1'
  }
}
const changeProgram = (action) => {
  try {
    if (action === 'change' && program_steps.value === 1) {
      if (companyData.station_cnt > selected_program.location ||
        companyData.evse_cnt > selected_program.evse ||
        companyData.ratePlan_cnt > selected_program.tariff ||
        companyData.admin_user_cnt > selected_program.admin_user ||
        companyData.user_cnt > selected_program.user
      ) {
        ElNotification({
          title: t('error'),
          message: t('please_select_another_option_to_fit_your_current_needs'),
          type: 'error',
          'custom-class': 'w-auto',
        });
        return
      }
      
      program_steps.value = 2
      program_title.value = t('confirm_program')
      program_next_btn.value = t('confirm')
      program_paymentData.length = 0
      Object.assign(program_paymentData, companyData)
    }
    else if (action === 'change' && program_steps.value === 2) {
      program_ref.value.validate(async valid => {
        if (valid) {
          let sendData = {
            class: 'CompanyInformation',
            pk: companyId,
            plan: selected_program._id,
            invoice_detail: {
              title: program_paymentData.name,
              address: program_paymentData.address,
              phone: program_paymentData.phone,
              email: program_paymentData.email,
            },
            tax_id: program_paymentData.tax_id,
          }
          isLoading.value = true
          await MsiApi.subscribe_plan(sendData)
          if (Effective.value === '1') {
            sendData = {}
            await MsiApi.auth_payment(sendData)
  
            // reset program data
            await getCompanyData()
            await getProgramData()
            await drawProgram()
          }
          ElMessage({ type: 'success', message: t('subscribe_success') })
          chargeProgramVisible.value = false
          isLoading.value = false
        }
        else {
          return false
        }
      })
    }
    else if (action === 'cancel') {
      chargeProgramVisible.value = false
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const openAdminUserDialog = (action, item) => {
  if (UserData.length >= MStore.program.admin_user && MStore.permission.isMSI === false && action === 'add') {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
  adminDialogVisible.value = true
  if (action === 'add') {
    admin_title.value = t('add_admin')
    AdminData.first_name = ''
    AdminData.last_name = ''
    AdminData.email = ''
    AdminData.phone = ''
    AdminData.permission_id = ''
    AdminData.permission_str = ''
    AdminData.permission_edit = true
    AdminData.permission_active = true
  }
  else {
    admin_title.value = t('edit_admin')
    AdminData.length = 0
    AdminData._id = item._id
    AdminData.first_name = item.first_name
    AdminData.last_name = item.last_name
    AdminData.email = item.email
    AdminData.phone = item.phone
    AdminData.permission_id = item.permission.user
    AdminData.permission_str = item.permission_str
    AdminData.permission_edit = item.permission.edit === 1? true : false
    AdminData.permission_active = item.permission.active
  }
}
const setPermission = (permission_id) => {
    AdminData.permission_id = permission_id
}
const confirmAdminUser = (action, del_id) => {
  try {
    if (action === 'add') {
      AdminData_ref.value.validate(valid => {
        if (valid) {
          adminDialogVisible.value = false
          ElMessageBox.confirm(t('do_you_want_to_create'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
            .then(async () => {
              isLoading.value = true
              let permission_edit = AdminData.permission_edit ? 1 : 3
              let res = null
              let sendData = {
                role: 'admin',
                first_name: AdminData.first_name, last_name: AdminData.last_name,
                email: AdminData.email, phone: AdminData.phone, password: "msi32345599",
                permission: AdminData.permission_id, edit: permission_edit, active: AdminData.permission_active ,
              }
              res = await MsiApi.register_member(sendData)
              if (res.data.message === 'Accepted') {
                await getAdminData()
                drawProgram()
              }
              else if(res.data.message === 'User is exist') {
                ElMessage.error(t('email_already_exists'))
                adminDialogVisible.value = true
              }
              else if (res.data.message === 'Mail not found') {
                ElMessage.error(t('email_not_found'))
                adminDialogVisible.value = true
              }
              else {
                ElMessage.error(t('error'))
                adminDialogVisible.value = true
              }
              isLoading.value = false
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
    else if (action === 'edit') {
      AdminData_ref.value.validate(valid => {
        if (valid) {
          adminDialogVisible.value = false
          ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
            .then(async () => {
              isLoading.value = true
              let permission_edit = AdminData.permission_edit ? 1 : 3
              let sendData = {
                class: 'AdminUserData', pk: AdminData._id,
                first_name: AdminData.first_name, last_name: AdminData.last_name,
                email: AdminData.email, phone: AdminData.phone,
                permission: { user: AdminData.permission_id, edit: permission_edit, active: AdminData.permission_active },
              }
              let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
              if (res.status === 200) {
                await getAdminData()
                if (AdminData.email === MStore.user_data?.email) {
                  MStore.permission.active = sendData.permission.active
                  MStore.permission.edit = sendData.permission.edit
                  MStore.permission.user = sendData.permission.user
                }
              }
              isLoading.value = false
            })
            .catch((e) => {
              console.log(e)
            })
        }
        else {
          return false
        }
      })
    }
    else if (action === 'delete') {
      if (UserData.length === 1) {
        ElNotification({
          title: t('error'),
          message: t('at_least_one_admin_user_is_required'),
          type: 'error',
        });
        return
      }
  
      ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          isLoading.value = true
          let res = await MsiApi.delete_account({ role:'admin', id: del_id })
          if (res.data.message === 'Accepted') {
            await getAdminData()
            drawProgram()
          }
          isLoading.value = false
        })
        .catch((e) => {
          console.log(e)
        })
    }
    else if (action === 'cancel') {
      adminDialogVisible.value = false
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const editCard = async(action) => {
  try {
    if (action === 'add') {
      // if (MStore.permission.isMSI === true) {
      //   ElNotification({
      //     title: t('error'),
      //     message: t('msi_not_support_binding_card'),
      //     type: 'error',
      //     'custom-class': 'w-auto',
      //   });
      //   return
      // }
      isLoading.value = true
      let response = await MsiApi.bind_card()
      if (response.status === 200) {
        document.body.innerHTML += response.data
        document.getElementById('formMSI').submit()
      } else {
        ElMessage.error(response.data.message)
      }
    }
    else if (action === 'delete') {
      ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
        .then(async () => {
          const json = JSON.stringify({
            c6n: credirCardData.card6No,
            c4n: credirCardData.card4No,
            bindD: credirCardData.bindingDate,
          })
          let response = await MsiApi.unregister_bind_card(json)
          if (response.status === 200) {
            await getCardData()
          }
          else ElMessage.error(response.data.message)
        })
        .catch((e) => {
          console.log(e)
        })
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const openNewebDialog = () => {
  newebDialogVisible.value = true
  neweb_id.value = ''
}
const closeNewebDialog = () => {
  neweb_create_failed.value = false
  newebDialogVisible.value = false
}
const confirmNewebPay = async(action) => {
  if (action === 'create') {
    newebDialogVisible.value = false
    ElMessageBox.confirm(t('do_you_want_to_create'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
      .then(async () => {
        const res = await MsiApi.add_merchant(neweb_id.value)
        if (res.status === 200) {
          isLoading.value = true
          document.body.innerHTML += res.data
          document.getElementById('formMSI').submit()
        }
        else {
          neweb_create_failed.value = true
          newebDialogVisible.value = true
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
  else if (action === 'cancel') {
    newebDialogVisible.value = false
  }
  else if (action === 'back') {
    neweb_create_failed.value = false
    neweb_id.value = ''
  }
}
const display_eula = () => {
  eula_visible.value = true
  language = localStorage.getItem("lang")
}

const getCompanyData = async() => {
  let queryData = null
  let response = null
  try {
    queryData = {
      database: 'CPO',
      collection: 'CompanyInformation',
      pipelines: [
        { $match: { name: { $eq: companyData.name } } },
        { $project: { _id: 1, payment: 1, upgrade_manager: 1 } }
      ],
    }
    response = await MsiApi.mongoAggregate(queryData)
    if (response.data.result[0]?.upgrade_manager?.session_fee?.[0]?.type === 'AgreeFee') 
      agreeFee.value = response.data.result[0]?.upgrade_manager?.session_fee?.[0]?.price
    else {
      sessionFee.value = response.data.result[0]?.upgrade_manager?.session_fee?.[0]?.price
      currency.value = response.data.result[0]?.upgrade_manager?.session_fee?.[0]?.currency
    }
    if (response.data.result[0]?.upgrade_manager?.session_fee?.[1]?.type === 'AgreeFee')
      agreeFee.value = response.data.result[0]?.upgrade_manager?.session_fee?.[1]?.price
    else {
      sessionFee.value = response.data.result[0]?.upgrade_manager?.session_fee?.[1]?.price
      currency.value = response.data.result[0]?.upgrade_manager?.session_fee?.[1]?.currency
    }
    console.log(response.data.result[0]?.upgrade_manager)
    companyId = response.data.result[0]._id
    companyData.upgrade_manager = response.data.result[0].upgrade_manager
    companyData.Merchant_ID = response.data.result[0].payment?.merchantId
    if (response.data.result[0].payment?.hashKey) {
      companyData.Merchant_Status = t('in_operation')
    }
    else if (response.data.result[0].payment?.merchantId) {
      companyData.Merchant_Status = t('reviewing')
    }
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }
}
const getUsedCount = async() => {
  let queryData = null
  let response = null

  // station_cnt
  try {
    queryData = {
      database: 'OCPI',
      collection: 'Location',
      pipelines: [{ $count: 'Count' }]
    }
    response = await MsiApi.mongoAggregate(queryData)
    companyData.station_cnt = response?.data?.result?.[0]?.Count
    if (!companyData.station_cnt) companyData.station_cnt = 0
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }

  // evse_cnt
  try {
    queryData = {
      database: 'OCPI',
      collection: 'EVSE',
      pipelines: [{ $project: { _id: 1 } }]
    }
    response = await MsiApi.mongoAggregate(queryData)
    companyData.evse_cnt = response.data.result.length
    if (!companyData.evse_cnt) companyData.evse_cnt = 0
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }

  // ratePlan_cnt
  try {
    queryData  = { 
      database: "OCPI", 
      collection: "Tariff", 
      pipelines: [ { $project: { last_updated:0} }]
    }
    response = await MsiApi.mongoAggregate(queryData)
    companyData.ratePlan_cnt = response?.data?.result?.length
    if (!companyData.ratePlan_cnt) companyData.ratePlan_cnt = 0
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }

  // user_cnt
  try {
    if (companyData.name === 'MSI') {
      queryData = {
        database: 'CPO',
        collection: 'UserData',
        pipelines: [
        { $match: { $and: [{first_name: {$ne: 'DELETE'}}, {last_name: {$ne: 'DELETE'}},] } },
        { $count: 'Count' }],
      }
    }
    else {
      queryData = {
        database: 'CPO',
        collection: 'RFIDUserData',
        pipelines: [
          { $match: { $and: [{tag_id: {$ne: 'DELETE'}}, {name: {$ne: 'DELETE'}}, {byCompany: {ObjectId:companyId}}] } },
          { $count: 'Count' }
        ],
      }
    }
    response = await MsiApi.mongoAggregate(queryData)
    companyData.user_cnt = response?.data?.result?.[0]?.Count
    if (!companyData.user_cnt) companyData.user_cnt = 0
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }

  // admin_user_cnt
  try {
    queryData = {
      database: 'CPO',
      collection: 'AdminUserData',
      pipelines: [
        { $match: { $and: [{first_name: {$ne: 'DELETE'}}, {last_name: {$ne: 'DELETE'}}, {byCompany: {ObjectId:companyId} },] } },
        { $count: 'adminCount' }
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    companyData.admin_user_cnt = response.data.result[0]?.adminCount
    if (!companyData.admin_user_cnt) companyData.admin_user_cnt = 0
  }
  catch {
    ElMessage.error({message: 'An unexpected error occurred.', grouping:true})
  }
}
const getPermission = async() => {
  try {
    let queryData = null
    if (import.meta.env.VITE_NAME === 'dev') {
      queryData = {
        database: 'CPO',
        collection: 'UserPermission',
        pipelines: [
          { $match: { name: { $nin: ['AnonymousUser', 'MemberUser', 'DeveloperUser', 'CustomerServiceUser'] } } },
          {  $project: { _id: 1, name: 1 } }
        ]
      }
    }
    else {
      if (companyData.name === 'MSI') {
        queryData = {
          database: 'CPO', 
          collection: 'UserPermission', 
          pipelines: [
            { $match: { name: { $nin: ['AnonymousUser', 'MemberUser', ] } } },
            {  $project: { _id: 1, name: 1 } }
          ]
        }
      }
      else {
        queryData = {
          database: 'CPO', 
          collection: 'UserPermission', 
          pipelines: [
            { $match: { name: { $nin: ['AnonymousUser', 'MemberUser',  'CustomerServiceUser', 'ViewerUser', 'FAEUser'] } } },
            {  $project: { _id: 1, name: 1 } }
          ]
        }
      }
    }
    let response = await MsiApi.mongoAggregate(queryData)
    UserPermission.length = 0
    Object.assign(UserPermission, response.data.result)
    UserPermission.forEach((item) => {
      switch (item.name) {
        case 'EngineerUser':
          item.name_str = t('engineer_user')
          break
        case 'AdminUser':
          item.name_str = t('admin_user')
          break
        case 'DeveloperUser':
          if (MStore.permission.isMSI === true)
            item.name_str = t('developer_user')
          else 
            item.name_str = t('user')
          break
        case 'ViewerUser':
          item.name_str = t('viewer_user')
          break
        case 'FAEUser':
          item.name_str = t('fae_user')
          break
        case 'CustomerServiceUser':
          item.name_str = t('customer_service_user')
          break
        default:
          item.name_str = item.name
          break
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const getAdminData = async() => {
  try {
    let queryData = {
      database: 'CPO',
      collection: 'AdminUserData',
      pipelines: [
        { $match: { $and: [
          { "first_name": {$ne: 'DELETE'} },
          { "last_name": {$ne: 'DELETE'} },
          { "byCompany": {$eq: { "ObjectId" : companyId} } },
        ]}
        },
        { $project: { _id: 1, salt: 0, hashed_password_1: 0, hashed_password_2: 0, config: 0 } },
      ]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    if (response.data.result === undefined) {
      router.push({ name: 'login' })
    }
    UserData.length = 0
    Object.assign(UserData, response.data.result)
    companyData.admin_user_cnt = UserData.length
    await getPermission()
  
    UserData.forEach((item) => {
      item.enable = item.permission.active
      for (let i=0; i<UserPermission.length; i++) {
        if (item.permission.user === UserPermission[i]._id) {
          item.permission_str = UserPermission[i].name_str
          break
        }
      }
      // get adminUserData
      if (item.email === companyData.email) {
        adminUserData.first_name = item.first_name
        adminUserData.last_name = item.last_name
        adminUserData.phone = item.phone
        adminUserData.email = item.email
      }
    })
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const getCardData = async() => {
  try {
    let response = await MsiApi.search_bind_card()
    if (response.status === 200) {
      for (let key in credirCardData) {
        delete credirCardData[key]
      }
      Object.assign(credirCardData, response.data.cards[0]?.detail)
      if (response.data.cards.length !== 0) {
        credirCardData.card_num_str = credirCardData.card6No + '******' + credirCardData.card4No
        credirCardData.expireDate = 
          (response.data.cards[0].detail.expireDate % 100).toString().padStart(2, '0') + ' / 20' +
          (Math.floor(response.data.cards[0].detail.expireDate / 100)).toString().padStart(2, '0')
        
        // VISA / Mastercard / JCB / UnionPay / AmericanExpress
        if (credirCardData.card6No.substring(0, 1) === '4') {
          credirCardData.BIN = 'VISA'
        }
        else if (Number(credirCardData.card6No.substring(0, 2)) >= 51 && Number(credirCardData.card6No.substring(0, 2)) <= 59) {
          credirCardData.BIN = 'Mastercard'
        }
        else if (Number(credirCardData.card6No.substring(0, 4)) >= 3528 && Number(credirCardData.card6No.substring(0, 4)) <= 3589) {
          credirCardData.BIN = 'JCB'
        }
        else if (credirCardData.card6No.substring(0, 2) === '62') {
          credirCardData.BIN = 'UnionPay'
        }
        else if (Number(credirCardData.card6No.substring(0, 2)) >= 34 && Number(credirCardDat.card6No.substring(0, 2)) <= 37) {
          credirCardData.BIN = 'AmericanExpress'
        }
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
const getProgramData = async() => {
  try {
    let queryData = null
    if (companyData.name !== 'MSI') {
      queryData = {
        database: 'CPO',
        collection: 'LimitPlan',
        pipelines: [{ $match: { name: { $ne: 'MSI-Free' } } }],
      }
    } 
    else {
      queryData = {
        database: 'CPO',
        collection: 'LimitPlan',
        pipelines: [
          { $project: { aaa: 0 } },
        ],
      }
    }
    let response = await MsiApi.mongoAggregate(queryData)
    Object.assign(ProgramData, response.data.result)
    for (let i=0; i<ProgramData.length; i++) {
      if (ProgramData[i]._id === companyData.upgrade_manager.subscribe.due_plan) {
        ProgramData[i].currently = true
        // Update MStore.program
        MStore.program.name = ProgramData[i].name
        MStore.program.price = ProgramData[i].price
        MStore.program.location = ProgramData[i].location
        MStore.program.evse = ProgramData[i].evse
        MStore.program.tariff = ProgramData[i].tariff
        MStore.program.user = ProgramData[i].user
        MStore.program.admin_user = ProgramData[i].admin_user
        MStore.program.connector = ProgramData[i].connector
        MStore.program.currency = ProgramData[i].currency
        // Update companyData.program
        let localTime = new Date(new Date(companyData.upgrade_manager?.subscribe?.due_date_time).getTime() + MStore.timeZoneOffset * -60000)
        companyData.program_date = getNextProgramDate(moment(localTime).format("YYYY-MM-DD"))
        companyData.program_id = ProgramData[i]._id
        companyData.program_name = ProgramData[i].name
        companyData.program_price = ProgramData[i].price
        companyData.program_currency = ProgramData[i].currency
        original_program.length = 0
        Object.assign(original_program, ProgramData[i])
        break
      }
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}
onMounted(async () => {
  isLoading.value = true
  companyData.name = MStore.permission?.company?.name
  companyData.email = MStore.user_data?.email
  companyData.city = MStore.permission?.company?.city
  companyData.phone = MStore.permission?.company?.phone
  companyData.tax_id = MStore.permission?.company?.tax_id
  companyData.upgrade_manager = MStore.permission?.company?.upgrade_manager
  companyData.address = ''
  if (MStore.permission?.company?.city !== undefined) {
    companyData.address += MStore.permission?.company?.city
  }
  if (MStore.permission?.company?.address !== undefined) {
    companyData.address += MStore.permission?.company?.address
  }

  await getCompanyData()
  getProgramData()
  getAdminData()
  getCardData()
  await getUsedCount()
  drawProgram()

  let current_date_str = String(new Date())
  current_date = current_date_str.split(' ')[1] + ' ' + current_date_str.split(' ')[2] + ', ' + current_date_str.split(' ')[3]
  isLoading.value = false
})

</script>

<template>
  <div class="admin" v-loading.fullscreen.lock="isLoading">
    <div class="container lg">
      <p v-if="companyData.email" class="text-32px pt-20px">{{ adminUserData.first_name }} {{ adminUserData.last_name }}</p>
      <p v-else class="text-32px pt-20px">{{ companyData.name }}</p>
      <div class="flex flex-col md:flex-row flex-justify-between py-15px overflow-x-auto">
        <div v-if="companyData.email" class="flex">
          <div class="flex flex-items-center mr-30px" v-if="adminUserData.email">
            <img class="w-20px h-20px" src="@/assets/img/setting_mail.png" alt="">
            <span class="ml-8px white-space-nowrap">{{ adminUserData.email }}</span>
          </div>
          <div class="flex flex-items-center mr-30px" v-if="adminUserData.phone">
            <img class="w-20px h-20px" src="@/assets/img/admin_phone.png" alt="">
            <span class="ml-8px white-space-nowrap">{{ adminUserData.phone }}</span>
          </div>
        </div>
        <div v-else class="flex">
          <div class="flex flex-items-center mr-30px">
            <font-awesome-icon icon="fa-regular fa-id-card" class="w-20px h-20px text-blue-1200" />
            <span class="ml-8px white-space-nowrap">{{ companyData.tax_id }}</span>
          </div>
          <div class="flex flex-items-center mr-30px" v-if="companyData.phone">
            <img class="w-20px h-20px" src="@/assets/img/admin_phone.png" alt="">
            <span class="ml-8px white-space-nowrap">{{ companyData.phone }}</span>
          </div>
          <div class="flex flex-items-center mr-30px" v-if="companyData.address">
            <img class="w-20px h-20px" src="@/assets/img/station_listmode_location.png" alt="">
            <span class="ml-8px white-space-nowrap">{{ companyData.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container md bg-blue-100 wh-full main-container overflow-x-auto">
      <el-row class="wh-full min-w-600px">
        <el-col class="py-20px" :xs="24" :lg="16">
          <div class="program card-container card-rounded box-shadow mb-20px xl:mr-20px">
            <div class="flex flex-justify-between flex-items-center mb-20px">
              <div class="flex">
                <font-awesome-icon icon="fa-regular fa-file-lines" class="w-20px h-20px mr-5px text-blue-1200" />
                <p class="text-1.8rem text-blue-1200 font-bold">{{ t('program') }}</p>
              </div>
              <el-button round class="button" @click="openChangeProgramDialog" v-if="MStore.permission.isCompany === false" >{{ t('change') }}</el-button>
            </div>
            <div class="flex flex-items-center px-2.5rem mb-20px">
              <p class="mr-20px text-blue-1200 font-bold">{{ companyData.program_name }}</p>
              <i18n-t keypath="price_per_month" tag="p" class="text-blue-1200 bg-blue-100 rounded p-5px">
                <template #price>
                  <strong>${{ companyData.program_price }}</strong>
                </template>
              </i18n-t>
            </div>
            <i18n-t keypath="the_following_amount_are_available_for_use_until_date_currency_is_currency" tag="p" class="text-gray-400 px-2.5rem mb-24px">
              <template #date>
                <strong class="text-blue-1200 font-bold">{{ companyData.program_date }}</strong>
              </template>
              <template #currency>
                <strong class="text-blue-1200 font-bold">{{ companyData.program_currency }}</strong>
              </template>
            </i18n-t>

            <div v-for="item in program_chartData">
              <div class="flex flex-justify-between px-2.5rem">
                <p class="text-blue-1200">{{ item.name_str }}</p>
                <p v-if="item.count === item.max_count" class="text-Error font-bold">{{ item.count }}/{{ item.max_count }}</p>
                <p v-else class="text-gray-400 font-bold">{{ item.count }}/{{ item.max_count }}</p>
              </div>
              <div class="program-chart"></div>
            </div>
          </div>
        </el-col>

        <el-col class="flex-col py-20px" :xs="24" :lg="8">
          <div class="admin-user card-container card-rounded box-shadow mb-20px flex-grow">
            <div class="flex flex-justify-between flex-items-center mb-20px">
              <div class="flex">
                <font-awesome-icon icon="fa-regular fa-user" class="w-20px h-20px mr-5px text-blue-1200" />
                <p class="text-1.8rem text-blue-1200 font-bold">{{ t('admin') }}</p>
              </div>
              <el-button v-if="MStore.rule_permission.AdminInfo.addAdmin === 'O'" 
                round class="button" @click="openAdminUserDialog('add', null)">{{ t('add_admin') }}</el-button>
            </div>
            <div class="overflow-x-auto">
              <el-empty v-if="UserData.length === 0" :image-size="40" />
              <div v-else class="admin-user-list pr-12px">
                <div v-for="(item, index) in UserData">
                  <div class="flex flex-justify-between flex-items-center">
                    <p class="text-blue-1200">{{ item.permission_str }}</p>
                    <div>
                      <el-button link type="primary" @click="confirmAdminUser('delete', item._id)">
                        <img src="@/assets/img/tariff_delete1.png" class="mr-8px" alt="">
                      </el-button>
                      <el-button link type="primary" @click="openAdminUserDialog('edit', item)">
                        <font-awesome-icon class="text-blue-1000 w-26px h-26px" icon="fa-regular fa-pen-to-square" />
                      </el-button>
                    </div>
                  </div>
                  <p class="text-blue-1200 text-20px font-bold py-6px">{{ item.first_name }} {{ item.last_name }}</p>
                  <div class="flex py-4px">
                    <img src="@/assets/img/admin_user_mail.png" class="mr-18px" alt="">
                    <p class="text-blue-1200">{{ item.email }}</p>
                  </div>
                  <div class="flex flex-justify-between py-4px">
                    <div class="flex">
                      <img src="@/assets/img/admin_user_phone.png" class="mr-18px" alt="">
                      <p v-if="item.phone" class="text-blue-1200">{{ item.phone }}</p>
                      <p v-else class="text-blue-1200"> - </p>
                    </div>
                    <p v-if="item.enable === true" class="text-Available font-bold">{{ t('enable') }}</p>
                    <p v-else-if="item.enable === false" class="text-Error font-bold">{{ t('disable') }}</p>
                  </div>
                  <el-divider v-if="index !== UserData.length-1" class="my-8px" />
                </div>
              </div>
            </div>
          </div>

          <div class="payment-method card-container card-rounded box-shadow">
            <div class="flex flex-justify-between flex-items-center mb-20px">
              <div class="flex flex-items-center">
                <img class="mr-5px" src="@/assets/img/admin_credit_card.png" alt="">
                <p class="text-1.8rem text-blue-1200 font-bold">{{ t('payment_method') }}</p>
              </div>
              <el-button v-if="credirCardData.card_num_str === undefined && MStore.permission.isCompany === false && MStore.permission.isMSI === false" round class="button" @click.stop="editCard('add')">{{ t('add_card') }}</el-button>
              <el-button v-else-if="MStore.permission.isCompany === false && MStore.permission.isMSI === false" round class="button" @click.stop="editCard('delete')">{{ t('delete_card') }}</el-button>
            </div>
            <el-empty v-if="credirCardData.card_num_str === undefined" :image-size="40" class="h-0" />
            <table v-else class="credit-card">
              <tr>
                <td class="w-150px h-35px text-gray-400">{{t('card')}}</td>
                <td class="flex flex-items-center text-blue-1200">
                  {{ credirCardData.card_num_str }}
                  <img v-if="credirCardData.BIN === 'VISA'" class="h-33px ml-10px" src="@/assets/img/admin_VISA.png" alt="">
                  <img v-else-if="credirCardData.BIN === 'Mastercard'" class="h-33px ml-10px" src="@/assets/img/admin_MasterCard.png" alt="">
                  <img v-else-if="credirCardData.BIN === 'JCB'" class="h-33px ml-10px" src="@/assets/img/admin_JCB.png" alt="">
                  <img v-else-if="credirCardData.BIN === 'UnionPay'" class="h-33px ml-10px" src="@/assets/img/admin_UnionPay.png" alt="">
                </td>
              </tr>
              <tr>
                <td class="w-150px h-35px text-gray-400">{{ t('expiration_date') }}</td>
                <td class="text-blue-1200">{{ credirCardData.expireDate }}</td>
              </tr>
            </table>
          </div>
        </el-col>
      </el-row>

      <el-row class="wh-full min-w-600px">
        <el-col class="pb-20px" :xs="24" :lg="16">
          <div class="newebPay card-container card-rounded box-shadow mb-20px xl:mr-20px">
            <div class="flex flex-justify-between flex-items-center mb-20px">
              <div class="flex">
                <font-awesome-icon icon="fa-solid fa-coins" class="w-20px h-20px mr-5px text-blue-1200" />
                <p class="text-1.8rem text-blue-1200 font-bold">{{ t('neweb_pay') }}</p>
              </div>
              <el-button round class="button" @click="openNewebDialog" v-if="!companyData.Merchant_ID" >{{ t('create') }}</el-button>
            </div>
            <div class="flex flex-items-center flex-wrap px-2.5rem mb-20px">
              <div class="w-50% min-w-350px flex mb-5px">
                <p class="w-150px text-blue-1200">{{ t('merchant_id') }}</p>
                <p class="text-blue-1200">{{ companyData.Merchant_ID }}</p>
              </div>
              <div class="w-50% min-w-350px flex mb-5px">
                <p class="w-150px text-blue-1200">{{ t('merchant_status') }}</p>
                <p class="text-blue-1200">{{ companyData.Merchant_Status }}</p>
              </div>
              <div class="w-50% min-w-350px flex mb-5px">
                <p class="w-150px text-blue-1200">{{ t('agreed_fee') }}</p>
                <p class="text-blue-1200">{{ agreeFee }} {{ '%' }}</p>
              </div>
              <div class="w-50% min-w-350px flex mb-5px">
                <p class="w-150px text-blue-1200">{{ t('session_fee') }}</p>
                <p class="text-blue-1200">{{ sessionFee }} {{ currency }}</p>
              </div>
            </div>
          </div>
        </el-col>
        <el-col class="pb-20px" :xs="24" :lg="8">
          <div class="policy card-container card-rounded box-shadow overflow-x-auto">
            <div class="flex flex-justify-between flex-items-center mb-20px">
              <div class="flex flex-items-center">
                <font-awesome-icon icon="fa-regular fa-file" class="w-20px h-20px mr-5px text-blue-1200" />
                <p class="text-1.8rem text-blue-1200 font-bold">{{ t('policy') }}</p>
              </div>
            </div>
            <a class="text-blue-1200 underline cursor-pointer" @click="display_eula"> {{ t('user_agreement')}}</a>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="chargeProgramVisible"
      class="change-program min-w-600px"
      :show-close="true"
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
            {{ program_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="flex flex-justify-between flex-items-start pb-24px">
          <el-steps :active=program_steps class="w-300px" finish-status="success">
            <el-step :title="t('change_program')" @click="program_steps = 1; program_title = t('change_program')" class="cursor-pointer" />
            <el-step :title="t('confirm_program')" class="cursor-pointer" />
          </el-steps>
          
          <el-radio-group v-model="Effective" class="flex-col 2xl:flex-row flex-hustify-start flex-items-start">
            <el-radio v-if="EffectiveRestriction === true" disabled label="1" size="large">
              <p>{{ t('effective_immediately') }}</p>
              <p class="text-gray-400">{{ t('start_at') }} {{ current_date }}</p>
            </el-radio>
            <el-radio v-else label="1" size="large">
              <p>{{ t('effective_immediately') }}</p>
              <p class="text-gray-400">{{ t('start_at') }} {{ current_date }}</p>
            </el-radio>
            <el-radio label="2" size="large">
              <p>{{ t('effective_date_will_start_in_a_month') }}</p>
              <p class="text-gray-400">{{ t('start_at') }} {{ companyData.program_date }}</p>
            </el-radio>
          </el-radio-group>
        </div>
        <div class="overflow-x-auto pb-20px">
          <div v-if="program_steps === 1" class="flex flex-items-end">
            <div v-for="item in ProgramData" class="card-container card-rounded mx-10px min-w-150px p-0" :class="{'currently-program-container': item.currently}">
              <div v-if="item.currently" class="currently-program-header bg-blue-700">
                <p class="text-center line-height-30px color-white h-30px">{{ t('currently_used') }}</p>
              </div>
              <div class="flex-col h-400px p-16px">
                <el-radio-group v-model="selectProgram" class="flex-justify-end">
                  <el-radio :label="item._id" @change="handleSelectProgram(item)"> {{""}}</el-radio>
                </el-radio-group>

                <p class="text-1.6rem text-blue-1200 font-bold mb-10px">{{ item.name }}</p>
                <p class="text-2.2rem text-blue-1200 font-bold mb-8px">${{ item.price }}</p>
                <p class="text-gray-400">{{ t('per_month') }}</p>
                <el-divider />
                <table>
                  <tr v-for="item_name in program_card_item" class="h-25px">
                    <td class="text-gray-400">{{ item_name }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('station')">{{ item.location }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('evse')">{{ item.evse }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('rate_plan')">{{ item.tariff }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('admin_user')">{{ item.admin_user }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('user')">{{ item.user }}</td>
                    <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('currency')">{{ item.currency }}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="flex flex-items-end">
              <div class="card-container card-rounded mx-10px min-w-150px p-0 currently-program-container">
                <div class="currently-program-header bg-blue-700">
                  <p class="text-center line-height-30px color-white h-30px">{{ t('currently_used') }}</p>
                </div>
                <div class="flex-col h-400px p-16px">
                  <p class="text-1.6rem text-blue-1200 font-bold mb-10px">{{ original_program.name }}</p>
                  <p class="text-2.2rem text-blue-1200 font-bold mb-8px">${{ original_program.price }}</p>
                  <p class="text-gray-400">{{ t('per_month') }}</p>
                  <el-divider />
                  <table>
                    <tr v-for="item_name in program_card_item" class="h-25px">
                      <td class="text-gray-400">{{ item_name }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('station')">{{ original_program.location }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('evse')">{{ original_program.evse }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('rate_plan')">{{ original_program.tariff }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('admin_user')">{{ original_program.admin_user }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('user')">{{ original_program.user }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('currency')">{{ original_program.currency }}</td>
                    </tr>
                  </table>
                </div>
              </div>
              <font-awesome-icon icon="fa-solid fa-angles-right" class="flex-self-center" />
              <div class="card-container card-rounded mx-10px min-w-150px p-0">
                <div class="flex-col h-400px p-16px">
                  <p class="text-1.6rem text-blue-1200 font-bold mb-10px">{{ selected_program.name }}</p>
                  <p class="text-2.2rem text-blue-1200 font-bold mb-8px">${{ selected_program.price }}</p>
                  <p class="text-gray-400">{{ t('per_month') }}</p>
                  <el-divider />
                  <table>
                    <tr v-for="item_name in program_card_item" class="h-25px">
                      <td class="text-gray-400">{{ item_name }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('station')">{{ selected_program.location }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('evse')">{{ selected_program.evse }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('rate_plan')">{{ selected_program.tariff }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('admin_user')">{{ selected_program.admin_user }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('user')">{{ selected_program.user }}</td>
                      <td class="text-right text-blue-1200 font-bold" v-if="item_name === t('currency')">{{ selected_program.currency }}</td>
                    </tr>
                  </table>
                </div>
              </div>
              <div class="w-500px flex flex-justify-center">
                <el-form label-position="top" label-width="100px" :rules="program_rules" :model="program_paymentData" ref="program_ref" :scroll-to-error=true>
                  <el-form-item :label="t('name')" prop="name">
                    <el-input v-model="program_paymentData.name" style="width: 300px" disabled />
                  </el-form-item>
                  <el-form-item :label="t('address')" prop="address_str">
                    <el-input v-model="program_paymentData.address" style="width: 300px" />
                  </el-form-item>
                  <el-form-item :label="t('phone')" prop="phone">
                    <el-input v-model="program_paymentData.phone" style="width: 300px" />
                  </el-form-item>
                  <el-form-item :label="t('tax_id')" prop="tax_id">
                    <el-input v-model="program_paymentData.tax_id" style="width: 300px" disabled />
                  </el-form-item>
                  <el-form-item :label="t('e_mail')" prop="email">
                    <el-input v-model="program_paymentData.email" style="width: 300px" disabled/>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="changeProgram('cancel')"
          >
          {{ t('cancel') }}
          </el-button>
          <el-button
            v-if="selectProgram === companyData.program_id"
            round
            disabled
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="changeProgram('change')"
          >
          {{ program_next_btn }}
          </el-button>
          <el-button
            v-else
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="changeProgram('change')"
          >
          {{ program_next_btn }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="adminDialogVisible"
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
            {{ admin_title }}
          </h4>
        </div>
      </template>

      <div class="dialog-context">
        <el-form class="max-w-500px m-auto" :rules="AdminData_rules" ref="AdminData_ref" :model="AdminData" :scroll-to-error=true>
          <div class="flex flex-col flex-justify-between lg:flex-row">
            <el-form-item class="mb-24px w-full lg:w-45%" :label="t('first_name')" prop="first_name">
              <el-input v-model="AdminData.first_name" />
            </el-form-item>
  
            <el-form-item class="mb-24px w-full lg:w-45%" :label="t('last_name')" prop="last_name">
              <el-input v-model="AdminData.last_name" />
            </el-form-item>
          </div>

          <el-form-item class="mb-24px" :label="t('e_mail')" prop="email">
            <el-input v-if="admin_title === t('add_admin')" v-model="AdminData.email"/>
            <el-input v-else v-model="AdminData.email" disabled/>
          </el-form-item>

          <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
            <el-input v-model="AdminData.phone" />
          </el-form-item>

          <el-form-item class="mb-24px" :label="t('permission')" prop="permission_str">
            <el-select 
              class="el-select" 
              v-model="AdminData.permission_str" 
              :placeholder="t('select')" 
              size="large"
              @change="setPermission"
            >
              <el-option v-for="item in UserPermission" :key="item.value" :label="item.name_str" :value="item._id" />
            </el-select>
          </el-form-item>

          <el-form-item class="mb-24px w-4em" :label="t('edit')">
            <el-switch v-model="AdminData.permission_edit" />
          </el-form-item>

          <el-form-item class="mb-24px w-4em" :label="t('active')">
            <el-switch v-model="AdminData.permission_active" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click.stop="confirmAdminUser('cancel', null)"
          >
            {{ t('cancel') }}
          </el-button>
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            v-if="MStore.permission?.edit === 3"
            disabled
          >
            {{ t('confirm') }}
          </el-button>
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="confirmAdminUser('add', null)"
            v-else-if="admin_title === t('add_admin')"
          >
            {{ t('confirm') }}
          </el-button>
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="confirmAdminUser('edit', null)"
            v-else
          >
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="eula_visible"
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

    <el-dialog
      v-model="newebDialogVisible"
      class="max-w-600px"
      :show-close="true"
      width="90%"
      destroy-on-close
      center
      @close="closeNewebDialog"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
          >
            {{ neweb_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="w-300px m-auto" v-if="neweb_create_failed === false">
          <p class="text-gray-400 mb-10px">{{ t('please_enter_merchant_id') }}</p>
          <div class="flex flex-items-center text-gray-400">
            <span class="mr-10px">MSI</span>
            <el-input v-model="neweb_id" placeholder="" :formatter="validNewebId" />

          </div>
          <p class="text-red font-bold my-20px">* {{ t('the_format_should_be_number_with_limit_to_12_characters') }}</p>
        </div>
        <div class="w-300px m-auto flex-col" v-else-if="neweb_create_failed === true">
          <img class="m-auto" src="@/assets/img/customer_pwreset.png" alt="">
          <p class="text-center my-20px">{{ t('this_merchant_id_already_exists_please_enter_a_different_id') }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center" v-if="neweb_create_failed === false">
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="confirmNewebPay('cancel')">{{ t('cancel') }}</el-button>
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="confirmNewebPay('create')">{{ t('create') }}</el-button>
        </span>
        <span class="dialog-footer flex flex-center" v-else-if="neweb_create_failed === true">
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="confirmNewebPay('back')">{{ t('ok') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>


<style lang="scss" scoped>
.admin {
  .card-container {
    height: 100%;
    border: 2px solid var(--gray-100);
  }
  .program-chart {
    width: 100%;
    height: 6rem;
  }
  .button {
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--secondary);
    border-color: var(--secondary);
    border-radius: 2rem;
    @media (min-width: 768px) {
      width: 18rem;
    }
  }
  .main-container {
    min-height: calc(100vh - 18rem);
  }
  .admin-user-list {
    max-height: 400px;
  }
  :deep(.change-program) {
    width: fit-content;
    margin: 0 20px;
  }
  .currently-program-container {
    background-color: #f3f8fc;
    border-color: #90a9bf;
  }
  .currently-program-header {
    border-radius: 10px 10px 0 0;
  }

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

::-webkit-scrollbar {
  width: 0.8rem;
  height: 0.8rem;
}
::-webkit-scrollbar-thumb {
  background-color: var(--blue-1000);
}
::-webkit-scrollbar-thumb {
  border-radius: 2rem;
}
</style>