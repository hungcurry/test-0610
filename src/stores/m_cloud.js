import { defineStore } from 'pinia'

export const useMStore = defineStore('mCloudStore', () => {
  const timeZoneOffset = undefined
  const permission = undefined
  const user_data = {}
  let rule_permission = {}
  const program = {}
  return { timeZoneOffset, permission, user_data, program, rule_permission }
})
