import VueCookies from 'vue-cookies'
import axios from 'axios'

let AuthToken = null
let response = null
let api1 = ''
if (import.meta.env.VITE_API === undefined) {
  api1 = 'api10/api'
}
else {
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
      response = await axios.get(path, Token)
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  }

  const postJsonData = async function (path, data, Token,) {
    if (Token === undefined) {
      Token = {}
      Token.headers = {}
      Token.headers['X-Client-From'] = 'm-Cloud'
    }
    try {
      response = await axios.post(path, data, Token,)
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  }

  const patchJsonData = async function (path, data, Token) {
    try {
      Token.headers['X-Client-From'] = 'm-Cloud'
      response = await axios.patch(path, data, Token)
      return response
    } catch (error) {
      console.log(error)
      return error
    }
  }

  const delJsonData = async function (path, data1, Token) {
    try {
      const Token1 = Token.headers
      Token1['X-Client-From'] = 'm-Cloud'
      response = await axios.delete(path, { headers: Token1, data: data1 });
      return response
    } catch (error) {
      console.log(error)
      return error
    }
  }

  const setCollectionData = async function (method, collection, data) {
    AuthToken = VueCookies.get('AuthToken')
    const json = JSON.stringify(data)
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
    return response
  }

  const getToken = async function (userAccount) {
    const json = JSON.stringify(userAccount)
    const response = await postJsonData(api1 + '/member/login', json)
    if (response.status === 200) {
      AuthToken = { headers: { Authorization: response.data.token } }
      VueCookies.set('AuthToken', AuthToken, '14d')
    }
    return response
  }

  const checkToken = async function () {
    AuthToken = VueCookies.get('AuthToken')
    const response = await getJsonData(api1 + '/member/about', AuthToken)
    if (response.status === 200) {
      return response
    }
    else
      return 0
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
    const response = await postJsonData(api1 + '/member/register', json)
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

  return {
      setCollectionData, getToken, checkToken, mongoQuery, mongoAggregate,
      register_member,  resetPW, reset_evse, updateFw, getTimeZone, getCoordinates, getAddress,
      bind_card, search_bind_card, unregister_bind_card, auth_payment, subscribe_plan, member_modify
  }
}