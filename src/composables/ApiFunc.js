import VueCookies from 'vue-cookies'
import axios from 'axios'

let AuthToken = null
let api1 = 'api10/api3'
axios.defaults.timeout = 15000
if (import.meta.env.VITE_API !== undefined) {
  api1 = import.meta.env.VITE_API
}

export default function () {

  const getJsonData = async function (path, Token) {
    if (Token === undefined) {
      Token = {}
      Token.headers = {}
      Token.headers['X-Client-From'] = 'm-Cloud'
    }
    try {
      const response = await axios.get(path, Token)
      return response
    } catch (e) {
      return e.response
    }
  }

  const postJsonData = async function (path, data, Token) {
    if (Token === undefined) {
      Token = {}
      Token.headers = {}
      Token.headers['X-Client-From'] = 'm-Cloud'
    }
    try {
      const response = await axios.post(path, data, Token)
      return response
    } catch (e) {
      return e.response
    }
  }

  const patchJsonData = async function (path, data, Token) {
    try {
      Token.headers['X-Client-From'] = 'm-Cloud'
      const response = await axios.patch(path, data, Token)
      return response
    } catch (e) {
      return e.response
    }
  }

  const delJsonData = async function (path, data1, Token) {
    try {
      const Token1 = Token.headers
      Token1['X-Client-From'] = 'm-Cloud'
      const response = await axios.delete(path, { headers: Token1, data: data1 })
      return response
    } catch (e) {
      return e.response
    }
  }

  const setCollectionData = async function (method, collection, json) {
    AuthToken = VueCookies.get('AuthToken')
    if (method === 'post') {
      const response = await postJsonData(api1 + '/' + collection + '/set', json, AuthToken)
      return response
    }
    else if (method === 'patch') {
      const response = await patchJsonData(api1 + '/' + collection + '/set', json, AuthToken)
      return response
    }
    else if (method === 'delete') {
      const response = await delJsonData(api1 + '/' + collection + '/set', json, AuthToken)
      return response
    }
  }

  const getToken = async function (json) {
    const response = await postJsonData(api1 + '/member/login', json)
    return response
  }

  const checkToken = async function () {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/member/about', AuthToken)
    return response
}

  const mongoQuery = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cpo/database/query', json, AuthToken)
    return response
  }

  const mongoAggregate = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cpo/database/aggregate', json, AuthToken)
    return response
  }

  const register_member_v0 = async (json) => {
    const response = await postJsonData(api1 + '/member/register', json)
    return response
  }

  const register_member = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/account', json, AuthToken)
    return response
  }

  const get_account_info = async (role) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/account?role=' + role + '&type=info', AuthToken)
    return response
  }

  const get_account_detail = async (role, id) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/account?role=' + role + '&type=detail&people=' + id, AuthToken)
    return response
  }

  const edit_account = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/account', json, AuthToken)
    return response
  }

  const delete_account = async (params) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await delJsonData(api1 + '/account?role=' + params.role + '&id=' + params.id, '', AuthToken)
    return response
  }

  const resetPW = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/member/resetpw', json, AuthToken)
    return response
  }

  const reset_evse = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cp/ocpp/v16/reset', json, AuthToken)
    return response
  }

  const updateFw = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cp/ocpp/v16/update_firmware', json, AuthToken)
    return response
  }

  const getTimeZone = async (lat, lng) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cpo/timezone?latitude=' + lat + '&longitude=' + lng, AuthToken)
    return response
  }

  const getCoordinates = async (addr) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cpo/address?address=' + addr, AuthToken)
    return response
  }

  const getAddress = async (lat, lng) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cpo/address?latitude=' + lat + '&longitude=' + lng, AuthToken)
    return response
  }

  const bind_card = async () => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/payment/newebpay/bindingCard', AuthToken)
    return response
  }

  const search_bind_card = async () => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/payment/searchBindingCards', AuthToken)
    return response
  }

  const unregister_bind_card = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await delJsonData(api1 + '/payment/newebpay/unregisterBindingCard', json, AuthToken)
    return response
  }

  const auth_payment = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/payment/newebpay/company/authPayment',json, AuthToken)
    return response
  }

  const subscribe_plan = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/cpo/company/subscribe/plan', json, AuthToken)
    return response
  }

  const member_modify = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/member/modify', json, AuthToken)
    return response
  }

  const forgotPW = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/member/forgot/pw', json, AuthToken)
    return response
  }

  const add_rfid_data = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/rfid', json, AuthToken)
    return response
  }

  const edit_rfid_data = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/rfid', json, AuthToken)
    return response
  }

  const delete_rfid_data = async (params) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await delJsonData(api1 + '/rfid?id=' + params.id + '&rfid=' + params.rfid, '', AuthToken)
    return response
  }

  const set_rfid_cash = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/rfid', json, AuthToken)
    return response
  }

  const get_transaction = async (params) => {
    AuthToken = VueCookies.get('AuthToken')
    let path = '/log?'
    if (params.type !== undefined) {
      path += ('record_type=' + params.type)
    }
    if (params.user !== undefined) {
      path += ('&user=' + params.user)
    }
    if (params.id !== undefined) {
      path += ('&id=' + params.id)
    }
    if (params.start_date !== undefined && params.end_date !== undefined) {
      path += ('&start_date=' + params.start_date + '&end_date=' + params.end_date )
    }
    const response = await getJsonData(api1 + path, AuthToken)
    return response
  }
  
  const change_availability = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cp/ocpp/v16/change_availability', json, AuthToken)
    return response
  }


  const get_diagnostics = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cp/ocpp/v16/get_diagnostics' +'?evse_id=' + json.evse_id + '&location=' + json.location,  AuthToken)
    return response
  }
   
  const get_configuration = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cp/ocpp/v16/get_configuration' +'?evse_id=' + json.evse_id ,  AuthToken)
    console.log(response)
    return response
  }


  const clear_charging_profile = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cp/ocpp/v16/clear_charging_profile', json, AuthToken)
    return response
  }

  const get_composite_schedule = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/cp/ocpp/v16/get_composite_schedule' +'?evse_id=' + json.evse_id + '&connectorId=1' + '&duration=' + json.duration  ,  AuthToken)
    return response
  }

  const set_charging_profile = async(json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cp/ocpp/v16/set_charging_profile', json,  AuthToken)
    return response
  }
  
  const add_merchant = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/payment/newebpay/company/addMerchant' +'?merchantId=' + json.merchantId, AuthToken)
    console.log(response)
    return response
  }
  
  const sendNotification = async (json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await postJsonData(api1 + '/cpo/notify/fcm', json ,  AuthToken)
    return response
  }

  const get_edoc = async(json) => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/edoc?name=' + json.filename, AuthToken)
    return response
  }

  const patch_edoc = async() => {
    AuthToken = VueCookies.get('AuthToken')
    const response = await patchJsonData(api1 + '/edoc', '', AuthToken)
    return response
  }

  const getTaiwanExchangeRate = async () => {
    const response = await getJsonData('/rate/xrt/flcsv/0/day')
    const rows = response.data.trim().split('\n')
    const headerRow = rows[0].split(',')
    const cashIndex = headerRow.indexOf('現金')
    const currenciesToExtract = ['USD', 'CNY', 'JPY', 'EUR']
    const cashPrices = {}
    
    currenciesToExtract.forEach(currency => {
      const currencyRow = rows.find(row => row.includes(currency))
      if (currencyRow) {
        const currencyValues = currencyRow.split(',')
        const cashPrice = currencyValues[cashIndex]
        cashPrices[currency] = cashPrice
      }
    })
    return cashPrices
  }

  return {
      setCollectionData, getToken, checkToken, mongoQuery, mongoAggregate,
      register_member_v0, register_member, get_account_info, get_account_detail, edit_account, delete_account,
      resetPW, reset_evse, updateFw, getTimeZone, getCoordinates, getAddress,
      bind_card, search_bind_card, unregister_bind_card, auth_payment, subscribe_plan, member_modify,
      forgotPW, add_rfid_data, edit_rfid_data, delete_rfid_data, set_rfid_cash, 
      clear_charging_profile, get_composite_schedule, set_charging_profile,
      get_transaction, change_availability, get_diagnostics, get_configuration, sendNotification,
      add_merchant, get_edoc, patch_edoc, getTaiwanExchangeRate,
  }
}