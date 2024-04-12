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
import ParkingView from '@/views/ParkingView.vue'
import AdminInfoView from '@/views/AdminInfoView.vue'
import ProgramView from '@/views/ProgramView.vue'
import ChargeProfileView from '@/views/ChargeProfileView.vue'
import ChargeProfileDetailView from '@/views/ChargeProfileDetailView.vue'
import PermissionView from '@/views/PermissionView.vue'
import RfidUserView from '@/views/RfidUserView.vue'
import RfidUserDetailView from '@/views/RfidUserDetailView.vue'
import StationMapView from '@/views/StationMapView.vue'
import TokenManagementView from '@/views/TokenManagementView.vue'
import CdrView from '@/views/CdrView.vue'
import NotFound from '@/views/NotFound.vue'
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
          path: 'cdr',
          name: 'cdr',
          component: CdrView
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
          path: 'station-map',
          name: 'stationMap',
          component: StationMapView
        },
        {
          path: 'token-management',
          name: 'tokenManagement',
          component: TokenManagementView
        },
        {
          path: '/:catchAll(.*)',
          name: '404',
          component: NotFound,
        },
      ]
    }
  ]
})

router.beforeEach(async to => {

  const MStore = useMStore()
  const MsiApi = ApiFunc()

  if (to.meta.title) document.title = to.meta.title
  else document.title = "m-Cloud"

  const lang = localStorage.getItem("lang")
  if (lang)
    i18n.global.locale.value = lang
  else {
    if (navigator.language === 'zh-TW') 
      i18n.global.locale.value = 'zh_tw'
    else 
      i18n.global.locale.value = 'en_us'
    localStorage.setItem("lang", i18n.global.locale.value)
  }
  
  if (to.fullPath === '/login') return
  
  if (MStore.timeZoneOffset === undefined) 
    MStore.timeZoneOffset = new Date().getTimezoneOffset()

  if (MStore.permission === undefined) {
    try {
      let res = await MsiApi.checkToken()
      if (res.status === 200) {
        MStore.permission = res.data.permission
        if (res.data.permission?.company?.name === 'MSI') 
          MStore.permission.isMSI = true
        else 
          MStore.permission.isMSI = false
        if (res.data.email) {
          MStore.permission.isCompany = false
          MStore.user_data.email = res.data.email
        }
        else {
          MStore.permission.isCompany = true
          MStore.user_data.email = ''
          MStore.rule_permission = m_cloud_permission.AdminUser
        }
      } 
      else {
        return '/login'  
      }
      if (MStore.permission.isCompany === false) {
        const user_permission = MStore?.permission?.user?.name
        let queryData  = { database: "CPO", collection: "CompanyInformation", pipelines: [ 
          { $match:  { name: { $eq: MStore.permission.company.name} } }, 
          { $project: { _id: 0, config: 1} }
        ]}
        res = await MsiApi.mongoAggregate(queryData)
        console.log(res)
        if (res.status === 200) {
          console.log(`company=>` ,MStore.permission.company.name)
          console.log(`userPermission=>` , user_permission)
          if (res.data.result[0]?.config?.m_cloud?.permissions?.[user_permission]) {
            const remotePermission = res.data.result[0].config.m_cloud.permissions[user_permission]
            const localPermission = JSON.parse(JSON.stringify(m_cloud_permission[user_permission]))
            for (let page in remotePermission) {
              if (!localPermission[page]) continue
              for (let item in remotePermission[page]) {
                if (remotePermission[page][item] === 'O' && localPermission[page][item] ) 
                  localPermission[page][item] = 'O'
                else if (remotePermission[page][item] === 'X' && localPermission[page][item] ) 
                  localPermission[page][item] = 'X'
              }
            }
            MStore.rule_permission = localPermission
          }
          else {
            MStore.rule_permission = m_cloud_permission[MStore?.permission?.user?.name]
          }
        }
        else {
          return '/login'  
        }
      }

      let queryData = { database: 'CPO', collection: 'LimitPlan', pipelines: [
        { $match: { _id: { $eq: {ObjectId : MStore.permission.company.upgrade_manager.subscribe.due_plan} } } },
        { $project: { _id: 0 } },
      ]}
      res = await MsiApi.mongoAggregate(queryData)
      if (res.status === 200) {
        MStore.program = res.data.result[0]
      }
      else { 
        return '/login'  
      }
    }
    catch {
      ElMessage.error('An unexpected error occurred.')
      return '/login'  
    }
  }

  let toPath = to.fullPath.toLowerCase()

  if (toPath === '/company' && MStore.permission.company.name !== 'MSI' ) {
    return '/login'
  }
  
  if (toPath === '/program' && MStore.permission.company.name !== 'MSI' ) {
    return '/login'
  }
  console.log(1234)
})

export default router
