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
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import {
  faUser as solidUser,
  faGear,
  faArrowRight,
  faArrowDown,
  faLocationDot,
  faEllipsis,
  faClock as solidClock,
  faCoins,
  faChartLine,
  faDeleteLeft,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons'
import {
  faPenToSquare,
  faClock,
  faUser,
  faCalendarCheck,
  faCreditCard,
  faFileLines,
  faIdCard,
} from '@fortawesome/free-regular-svg-icons'

const app = createApp(App)

/* global APP_VERSION */
app.config.globalProperties.APP_VERSION = APP_VERSION
app.use(createPinia())
app.use(router)
app.use(i18n)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

library.add(
  faUser,
  faGear,
  faPenToSquare,
  faArrowRight,
  faArrowDown,
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
  faFileLines,
  faAnglesRight,
  faIdCard,
)
