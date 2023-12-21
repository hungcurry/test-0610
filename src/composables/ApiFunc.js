import VueCookies from 'vue-cookies'
import axios from 'axios'

let apiServer = 'api10/api'
axios.defaults.timeout = 15000
if (import.meta.env.VITE_API !== undefined) {
  apiServer = import.meta.env.VITE_API
}

const axiosInterface = async (method, url, data) => {
  let config = VueCookies.get('AuthToken')
  try {
    let response
    switch (method) {
      case 'get':
        response = await axios.get( apiServer + url, config)
        break
      case 'post':
        response = await axios.post( apiServer + url, data, config)
        break
      case 'patch':
        response = await axios.patch( apiServer + url, data, config)
        break
      case 'delete':
        response = await axios.delete( apiServer + url, {headers: config, data: data })
        break
    }
    return response
  }
  catch (e) {
    return e.response
  }
}

export default () => {

  const getToken = async (data) => {
    const config = { headers: { 'X-Client-From': 'm-Cloud'}}
    const response = await axios.post(apiServer + '/member/login', data, config)
    return response
  }

  const setCollectionData = async (method, collection, data) => {
    const response = await axiosInterface( method, '/' + collection + '/set', data)
    return response
  }

  const checkToken = async () => {
    const response = await axiosInterface('get', '/member/about')
    return response
  }

  const resetPW = async (json) => {
    const response = await axiosInterface('patch', '/member/resetpw', json)
    return response
  }

  const mongoQuery = async (data) => {
    const response = await axiosInterface('post', '/cpo/database/query', data)
    return response
  }

  const mongoAggregate = async (data) => {
    const response = await axiosInterface('post', '/cpo/database/aggregate', data)
    return response
  }

  const register_member = async (data) => {
    const response = await axiosInterface('post', '/accounts', data)
    return response
  }

  const get_account_info = async (role) => {
    const response = await axiosInterface('get' , '/accounts?role=' + role)
    return response
  }

  const get_account_detail = async (role, id) => {
    const response = await axiosInterface('get' , '/accounts/' + id + '?role=' + role) // Tony: App member ?
    return response
  }

  const edit_account = async (data) => {
    const response = await axiosInterface('patch', '/accounts', data)
    return response
  }

  const delete_account = async (params) => {
    const response = await axiosInterface('delete', '/accounts/' + params.id + '?role=' + params.role, '')
    return response
  }

  const get_user_payment = async (json) => {
    let path = '/accounts'
    if (json.id) {
      path += ('/' + json.id)
    }
    path += ('/payments?role=' + json.role)
    path += ('&start_date=' + json.start_date)
    path += ('&end_date=' + json.end_date)
    const response = await axiosInterface('get', path)
    return response
  }

  const get_user_cash = async (json) => {
    let path = '/accounts'
    if (json.id) {
      path += ('/' + json.id)
    }
    path += ('/cashs?role=' + json.role)
    path += ('&start_date=' + json.start_date)
    path += ('&end_date=' + json.end_date)
    const response = await axiosInterface('get', path)
    return response
  }

  const getTimeZone = async (lat, lng) => {
    const response = await axiosInterface('get', '/cpo/timezone?latitude=' + lat + '&longitude=' + lng)
    return response
  }

  const getCoordinates = async (addr) => {
    const response = await axiosInterface('get', '/cpo/address?address=' + addr)
    return response
  }

  const getAddress = async (lat, lng) => {
    const response = await axiosInterface('get',  '/cpo/address?latitude=' + lat + '&longitude=' + lng)
    return response
  }

  const bind_card = async () => {
    const response = await axiosInterface('get', '/payment/newebpay/bindingCard')
    return response
  }

  const search_bind_card = async () => {
    const response = await axiosInterface('get', '/payment/searchBindingCards')
    return response
  }

  const unregister_bind_card = async (json) => {
    const response = await axiosInterface('delete', '/payment/newebpay/unregisterBindingCard', json)
    return response
  }

  const auth_payment = async (json) => {
    const response = await axiosInterface('post', '/payment/newebpay/company/authPayment', json)
    return response
  }

  const subscribe_plan = async (json) => {
    const response = await axiosInterface('patch', '/cpo/company/subscribe/plan', json)
    return response
  }

  const member_modify = async (json) => {
    const response = await axiosInterface('patch', '/member/modify', json)
    return response
  }

  const forgotPW = async (json) => {
    const response = await axiosInterface('post', '/member/forgot/pw', json)
    return response
  }

  const add_rfid_data = async (json) => {
    const response = await axiosInterface('post', '/rfid', json)
    return response
  }

  const edit_rfid_data = async (json) => {
    const response = await axiosInterface('patch', '/rfid', json)
    return response
  }

  const delete_rfid_data = async (params) => {
    const response = await axiosInterface('delete', '/rfid?id=' + params.id + '&rfid=' + params.rfid, '')
    return response
  }

  const set_rfid_cash = async (json) => {
    const response = await axiosInterface('patch', '/rfid', json)
    return response
  }

  const get_paymentHistory = async (start_date, end_date) => {
    const response = await axiosInterface('get', '/payments' + '?start_date=' + start_date + '&end_date=' + end_date)
    return response
  }

  const get_cash = async (start_date, end_date) => {
    const response = await axiosInterface('get', '/cashs' + '?start_date=' + start_date + '&end_date=' + end_date)
    return response
  }
  
  const reset_evse = async (json) => {
    const response = await axiosInterface('post', '/cp/ocpp/v16/reset', json)
    return response
  }

  const updateFw = async (json) => {
    const response = await axiosInterface('post', '/cp/ocpp/v16/update_firmware', json)
    return response
  }

  const change_availability = async (json) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/change_availability', json)
    return response
  }

  const get_diagnostics = async (json) => {
    const response = await axiosInterface('get' + '/cp/ocpp/v16/get_diagnostics' +'?evse_id=' + json.evse_id + '&location=' + json.location)
    return response
  }
   
  const get_configuration = async (json) => {
    const response = await axiosInterface('get' + '/cp/ocpp/v16/get_configuration' +'?evse_id=' + json.evse_id)
    return response
  }

  const change_configuration = async (json) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/change_configuration', json)
    return response
  }

  const clear_charging_profile = async (json) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/clear_charging_profile', json)
    return response
  }

  const get_composite_schedule = async (evse_id, duration, chargingRateUnit) => {
    let path = '/cp/ocpp/v16/get_composite_schedule' +'?evse_id=' + evse_id + '&connectorId=1' + '&duration=' + duration
    if (chargingRateUnit) {
      path += '&chargingRateUnit=' + chargingRateUnit
    }
    const response = await axiosInterface('get' + path)
    return response
  }

  const set_charging_profile = async(data) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/set_charging_profile', data)
    return response
  }

  const remote_start_transaction = async (data) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/remote_start_transaction', data)
    return response
  }

  const remote_stop_transaction = async (data) => {
    const response = await axiosInterface('post' +'/cp/ocpp/v16/remote_stop_transaction', data)
    return response
  }
  
  const add_merchant = async (data) => {
    const response = await axiosInterface('get' + '/payment/newebpay/company/addMerchant' +'?merchantId=' + data.merchantId)
    return response
  }
  
  const sendNotification = async (data) => {
    const response = await axiosInterface('post' +'/cpo/notify/fcm', data)
    return response
  }

  const get_edoc = async(data) => {
    let response = undefined
    if (data.filename)
      response = await axiosInterface('get' + '/edoc?name=' + data.filename)
    else 
      response = await axiosInterface('get' + '/edoc')
    return response
  }

  const setToken = async (method, data) => {
    const companyName = data.name
    delete data.name
    const response = await axiosInterface(method + '/cpo/' + companyName + '/token', data)
    return response
  }

  return {
    setCollectionData, getToken, checkToken, mongoQuery, mongoAggregate,
    register_member, get_account_info, get_account_detail, edit_account, delete_account,
    resetPW, reset_evse, updateFw, getTimeZone, getCoordinates, getAddress,
    bind_card, search_bind_card, unregister_bind_card, auth_payment, subscribe_plan, member_modify,
    forgotPW, add_rfid_data, edit_rfid_data, delete_rfid_data, set_rfid_cash, 
    clear_charging_profile, get_composite_schedule, set_charging_profile,
    get_user_payment, get_user_cash, get_paymentHistory, get_cash, 
    change_availability, get_diagnostics, get_configuration, change_configuration, sendNotification,
    add_merchant, get_edoc, remote_start_transaction, remote_stop_transaction,
    setToken,
  }
}