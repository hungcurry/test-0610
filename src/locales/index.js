import { createI18n } from 'vue-i18n'
import zh_tw from './zh-tw'
import en_us from './en-us'

const i18n = createI18n({
  legacy: false,
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: 'en_us',
  fallbackLocale: 'en_us',
  messages: {
    en_us,
    zh_tw,
  }
})

export default i18n