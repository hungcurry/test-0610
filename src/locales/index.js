import { createI18n } from 'vue-i18n'
import zh_tw from './zh-tw'
import en_us from './en-us'
import zhTw from 'element-plus/dist/locale/zh-tw.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'

const i18n = createI18n({
  legacy: false,
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: 'en_us',
  fallbackLocale: 'en_us',
  messages: {
    en_us: {
      ...en_us,
      elLang: {...enUs}
    },
    zh_tw: {
      ...zh_tw,
      elLang: {...zhTw}
    }
  }
})

export default i18n