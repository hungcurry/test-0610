import { defineStore } from 'pinia'

export const useMStore = defineStore('mCloudStore', () => {
  const timeZoneOffset = undefined
  const permission = undefined
  const user_data = {}
  return { timeZoneOffset, permission, user_data }
})
