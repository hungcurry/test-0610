import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n from '@/locales'
import router from './router'
import App from './App.vue'

import 'normalize.css/normalize.css'
import 'uno.css'
import '@/assets/scss/all.scss'
import 'default-passive-events'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  faUser as solidUser,
  faBell,
  faGear,
  faArrowRight,
  faLocationDot,
  faEllipsis,
  faClock as solidClock,
  faCoins,
  faChartLine,
  faDeleteLeft,
} from '@fortawesome/free-solid-svg-icons'
import {
  faPenToSquare,
  faClock,
  faUser,
  faCalendarCheck,
  faCreditCard,
  faFile
} from '@fortawesome/free-regular-svg-icons'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

/* global APP_VERSION */
app.config.globalProperties.APP_VERSION = APP_VERSION

library.add(
  faUser,
  faBell,
  faGear,
  faPenToSquare,
  faArrowRight,
  faLocationDot,
  faEllipsis,
  faClock,
  solidUser,
  solidClock,
  faCoins,
  faCalendarCheck,
  faCreditCard,
  faChartLine,
  faDeleteLeft,
  faFile
)
