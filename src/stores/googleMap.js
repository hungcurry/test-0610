import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGoogleStore = defineStore('google', () => {
  const show_stataion_detail = ref(false)

  return { show_stataion_detail }
})
