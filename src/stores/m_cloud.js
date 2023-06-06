import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMStore = defineStore('header_left_component', () => {
  const header_left_component = ref('')

  function change_header_component( component) {
    header_left_component.value = component
  }

  const timeZoneOffset = undefined
  const permission = undefined

  return { header_left_component, change_header_component, timeZoneOffset, permission }
})
