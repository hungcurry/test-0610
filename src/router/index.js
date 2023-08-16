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
import CustomersView from '@/views/CustomersView.vue'
import CustomersDetailView from '@/views/CustomersDetailView.vue'
import AdministratorView from '@/views/AdministratorView.vue'
import OcpiSessionView from '@/views/OcpiSessionView.vue'
import PaymentView from '@/views/PaymentView.vue'
import CompanyView from '@/views/CompanyView.vue'
import EvseDetailView from '@/views/EvseDetailView.vue'
import TariffView from '@/views/TariffView.vue'
import TariffDetailView from '@/views/TariffDetailView.vue'
import EvseEditView from '@/views/EvseEditView.vue'
import SoftwareInfoView from '@/views/SoftwareInfoView.vue'
import OcppErrorView from '@/views/OcppErrorView.vue'
import TestView from '@/views/TestView.vue'
import ParkingView from '@/views/ParkingView.vue'
import UserView from '@/views/UserView.vue'
import ProgramView from '@/views/ProgramView.vue'
import ChargeProfileView from '@/views/ChargeProfileView.vue'


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
          component: UserView
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
          component: TariffView
        },
        {
          path: 'rate-plan-detail',
          name: 'ratePlanDetail',
          component: TariffDetailView
        },
        {
          path: 'user',
          name: 'user',
          component: CustomersView
        },
        {
          path: 'user-detail',
          name: 'userDetail',
          component: CustomersDetailView
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
          name: 'ocpiSession',
          component: OcpiSessionView
        },
        {
          path: 'ocpp-error',
          name: 'ocppError',
          component: OcppErrorView
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
          path: 'test',
          name: 'test',
          component: TestView
        },
      ]
    }
  ]
})

router.beforeEach(async to => {

  if (navigator.language === 'zh-TW') i18n.global.locale.value = 'zh_tw'
  else i18n.global.locale.value = 'en_us'

  if (to.meta.title) {
    document.title = to.meta.title
  }
  else {
    document.title = "m-Cloud"
  }

  if (to.fullPath === '/login') return

  const MStore = useMStore()
  const MsiApi = ApiFunc()
  if (MStore.timeZoneOffset === undefined) 
    MStore.timeZoneOffset = new Date().getTimezoneOffset()
  if (MStore.permission === undefined) {
    let res = await MsiApi.checkToken()
    if (res === 0) 
      return '/login'  
    else {
      MStore.permission = res.data.permission
      MStore.user_data.first_name = res.data.first_name
      MStore.user_data.last_name = res.data.last_name
      MStore.user_data.email = res.data.email
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
