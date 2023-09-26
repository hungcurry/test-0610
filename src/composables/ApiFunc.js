import VueCookies from 'vue-cookies'
import axios from 'axios'

let AuthToken = null
let api1 = 'api10/api2'
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
    const response = await delJsonData(api1 + '/account?id=' + params.id, '', AuthToken)
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

  return {
      setCollectionData, getToken, checkToken, mongoQuery, mongoAggregate,
      register_member, get_account_info, get_account_detail, edit_account, delete_account,
      resetPW, reset_evse, updateFw, getTimeZone, getCoordinates, getAddress,
      bind_card, search_bind_card, unregister_bind_card, auth_payment, subscribe_plan, member_modify,
      forgotPW, add_rfid_data, edit_rfid_data, delete_rfid_data, set_rfid_cash, 
      get_transaction, change_availability
  }
}