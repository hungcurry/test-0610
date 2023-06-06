import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n from '@/locales'
import router from './router'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import 'normalize.css/normalize.css'
import './assets/main.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faUser as solidUser, faBell, faGear, faArrowRight, faLocationDot, faEllipsis, faClock as solidClock, faCoins} from '@fortawesome/free-solid-svg-icons'
import { faPenToSquare, faClock, faUser} from '@fortawesome/free-regular-svg-icons'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)

app.mount('#app')

library.add(faUser, faBell, faGear,  faPenToSquare, faArrowRight, faLocationDot, faEllipsis, faClock,solidUser, solidClock, faCoins )