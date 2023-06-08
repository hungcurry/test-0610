import { createRouter, createWebHistory } from 'vue-router'
import { useMStore } from "../stores/m_cloud";
import ApiFunc from '@/components/ApiFunc'
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
import PaymentHistoryView from '@/views/PaymentHistoryView.vue'
import CompanyView from '@/views/CompanyView.vue'
import EvseDetailView from '@/views/EvseDetailView.vue'
import TariffView from '@/views/TariffView.vue'
import TariffDetailView from '@/views/TariffDetailView.vue'
import EvseEditView from '@/views/EvseEditView.vue'
import SoftwareInfoView from '@/views/SoftwareInfoView.vue'
import OcppErrorView from '@/views/OcppErrorView.vue'
import TestView from '@/views/TestView.vue'
import ParkingView from '@/views/ParkingView.vue'


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
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'stationDetail',
          name: 'stationDetail',
          component: StationDetailView
        },
        {
          path: 'station',
          name: 'station',
          component: StationView
        },
        {
          path: 'evse',
          name: 'evse',
          component: EvseView
        },
        {
          path: 'customers',
          name: 'customers',
          component: CustomersView
        },

        {
          path: 'customersDetail',
          name: 'customersDetail',
          component: CustomersDetailView
        },

        {
          path: 'administrator',
          name: 'administrator',
          component: AdministratorView
        },
        {
          path: 'company',
          name: 'company',
          component: CompanyView
        },
        {
          path: 'ocpiSession',
          name: 'ocpiSession',
          component: OcpiSessionView
        },
        {
          path: 'stationEdit',
          name: 'stationEdit',
          component: StationEditView
        },
        {
          path: 'paymentHistory',
          name: 'paymentHistory',
          component: PaymentHistoryView
        },
        {
          path: 'evseDetail',
          name: 'evseDetail',
          component: EvseDetailView
        },        
        {
          path: 'tariff',
          name: 'tariff',
          component: TariffView
        },
        {
          path: 'tariffDetail',
          name: 'tariffDetail',
          component: TariffDetailView
        },
        {
          path: 'evseEdit',
          name: 'evseEdit',
          component: EvseEditView
        },
        {
          path: 'softwareInfo',
          name: 'softwareInfo',
          component: SoftwareInfoView
        },
        {
          path: 'ocppError',
          name: 'ocppError',
          component: OcppErrorView,
          meta: { title: 'ocppError' }
        },
        {
          path: 'test',
          name: 'test',
          component: TestView
        },
        {
          path: 'parking',
          name: 'parking',
          component: ParkingView
        },
      ]
    }
  ]
})

router.beforeEach(async to => {
  if (to.fullPath === '/login') return

  const MStore = useMStore()
  const MsiApi = ApiFunc()
  if (MStore.timeZoneOffset === undefined) 
    MStore.timeZoneOffset = new Date().getTimezoneOffset()


  if (MStore.permission === undefined) {
    let res = await MsiApi.checkToken()
    MStore.permission = res.data.permission
  }


  if (MStore.permission === 0) 
    return '/login'

  let res = await MsiApi.checkToken()


  if (to.fullPath === '/company' && MStore.permission.company.name !== 'MSI' ) {
    return '/login'
  }

  if (to.fullPath === '/parking' && res.data.first_name !== 'Steven' && res.data.first_name !== 'Leo' && res.data.first_name !== 'Frank') {
    return '/login'
  }

  if (to.fullPath === '/test' && res.data.first_name !== 'Steven' && res.data.first_name !== 'Leo' && res.data.first_name !== 'Frank' ) {
    return '/login'
  }

})

export default router
