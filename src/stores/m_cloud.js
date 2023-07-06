import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMStore = defineStore('header_left_component', () => {
  const header_left_component = ref('')
  const timeZoneOffset = undefined
  const permission = undefined
  const user_data = {}
  return { header_left_component, timeZoneOffset, permission, user_data }
})
