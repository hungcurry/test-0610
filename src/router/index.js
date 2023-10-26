import { createRouter, createWebHistory } from 'vue-router'
import { useMStore } from "../stores/m_cloud"
import i18n from '@/locales'
import ApiFunc from '@/composables/ApiFunc'
import EmsLayout from '@/components/EmsLayout.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import StationView from '@/views/StationView.vue'
import StationDetailView from '@/views/StationDetailView.vue'
import StationEditView from '@/views/StationEditView.vue'
import EvseView from '@/views/EvseView.vue'
import UserView from '@/views/UserView.vue'
import UserDetailView from '@/views/UserDetailView.vue'
import AdministratorView from '@/views/AdministratorView.vue'
import EvseLogView from '@/views/EvseLogView.vue'
import PaymentView from '@/views/PaymentView.vue'
import CompanyView from '@/views/CompanyView.vue'
import EvseDetailView from '@/views/EvseDetailView.vue'
import RatePlanView from '@/views/RatePlanView.vue'
import RatePlanDetailView from '@/views/RatePlanDetailView.vue'
import EvseEditView from '@/views/EvseEditView.vue'
import SoftwareInfoView from '@/views/SoftwareInfoView.vue'
import ErrorLogView from '@/views/ErrorLogView.vue'
import TestView from '@/views/TestView.vue'
import ParkingView from '@/views/ParkingView.vue'
import AdminInfoView from '@/views/AdminInfoView.vue'
import ProgramView from '@/views/ProgramView.vue'
import ChargeProfileView from '@/views/ChargeProfileView.vue'
import ChargeProfileDetailView from '@/views/ChargeProfileDetailView.vue'
import PermissionView from '@/views/PermissionView.vue'
import RfidUserView from '@/views/RfidUserView.vue'
import RfidUserDetailView from '@/views/RfidUserDetailView.vue'
import { ElMessage } from 'element-plus'
import { m_cloud_permission } from '@/composables/permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path:'/',
      component: EmsLayout,
      redirect: 'login',
      children: [
        {
          path: 'admin-info',
          name: 'adminInfo',
          component: AdminInfoView
        },    
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: 'm-Cloud' }
        },
        {
          path: 'payment',
          name: 'payment',
          component: PaymentView
        },
        {
          path: 'station',
          name: 'station',
          component: StationView
        },
        {
          path: 'station-detail',
          name: 'stationDetail',
          component: StationDetailView
        },
        {
          path: 'station-edit',
          name: 'stationEdit',
          component: StationEditView
        },
        {
          path: 'evse',
          name: 'evse',
          component: EvseView
        },
        {
          path: 'evse-detail',
          name: 'evseDetail',
          component: EvseDetailView
        },    
        {
          path: 'evse-edit',
          name: 'evseEdit',
          component: EvseEditView
        },
        {
          path: 'rate-plan',
          name: 'ratePlan',
          component: RatePlanView
        },
        {
          path: 'rate-plan-detail',
          name: 'ratePlanDetail',
          component: RatePlanDetailView,
        },
        {
          path: 'user',
          name: 'user',
          component: UserView
        },
        {
          path: 'user-detail',
          name: 'userDetail',
          component: UserDetailView
        },
        {
          path: 'company',
          name: 'company',
          component: CompanyView
        },
        {
          path: 'administrator',
          name: 'administrator',
          component: AdministratorView
        },
        {
          path: 'evse-log',
          name: 'evseLog',
          component: EvseLogView
        },
        {
          path: 'error-log',
          name: 'errorLog',
          component: ErrorLogView
        },
        {
          path: 'software-info',
          name: 'softwareInfo',
          component: SoftwareInfoView
        },
        {
          path: 'parking',
          name: 'parking',
          component: ParkingView
        },
        {
          path: 'program',
          name: 'program',
          component: ProgramView
        },  
        {
          path: 'charging-profile',
          name: 'chargingProfile',
          component: ChargeProfileView
        },   
        {
          path: 'charging-profile-detail',
          name: 'chargingProfileDetail',
          component: ChargeProfileDetailView
        },
        {
          path: 'permission',
          name: 'Permission',
          component: PermissionView
        },   
        {
          path: 'rfid-user',
          name: 'rfidUser',
          component: RfidUserView
        },
        {
          path: 'rfid-user-detail',
          name: 'rfidUserDetail',
          component: RfidUserDetailView
        },
        {
          path: 'test',
          name: 'test',
          component: TestView
        },
      ]
    }
  ]
})

router.beforeEach(async to => {
  let lang = localStorage.getItem("lang")
  if (lang)
    i18n.global.locale.value = lang
  else {
    if (navigator.language === 'zh-TW') 
      i18n.global.locale.value = 'zh_tw'
    else 
      i18n.global.locale.value = 'en_us'
    localStorage.setItem("lang", i18n.global.locale.value)
  }
  if (to.meta.title) document.title = to.meta.title
  else document.title = "m-Cloud"
  
  if (to.fullPath === '/login') return

  const MStore = useMStore()
  const MsiApi = ApiFunc()
  if (MStore.timeZoneOffset === undefined) 
    MStore.timeZoneOffset = new Date().getTimezoneOffset()
  if (MStore.permission === undefined) {
    let res = await MsiApi.checkToken()
    try {
      if (res.status === 200) {
        MStore.permission = res.data.permission
        if (res.data.permission.company.name === 'MSI') {
          MStore.permission.isMSI = true
        }
        else {
          MStore.permission.isMSI = false
        }
        let queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
          { $match:  { "name": { "$eq": MStore.permission.company.name } } }, { "$project": { "_id": 0} }
        ]}
          let res1 = await MsiApi.mongoAggregate(queryData)
        if (res.data.email) {
          const user_permission = MStore?.permission?.user?.name
          if (res1?.data?.result?.[0]?.config?.m_cloud?.permissions?.[user_permission]){
            MStore.rule_permission = res1.data.result[0].config.m_cloud.permissions[user_permission]
          }
          else {
            MStore.rule_permission = m_cloud_permission[MStore?.permission?.user?.name]
          }
          MStore.permission.isCompany = false
          MStore.user_data.email = res.data.email
          MStore.user_data.first_name = res.data.first_name
          MStore.user_data.last_name = res.data.last_name
        }
        else {
          MStore.rule_permission = m_cloud_permission["AdminUser"]
          MStore.permission.isCompany = true
          MStore.user_data.email = ''
          MStore.user_data.first_name = ''
          MStore.user_data.last_name = ''
        }
        queryData = {
          database: 'CPO',
          collection: 'LimitPlan',
          pipelines: [
            { $match: { _id: { $eq: {ObjectId : res.data.permission.company.upgrade_manager.subscribe.due_plan} } } },
            { $project: { aaa: 0 } },
          ],
        }
        res = await MsiApi.mongoAggregate(queryData)
        if (res.status === 200) {
          MStore.program.name = res.data.result[0].name
          MStore.program.price = res.data.result[0].price
          MStore.program.location = res.data.result[0].location
          MStore.program.evse = res.data.result[0].evse
          MStore.program.tariff = res.data.result[0].tariff
          MStore.program.user = res.data.result[0].user
          MStore.program.admin_user = res.data.result[0].admin_user
          MStore.program.connector = res.data.result[0].connector
          MStore.program.currency = res.data.result[0].currency
        }
        else { 
          ElMessage.error('Error')
          return '/login'  
        }
      } 
      else { 
        ElMessage.error('Error')
        return '/login'  
      }
    }
    catch {
      ElMessage.error('An unexpected error occurred.')
      return '/login'  
    }
  }

  if (MStore.permission === 0) 
    return '/login'
  
  let toPath = to.fullPath.toLowerCase()

  if (toPath === '/company' && MStore.permission.company.name !== 'MSI' ) {
    return '/login'
  }
  
  if (toPath === '/program' && MStore.permission.company.name !== 'MSI' ) {
    return '/login'
  }

  if (toPath === '/test' && MStore.user_data.first_name !== 'Steven' ) {
    return '/login'
  }
})

export default router
