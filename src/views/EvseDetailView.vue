<script setup>
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { useRoute, useRouter} from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import CommpnFunc from '@/composables/CommonFunc'
import {  ElMessageBox,ElMessage } from 'element-plus'
import msi from '@/assets/msi_style'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import { useI18n } from "vue-i18n"
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import tippy from 'tippy.js'
import "tippy.js/dist/tippy.css"
const { t } = useI18n()
const MStore = useMStore()
const route = useRoute()
const evseId = route.query.evse_id
const router = useRouter()
const MsiApi = ApiFunc()
const MsiFunc = CommpnFunc()
const evseData = reactive([])
const connectorData = reactive([])
const chargePointInfoData = reactive([])
const chargingValue = reactive({wh:0, V:0, A:0,systemTemp:0, start_date_time:0})
const hmiInfoData = reactive([])
const locationData = reactive([])
const tariffData = reactive([])
const tariff_elements = reactive([])
const activeName = ref('one')

let chargePoint_id = ''

const cp_config_core = {
AllowOfflineTxForUnknownId: undefined,
AuthorizationCacheEnabled: undefined,
AuthorizeRemoteTxRequests: undefined,
BlinkRepeat: undefined,
ClockAlignedDataInterval: undefined,
ConnectionTimeOut: undefined,
ConnectorPhaseRotation: undefined,
ConnectorPhaseRotationMaxLength: undefined,
GetConfigurationMaxKeys: undefined,
HeartbeatInterval: undefined,
LightIntensity: undefined,
LocalAuthorizeOffline: undefined,
LocalPreAuthorize: undefined,
MaxEnergyOnInvalidId: undefined,
MeterValuesAlignedData: undefined,
MeterValuesAlignedDataMaxLength: undefined,
MeterValuesSampledData: undefined,
MeterValuesSampledDataMaxLength: undefined,
MeterValueSampleInterval: undefined,
MinimumStatusDuration: undefined,
NumberOfConnectors: undefined,
ResetRetries: undefined,
StopTransactionOnEVSideDisconnect: undefined,
StopTransactionOnInvalidId: undefined,
StopTxnAlignedData: undefined,
StopTxnAlignedDataMaxLength: undefined,
StopTxnSampledData: undefined,
StopTxnSampledDataMaxLength: undefined,
SupportedFeatureProfiles: undefined,
SupportedFeatureProfilesMaxLength: undefined,
TransactionMessageAttempts: undefined,
TransactionMessageRetryInterval: undefined,
UnlockConnectorOnEVSideDisconnect: undefined,
WebSocketPingInterval: undefined,
}
const cp_config = reactive([])
const cp_config_backup = reactive([])
const dialog_title = ref('')
const chargingProfile_dialog_visible = ref(false)
const configuration_dialog_visible = ref(false)
const remote_dialog_visible = ref(false)
const chargingProfile_dialog_step = ref('one')
const chargingProfile_dialog_type = ref('')
const chargingProfile_dialog_data = reactive({})
const remote_transaction_title = ref(t('remote_start'))
const remote_transaction_data = reactive({})
let change_configuration_data = reactive([])

const get_composite_schedule_formRef  = ref()
const get_composite_schedule_rules = reactive({
  durationInput: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
})
const set_charging_profile_formRef  = ref()
const set_charging_profile_rules = reactive({
  set_charge_profile: [{ required: true, message: t('this_item_is_required'), trigger: 'change' },],
})

const clear_charging_profile_method = ref('')
const clear_charging_profile_formRef  = ref()
const validClearChargingProfile = (rule, value, callback) => {
  if (clear_charging_profile_method.value === '2') {
    if (value === undefined) {
      callback(new Error(t('this_item_is_required')))
    }
  }
  else if (clear_charging_profile_method.value === '3') {
    if (rule.field === 'clear_charge_profile_purpose' && value === undefined) {
      callback(new Error(t('this_item_is_required')))
    }
    if (rule.field === 'clear_charge_profile_stacklevel' && value === undefined) {
      callback(new Error(t('this_item_is_required')))
    }
  }
  callback()
}
const clear_charging_profile_rules = reactive({
  clear_charge_profile: [{ required: true, message: t('this_item_is_required'), trigger: 'change', validator: validClearChargingProfile },],
  clear_charge_profile_purpose: [{ required: true, message: t('this_item_is_required'), trigger: 'change', validator: validClearChargingProfile },],
  clear_charge_profile_stacklevel: [{ required: true, message: t('this_item_is_required'), trigger: 'blur', validator: validClearChargingProfile },],
})

const remote_transaction_formRef  = ref()
const remote_transaction_rules = reactive({
  id: [{ required: true, message: t('this_item_is_required'), trigger: 'blur'},],
  rfid_num: [{ required: true, message: t('this_item_is_required'), trigger: 'change' },],
})

const deleteEvse = () => {
  ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    let evse_id 
    if (locationData.name !== '') {
      let queryData = { database: 'OCPI', collection: 'EVSE',
                      pipelines: [ { $match: { uid: { UUID: evseId}}}, { $project: { _id: 1} }],
                  }
      let response = await MsiApi.mongoAggregate(queryData)
      evse_id = (response.data.result[0]._id)
    }
    let sendData = { class: 'EVSE', id: evseId, status: "REMOVED" }
    console.log(await MsiApi.setCollectionData('patch', 'ocpi', sendData))

    // sendData = { class : 'Connector', id : connectorData.id }
    // console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    if (locationData.name !== '') {
      let evseArr = locationData.evses
      evseArr = evseArr.filter(item => item !== evse_id)
      let sendData1 = { class : 'Location', id: locationData.id, evses : evseArr}
      console.log(await MsiApi.setCollectionData('patch', 'ocpi', sendData1))
    }

    // if(chargePointInfoData.hmi !== '' && chargePointInfoData.hmi !== null && chargePointInfoData.hmi !== undefined) { 
    //   sendData = { class : 'HMIControlBoardInfo', pk : chargePointInfoData.hmi }
    //   console.log(await MsiApi.setCollectionData('delete', 'cpo', sendData))
    // }

    sendData = { class: 'ChargePointInfo', pk: chargePoint_id, hmi: "" }
    console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))


    router.back(-1)
  })
}
const edit = () => {
  router.push({ name: 'evseEdit', query: {station_id:locationData.id, evse_id:evseId} })
}

const openChargingProfileDialog = (value) => {
  chargingProfile_dialog_visible.value = true
  chargingProfile_dialog_type.value = value
  chargingProfile_dialog_step.value = 'one'
  if (value === 'get') {
    dialog_title.value = t('get_composite_schedule')
    chargingProfile_dialog_data.durationInput = undefined
    chargingProfile_dialog_data.get_charge_rate_unit = undefined
    get_composite_schedule_formRef.value?.resetFields()
  }
  else if (value === 'set') {
    dialog_title.value = t('set_charging_profile')
    chargingProfile_dialog_data.set_charge_profile_purpose = undefined
    chargingProfile_dialog_data.set_charge_profile = undefined
    set_charging_profile_formRef.value?.resetFields()
    chargingProfile_dialog_data.filter_charge_profile_options = []
    AllChargingProfileData.forEach((item) => {
      chargingProfile_dialog_data.filter_charge_profile_options.push(item)
    })
  }
  else if (value === 'clear') {
    dialog_title.value = t('clear_charging_profile')
    chargingProfile_dialog_data.clear_charge_profile = undefined
    chargingProfile_dialog_data.clear_charge_profile_purpose = undefined
    chargingProfile_dialog_data.clear_charge_profile_stacklevel = undefined
    chargingProfile_dialog_data.filter_charge_profile_options = []
    AllChargingProfileData.forEach((item) => {
      chargingProfile_dialog_data.filter_charge_profile_options.push(item)
    })
  }
}
const confirmChargingProfileDialog = async(value) => {
  if (value === 'get') {
    await get_composite_schedule_formRef.value.validate((valid) => {
      if (valid === true) {
        chargingProfile_dialog_step.value = 'two'
        getCompositeSchedule()
      }
    })
  }
  else if (value === 'set') {
    await set_charging_profile_formRef.value.validate((valid) => {
      if (valid === true) {
        setChargeProfile()
      }
    })
  }
  else if (value === 'clear') {
    await clear_charging_profile_formRef.value.validate((valid) => {
      if (valid === true) {
        clearChargingProfile()
      }
    })
  }
}
const filterChargeProfilePurpose = (value) => {
  chargingProfile_dialog_data.set_charge_profile = undefined
  chargingProfile_dialog_data.filter_charge_profile_options = []
  AllChargingProfileData.forEach((item) => {
    if (item.charging_profile_purpose === value) {
      chargingProfile_dialog_data.filter_charge_profile_options.push(item)
    }
  })
}

const openConfigurationDialog = async() => {
  change_configuration_data = []
  dialog_title.value = t('configuration')
  await getConfiguration()
}
const editConfiguration = (value, index) => {
  cp_config[index].modify = true
  for (let i=0; i<change_configuration_data.length; i++) {
    if (change_configuration_data[i].key === cp_config[index].key) {
      if (cp_config_backup[index].value === cp_config[index].value) {
        change_configuration_data.splice(i, 1);
        cp_config[index].modify = false
      }
      else {
        change_configuration_data[i].value = cp_config[index].value.toString()
      }
      return
    }
  }
  change_configuration_data.push({key:cp_config[index].key, readonly:cp_config[index].readonly, value:value.toString()})
}
const confirmConfigurationDialog = async () => {
  for (let i=0; i<change_configuration_data.length; i++) {
    let sendData = {
      evse_id: evseData.evse_id,
      key: change_configuration_data[i].key,
      value: change_configuration_data[i].value
    }
    const response = await MsiApi.change_configuration(sendData)
    if (response.status !== 200 || response.data.message === 'Rejected') {
      ElMessage.error(`faile in ${change_configuration_data[i].key}`)
      return
    }
  }
  configuration_dialog_visible.value = false
  ElMessage.success('Success')
}

const remoteTransaction = async() => {
  if (remote_transaction_title.value === t('remote_start')) {
    remote_dialog_visible.value = true
    remote_transaction_data.name = undefined
    remote_transaction_data.rfid_num = undefined
    remote_transaction_data.rfid_list = {}
    remote_transaction_formRef.value?.resetFields()
  }
  else if (remote_transaction_title.value === t('remote_stop')) {
    await confirmRemoteTransaction()
  }
}
const filterRemoteRfid = async() => {
  let queryData = {
    database: 'CPO',
    collection: 'RFIDUserData',
    pipelines: [
      { $match: { $and: [{tag_id: {$eq: remote_transaction_data.id}}, {byCompany: {ObjectId:chargePointInfoData.byCompany}}] } },
      { $project: { _id: 1, rfids: 1 } }
    ],
  }
  let response = await MsiApi.mongoAggregate(queryData)

  if(response.data.result.length === 0 || response.data.result[0]?.rfids.length === 0){
    ElMessage.error(t(`please_bind_rfid_num`))
  }
  remote_transaction_data.rfid_list = {}
  remote_transaction_data.rfid_num = undefined
  if (response.data?.result[0]?.rfids) {
    Object.assign(remote_transaction_data.rfid_list, response.data?.result[0]?.rfids)
  }
}
let interval = undefined
let interval1 = undefined
let retry = 3 

const check_uploaded  = async () => {
  let queryData = { database: 'CPO', collection: 'ChargePointInfo', pipelines: [{ $match: {evse_id:evseData.evse_id},},{ $project: { _id: 0 } }]}
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.data.result?.[0]?.ocpp_info?.[0]?.statusNotification?.diagnosticsStatus === "Uploaded") {
    let evseId_replace = evseData.evse_id.replace(/[^a-zA-Z0-9]/g, '_')
    let fileName = 'cs_logs_' + evseId_replace
    window.location.href = 'https://storage.googleapis.com/msi-hmi-logs/' + fileName + '.zip'
    clearInterval(interval)
  }
  else {
    retry--
    if (retry === 0) {
      clearInterval(interval) 
      ElMessage.error('download fail')
    }
  }
}


const getDiagnostics = async () => {

  ElMessageBox.confirm(t('do_you_want_to_get_diagnostics'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    
    let response = await MsiApi.get_diagnostics({ evse_id: evseData.evse_id, location: "https://storage.googleapis.com/msi-hmi-logs/"})
    console.log(response)
    if (response.status === 200) {
      interval = setInterval(check_uploaded, 5000) 
    }
    else {
      ElMessage.error(response.data.message)
    }

  })
}

const getConfiguration = async () => {
  ElMessageBox.confirm(t('do_you_want_to_get_configuration'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    const response = await MsiApi.get_configuration(evseData.evse_id)
    console.log(123, response)
    if (response.status === 200) {
      cp_config.length = 0
      Object.assign(cp_config, response.data.configurationKey)
      configuration_dialog_visible.value = true
      cp_config.forEach((item) => {
        if (item.value.toString() === 'false') {
          item.value = false
        }
        else if (item.value.toString() === 'true') {
          item.value = true
        }
      })
      cp_config_backup.length = 0
      Object.assign(cp_config_backup, cp_config)
    }
    else 
      ElMessage.error(response.data.message)
  })
  
}

const clearChargingProfile = async () => {
  chargingProfile_dialog_visible.value = false
  ElMessageBox.confirm(t('do_you_want_to_clear_charging_profile'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    let clear_connectorId = 1
    if (clear_charging_profile_method.value === '1') {
      clear_connectorId = undefined
      chargingProfile_dialog_data.clear_charge_profile = undefined
      chargingProfile_dialog_data.clear_charge_profile_purpose = undefined
      chargingProfile_dialog_data.clear_charge_profile_stacklevel = undefined
    }
    else if (clear_charging_profile_method.value === '2') {
      chargingProfile_dialog_data.clear_charge_profile_purpose = undefined
      chargingProfile_dialog_data.clear_charge_profile_stacklevel = undefined
    }
    else if (clear_charging_profile_method.value === '3') {
      chargingProfile_dialog_data.clear_charge_profile = undefined
    }
    let sendData = {
      evse_id: evseData.evse_id,
      id: chargingProfile_dialog_data.clear_charge_profile,
      connectorId: clear_connectorId,
      chargingProfilePurpose: chargingProfile_dialog_data.clear_charge_profile_purpose ,
      stackLevel: chargingProfile_dialog_data.clear_charge_profile_stacklevel,
    }
    MsiFunc.deleteEmptyKeys(sendData)
    let res = await MsiApi.clear_charging_profile(sendData)
    if (res.data.message !== null && res.data.message.status === 'Accepted') {
      ElMessage.success('Success')
    }
    else {
      ElMessage.error(t('error'))
    }
  })
}

const setChargeProfile = async() => {
  let set_charge_profile_obj = {}
  let queryData = {
    database: 'CPO', 
    collection: 'ChargingProfile', 
    pipelines: [
      { $match: { _id: { $eq: {"ObjectId": chargingProfile_dialog_data.set_charge_profile}}}},
      { $project: { aaa: 0} }
    ]}
  let response = await MsiApi.mongoAggregate(queryData)
  Object.assign(set_charge_profile_obj, response.data.result[0])
  let chargingProfileData = {}
  if (set_charge_profile_obj.charging_profile_purpose === 'TxProfile') {
    queryData = {
      database: 'CPO', 
      collection: 'ChargePointInfo', 
      pipelines: [
        { $match: { evse_id: { $eq: evseData.evse_id}}},
        { $project: { ocpp_info: 1} }
      ]}
    response = await MsiApi.mongoAggregate(queryData)
    chargingProfileData.transactionId = response.data.result[0].ocpp_info[0].transactionId
  }
  chargingProfileData.chargingProfileId = set_charge_profile_obj.charging_profile_id
  chargingProfileData.stackLevel = set_charge_profile_obj.stack_level
  chargingProfileData.chargingProfilePurpose = set_charge_profile_obj.charging_profile_purpose
  chargingProfileData.chargingProfileKind = set_charge_profile_obj.charging_profile_kind
  chargingProfileData.recurrencyKind = set_charge_profile_obj.recurrency_kind
  if (set_charge_profile_obj.valid_from)
    chargingProfileData.validFrom = new Date(new Date(set_charge_profile_obj.valid_from).getTime() + ((MStore.timeZoneOffset ) * -60000))
  if (set_charge_profile_obj.valid_to)
    chargingProfileData.validTo = new Date(new Date(set_charge_profile_obj.valid_to).getTime() + ((MStore.timeZoneOffset ) * -60000))
  chargingProfileData.chargingSchedule = {}
  chargingProfileData.chargingSchedule.duration = set_charge_profile_obj.charging_schedule.duration
  if (set_charge_profile_obj.charging_schedule.start_schedule)
    chargingProfileData.chargingSchedule.startSchedule = new Date(new Date(set_charge_profile_obj.charging_schedule.start_schedule).getTime() + ((MStore.timeZoneOffset ) * -60000))
  chargingProfileData.chargingSchedule.minChargingRate = set_charge_profile_obj.charging_schedule.min_charging_rate
  chargingProfileData.chargingSchedule.chargingRateUnit = set_charge_profile_obj.charging_schedule.charging_rate_unit
  chargingProfileData.chargingSchedule.chargingSchedulePeriod = []
  set_charge_profile_obj.charging_schedule.charging_schedule_period.forEach((item) => {
    chargingProfileData.chargingSchedule.chargingSchedulePeriod.push({
      startPeriod: item.start_period,
      limit: item.limit,
      numberPhases: item.number_phases,
    })
  })

  MsiFunc.deleteEmptyKeys(chargingProfileData)
  console.log(chargingProfileData)

  chargingProfile_dialog_visible.value = false
  ElMessageBox.confirm(t('do_you_want_to_set_charging_profile'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    let sendData = {
      evse_id: evseData.evse_id,
      connectorId: 1,
      csChargingProfiles: chargingProfileData,
    }
    let res = await MsiApi.set_charging_profile(sendData)
    if (res.data.message !== null) {
      ElMessage.success('Success')
    }
    else {
      ElMessage.error(t('error'))
    }
  })
}

const getCompositeSchedule = async () => {
  chargingProfile_dialog_visible.value = false
  ElMessageBox.confirm(t('do_you_want_to_get_composite_schedule'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    let res = await MsiApi.get_composite_schedule(evseData.evse_id, chargingProfile_dialog_data.durationInput, chargingProfile_dialog_data.get_charge_rate_unit)
    if (res.status === 200) {
      chargingProfile_dialog_visible.value = true
      Object.assign(chargingProfile_dialog_data, res.data.message)
      let localEndTime = new Date(chargingProfile_dialog_data?.charging_schedule?.start_schedule).getTime()
      chargingProfile_dialog_data.start_schedule_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss")) 
    }
    else {
      ElMessage.error(res.data.status)
    }
  })
}


const changeAvailability = async () => {
  ElMessageBox.confirm(t('do_you_want_to_change_availability'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    let change_type = "Inoperative"
    if (evseData.status === 'INOPERATIVE') {
    change_type = 'Operative'
  }
    let sendData = {
      evse_id: evseData.evse_id,
      connectorId: "1",
      type: change_type
    }
    console.log(await MsiApi.change_availability(sendData))
  })
}

const confirmRemoteTransaction = async() => {
  if (remote_transaction_title.value === t('remote_start')) {
    await remote_transaction_formRef.value.validate((valid) => {
      if (valid === true) {
        remote_dialog_visible.value = false
        ElMessageBox.confirm(t('do_you_want_to_remote_start_transaction'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
        .then(async () => {
          let sendData = {
            evse_id: evseData.evse_id,
            connector: 1,
            idTag: remote_transaction_data.rfid_num,
          }
          let res = await MsiApi.remote_start_transaction(sendData)
          if (res.data.message !== null && res.data.message === 'Accepted') {
            ElMessage.success('Success')
          }
          else {
            ElMessage.error(t('error'))
          }
        })
      }
    })
  }
  else if (remote_transaction_title.value === t('remote_stop')) {
    ElMessageBox.confirm(t('do_you_want_to_remote_stop_transaction'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
      let queryData = {
        database: 'CPO',
        collection: 'ChargePointInfo',
        pipelines: [
          { $match: { evse_id: {$eq: evseData.evse_id}} },
          { $project: { _id: 1, ocpp_info: 1 } }
        ],
      }
      let response = await MsiApi.mongoAggregate(queryData)
      let sendData = {
        evse_id: evseData.evse_id,
        transactionId: response.data.result[0].ocpp_info[0].transactionId,
      }
      await MsiApi.remote_stop_transaction(sendData)
    })
  }
}

const getRealTimeEvseInfo = async () => {
  let localStartTime 
  let queryData = { database: "OCPI", collection: "EVSE", 
      pipelines: [ { $match:  { uid: { UUID: evseId}} }, 
      { $project: {  byCompany: 0 } }]
    }
  let response = await MsiApi.mongoAggregate(queryData)
  Object.assign(evseData, response.data.result[0]) 

  let localEndTime =  new Date( (new Date(evseData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  evseData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  remote_transaction_title.value = t('remote_start')
  switch (evseData.status) {
    case 'AVAILABLE':
      evseData.status_str = t('available')
    break
    case 'CHARGING':
      remote_transaction_title.value = t('remote_stop')
      evseData.status_str = t('charging')
      queryData = { "database": 'CPO', "collection": 'ChargePointInfo', 
      "pipelines": [{ $match: { "evse_id": evseData.evse_id } },  
      { $project: { ocpp_info: 1, sessions:1} }]
    }
      response = await MsiApi.mongoAggregate(queryData)
      chargingValue.wh = response.data.result[0].ocpp_info[0].meterValues.wh
      chargingValue.A = response.data.result[0].ocpp_info[0].meterValues.A
      chargingValue.V = response.data.result[0].ocpp_info[0].meterValues.V
      chargingValue.systemTemp = response.data.result[0].ocpp_info[0].meterValues.systemTemp

      queryData = { "database": 'OCPI', "collection": 'Session', 
      "pipelines": [
      { $match:  { "_id": {"ObjectId": response.data.result[0].sessions[0] } }},  
      { $project: { start_date_time: 1} }]
    }
      response = await MsiApi.mongoAggregate(queryData)      
      localStartTime = new Date( (new Date(response.data.result[0].start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      chargingValue.start_date_time = (moment(localStartTime).format("YYYY-MM-DD HH:mm:ss"))
    break
    case 'UNKNOWN':
      evseData.status_str = t('offline')
    break
    case 'OUTOFORDER':
      evseData.status_str = t('error')
    break
    case 'INOPERATIVE':
      evseData.status_str = t('inoperative')
    break
    default:
      evseData.status_str = t('others')
  }
}

// FullCalendar ---------------------------------------------------------------
const displaySwitch = ref(false)
const chargingCalendarRef = ref()
const parkingCalendarRef = ref()
const tariffObj = reactive([])
const charging_bgColor = '#61a8d8'
const parking_bgColor = '#94eadb'

const fillFullCalendar = () => {
  tariffObj.length = 0
  Object.assign(tariffObj, tariffData.elements)

  chargingCalendarOptions.events = []
  parkingCalendarOptions.events = []

  let price_excl_str = ''
  let price_incl_str = ''
  let startTime = ''
  let endTime = ''
  let daysOfWeek = []
  let chargingCount = 0
  let parkingCount = 0

  for (let i=0; i<tariffObj.length; i++) {
    for (let j=0; j<tariffObj[i]?.restrictions?.day_of_week?.length; j++) {
      if (tariffObj[i].restrictions.day_of_week[j] === 'MONDAY') daysOfWeek.push('1')
      if (tariffObj[i].restrictions.day_of_week[j] === 'TUESDAY') daysOfWeek.push('2')
      if (tariffObj[i].restrictions.day_of_week[j] === 'WEDNESDAY') daysOfWeek.push('3')
      if (tariffObj[i].restrictions.day_of_week[j] === 'THURSDAY') daysOfWeek.push('4')
      if (tariffObj[i].restrictions.day_of_week[j] === 'FRIDAY') daysOfWeek.push('5')
      if (tariffObj[i].restrictions.day_of_week[j] === 'SATURDAY') daysOfWeek.push('6')
      if (tariffObj[i].restrictions.day_of_week[j] === 'SUNDAY') daysOfWeek.push('0')
    }
    price_excl_str = tariffObj[i].price_components[0].price
    price_incl_str = tariffObj[i].price_components[0].price_incl
    startTime = tariffObj[i].restrictions.start_time
    endTime = tariffObj[i].restrictions.end_time
    if (endTime === '00:00')
      endTime = '23:59'
    if (tariffObj[i].price_components[0].type === 'ENERGY') {
      let event_title = 'title'
      let elements_index = i
      chargingCalendarOptions.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, title: event_title, index: elements_index,
        borderColor: setEventBgColor(charging_bgColor, chargingCount),
        shortTitle: overEventHeight(startTime, endTime),
        extendedProps: {
          // price_str: '$' + price_excl_str + ` ($${price_incl_str})` + ' /' + t('kwh'),
          price_excl: '$' + price_excl_str + ' /' + t('kwh'),
          price_incl: '$' + price_incl_str + ' /' + t('kwh'),
          time: startTime + ' - ' + endTime,
          price: tariffObj[i].price_components[0].price + ' / ' + t('kwh')
        }
      })
      chargingCount++
    }
    else if (tariffObj[i].price_components[0].type === 'TIME') {
      let event_title = 'title'
      let elements_index = i
      chargingCalendarOptions.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, title: event_title, index: elements_index,
        borderColor: setEventBgColor(charging_bgColor, chargingCount),
        shortTitle: overEventHeight(startTime, endTime),
        extendedProps: {
          // price_str: '$' + price_excl_str + ` ($${price_incl_str})` + ' /' + t('hr'),
          price_excl: '$' + price_excl_str + ' /' + t('hr'),
          price_incl: '$' + price_incl_str + ' /' + t('hr'),
          time: startTime + ' - ' + endTime,
          price: (tariffObj[i].price_components[0].price / (3600 / tariffObj[i].price_components[0].step_size)).toFixed(2)
            + ' / ' + tariffObj[i].price_components[0].step_size / 60 + t('min')
        }
      })
      chargingCount++
    }
    else if (tariffObj[i].price_components[0].type === 'PARKING_TIME') {
      let event_title = 'title'
      let elements_index = i
      parkingCalendarOptions.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, title: event_title, index: elements_index,
        borderColor: setEventBgColor(parking_bgColor, parkingCount),
        shortTitle: overEventHeight(startTime, endTime),
        extendedProps: {
          // price_str: '$' + price_excl_str + ` ($${price_incl_str})` + ' /' + t('hr'),
          price_excl: '$' + price_excl_str + ' /' + t('hr'),
          price_incl: '$' + price_incl_str + ' /' + t('hr'),
          time: startTime + ' - ' + endTime,
          price:  (tariffObj[i].price_components[0].price / (3600 / tariffObj[i].price_components[0].step_size)).toFixed(2)
            + ' / ' + tariffObj[i].price_components[0].step_size / 60 + t('min')
        }
      })
      parkingCount++
    }
    startTime = ''
    endTime = ''
    daysOfWeek = []
  }
}
const overEventHeight = (startTimeStr, endTimeStr) => {
  let rowHeight = 24;
  let startTime = parseInt(startTimeStr?.split(':')[0])*60 + parseInt(startTimeStr?.split(':')[1])
  let endTime = parseInt(endTimeStr?.split(':')[0])*60 + parseInt(endTimeStr?.split(':')[1])
  let eventHeight = (endTime - startTime) / 120 * rowHeight
  if (eventHeight < 5 * rowHeight) {
    return true
  }
  return false
}
const handleEventMouseEnter = (info) => {
  let index = info.event._def.extendedProps.index
  let type_str = tariffObj[index].price_components[0].type_str
  let vat_str = tariffObj[index].price_components[0].vat
  let step_size_str = ''  // tariffObj[index].price_components[0].step_size
  let price_excl_vat_str = tariffObj[index].price_components[0].price
  let price_incl_vat_str = tariffObj[index].price_components[0].price_incl  // price * (1 + vat_str / 100)
  let min_duration_str = tariffObj[index].restrictions.min_duration / 60
  let max_duration_str = tariffObj[index].restrictions.max_duration / 60
  let unit = ''
  let duration_content = ''

  switch (tariffObj[index].price_components[0].type) {
    case 'ENERGY' :
      step_size_str = tariffObj[index].price_components[0].step_size
      unit = t('kwh')
      break
    case 'TIME' :
      step_size_str = tariffObj[index].price_components[0].step_size / 60
      unit = t('min')
      break
    case 'PARKING_TIME' :
      step_size_str = tariffObj[index].price_components[0].step_size / 60
      unit = t('min')
      duration_content = 
      `
        ${t('active_minute')}: 
        ${min_duration_str}
        <br>
        ${t('deactivate_minute')}: 
        ${max_duration_str}
      `
      break
    default:
      break
  }
  
  tippy(info.el, {
    content:
    `
    <div style='padding:5px; font-size:14px; border-radius: 0.5rem;'>
    ${t('type')}: 
    ${type_str}
    <br>
    ${t('price_excl_vat')}: $
    ${price_excl_vat_str}
    <br>
    ${t('price_incl_vat')}: $
    ${price_incl_vat_str}
    <br>
    ${t('vat')}: 
    ${vat_str}%
    <br>
    ${t('unit')}: 
    ${step_size_str}
    ${unit}
    <br>
    ${duration_content}
    `,
    interactive: false,
    allowHTML: true,
    placement: 'right',
    arrow: true,
    duration: 0,
  })
}
const handleEventContent = (arg) => {
  let content = '<div style="width: fit-content; margin: auto;">'
  let startTimeStr = arg.timeText.split(' - ')[0]
  let endTimeStr = arg.timeText.split(' - ')[1]

  if (endTimeStr === undefined) {
    endTimeStr = '23:59'
  }
  if (startTimeStr.split(':')[0] === '24') {
    arg.timeText = '00:' + startTimeStr.split(':')[1] + ' - ' + endTimeStr
  }

  if (arg.event.extendedProps.shortTitle) {
    content = content + arg.timeText 
  }
  else {
    // content = content + arg.event.extendedProps.price_str + '<br><br>'
    content = content + t('price_excl_vat') + '<br>' + arg.event.extendedProps.price_excl + '<br><br>'
    content = content + t('price_incl_vat') + '<br>' + arg.event.extendedProps.price_incl + '<br><br>'
    content = content + arg.timeText + '<br>'
  }
  content = content + '</div>'
  
  return {
    html:`${content}`
  }
}
const setEventBgColor = (bgColor, count) => {
  let r = parseInt(bgColor.split('#')[1].substr(0,2), 16)
  let g = parseInt(bgColor.split('#')[1].substr(2,2), 16)
  let b = parseInt(bgColor.split('#')[1].substr(4,2), 16)
  r += 35 * count
  g += 35 * count
  b += 35 * count
  if (r > 255)  r = r % 256
  if (g > 255)  g = g % 256
  if (b > 255)  b = b % 256
  bgColor = '#' + r.toString(16) + g.toString(16) + b.toString(16)
  return bgColor
}
const chargingCalendarOptions = reactive({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  height: 'auto',
  initialView: 'timeGridWeek',
  editable: false,
  selectMirror: false,
  selectable: false,
  selectOverlap: false,
  allDaySlot: false,
  firstDay: 1,
  headerToolbar: false,
  slotMinTime: '00:00',
  slotMaxTime: '24:00',
  slotDuration: '02:00:00',
  slotLabelFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },
  slotLabelContent: info => info.text.replace(/24:00/g, '00:00'),
  dayHeaderFormat: {
    weekday: 'short'
  },
  eventTimeFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },
  
  events: [],
  eventClassNames: ['mfc-event'],
  eventColor: '#fff',
  eventTextColor: '#000',
  slotEventOverlap: false,    // 事件不重疊
  eventContent: handleEventContent,
  eventMouseEnter: handleEventMouseEnter,
})
const parkingCalendarOptions = reactive({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  height: 'auto',
  initialView: 'timeGridWeek',
  editable: false,
  selectMirror: false,
  selectable: false,
  selectOverlap: false,
  allDaySlot: false,
  firstDay: 1,
  headerToolbar: false,
  slotMinTime: '00:00',
  slotMaxTime: '24:00',
  slotDuration: '02:00:00',
  slotLabelFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },
  slotLabelContent: info => info.text.replace(/24:00/g, '00:00'),
  dayHeaderFormat: {
    weekday: 'short'
  },
  eventTimeFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },

  events: [],
  eventClassNames: ['mfc-event'],
  eventColor: '#fff',
  eventTextColor: '#000',
  slotEventOverlap: false,
  eventContent: handleEventContent,
  eventMouseEnter: handleEventMouseEnter,
})

// ChargingProfile ---------------------------------------------------------------
const AllChargingProfileData = reactive([])
const EVSEChargingProfileData = reactive([])
const charging_profile = reactive({})
const charging_schedule = reactive({})
const charging_schedule_period = reactive([])
const chargingProfilePurpose = [
  { value: 'ChargePointMaxProfile', label: t('charge_point_max_profile')},
  { value: 'TxDefaultProfile', label: t('tx_default_profile')},
  { value: 'TxProfile', label: t('tx_profile')},
]
const chargingRateUnit = [
  { value: 'W', label: 'W'},
  { value: 'A', label: 'A'},
]
const changeDisplayProfile = (index) => {
  for (let i=0; i<EVSEChargingProfileData.length; i++) {
    if (EVSEChargingProfileData[i].charging_profile_purpose === chargingProfilePurpose[index].value) {
      Object.assign(charging_profile, EVSEChargingProfileData[i])
      Object.assign(charging_schedule, EVSEChargingProfileData[i].charging_schedule)
      Object.assign(charging_schedule_period, EVSEChargingProfileData[i].charging_schedule.charging_schedule_period)
      return
    }
  }
  for (let key in charging_profile) {
    charging_profile[key] = undefined
  }
  for (let key in charging_schedule) {
    charging_schedule[key] = undefined
  }
  charging_schedule_period.length = 0
}
const getCharging_profile = async() => {
  let queryData = null
  let response = null
  queryData = {
    database: 'CPO',
    collection: 'ChargingProfile',
    pipelines: [{ $project: { aaa: 0} }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  Object.assign(AllChargingProfileData, response.data.result)

  let sample_id = [{_id: '6541f4a9037ef078b00aba67'}, {_id: '6541f530037ef078b00aba6a'}]  // Tony
  AllChargingProfileData.forEach((item) => {
    for (let i=0; i<sample_id.length; i++) {
      item.name = item.custom?.name
      if (item._id === sample_id[i]._id) {
        let localEndTime = null
        if (item.valid_from) {
          localEndTime =  new Date( (new Date(item.valid_from).getTime()) + ((MStore.timeZoneOffset ) * -60000))
          item.valid_from_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
        }
        if (item.valid_to) {
          localEndTime =  new Date( (new Date(item.valid_to).getTime()) + ((MStore.timeZoneOffset ) * -60000))
          item.valid_to_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
        }
        if (item.charging_schedule.start_schedule) {
          localEndTime =  new Date( (new Date(item.charging_schedule.start_schedule).getTime()) + ((MStore.timeZoneOffset ) * -60000))
          item.charging_schedule.start_schedule_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
        }
        switch (item.charging_profile_purpose) {
          case 'ChargePointMaxProfile':
            item.charging_profile_purpose_str = t('charge_point_max_profile')
            break;
          case 'TxDefaultProfile':
            item.charging_profile_purpose_str = t('tx_default_profile')
            break;
          case 'TxProfile':
            item.charging_profile_purpose_str = t('tx_profile')
            break;
          default:
            item.charging_profile_purpose_str = item.charging_profile_purpose
            break;
        }
        switch (item.charging_profile_kind) {
          case 'Absolute':
            item.charging_profile_kind_str = t('absolute')
            break;
          case 'Recurring':
            item.charging_profile_kind_str = t('recurring')
            break;
          case 'Relative':
            item.charging_profile_kind_str = t('relative')
            break;
          default:
            item.charging_profile_kind_str = item.charging_profile_kind
            break;
        }
        switch (item.recurrency_kind) {
          case 'Daily':
            item.recurrency_kind_str = t('daily')
            break;
          case 'Weekly':
            item.recurrency_kind_str = t('weekly')
            break;
          default:
            item.recurrency_kind_str = item.recurrency_kind
            break;
        }
        EVSEChargingProfileData.push(item)
      }
    }
  })
  changeDisplayProfile(0)
}

onMounted( async () => {
  interval1 = setInterval(getRealTimeEvseInfo, 10000) 
  await getRealTimeEvseInfo()
  let queryData
  let response
  let localEndTime
  
  queryData = { database: "OCPI", collection: "Connector", 
      pipelines: [ { $match: { "_id": { "ObjectId" : evseData?.connectors?.[0]}} }, 
      { $project: {  byCompany: 0 } }]
    }
  response = await MsiApi.mongoAggregate(queryData)

  Object.assign(connectorData, response.data.result[0])
  if (connectorData.standard === 'IEC_62196_T1') 
    connectorData.type_str = 'Type 1 (J1772)'
  else if (connectorData.standard === 'IEC_62196_T2')
    connectorData.type_str = 'Tyep 2 (Mennekes)' 
  else
    connectorData.type_str = t('others')
  
  localEndTime =  new Date( (new Date(connectorData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  connectorData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  
  queryData = { database: "CPO", collection: "ChargePointInfo", 
      pipelines: [ { $match: { "evse": { "ObjectId" : evseData?._id}} }, 
      { $project: {  byCompany11: 0 } }]
    }
  response = await MsiApi.mongoAggregate(queryData)
  if (response.data.result.length !== 0) {
    chargePoint_id = response.data.result[0]._id
    Object.assign(chargePointInfoData,response.data.result[0])
    hmiInfoData.max_amperage = 0
    if(chargePointInfoData.hmi !== '') {
      queryData = { database: "CPO", collection: "HMIControlBoardInfo", 
        pipelines: [ { $match:  { "_id": { "ObjectId" : chargePointInfoData?.hmi}} }, 
        { $project: {  byCompany: 0 } }]
      }
      response = await MsiApi.mongoAggregate(queryData)

      Object.assign(hmiInfoData, response.data.result[0])    
      if (hmiInfoData.minmax_current)
        hmiInfoData.max_amperage = (hmiInfoData.minmax_current.split(" ").map(hex => parseInt(hex, 16)))[7]
    }
  }
  queryData = { database: "OCPI", collection: "Location", 
      pipelines: [ { $match: { "evses" : {"$in": [  {"ObjectId" : evseData?._id }]} } }, 
      { $project: {  byCompany: 0 } }]
    }
  response = await MsiApi.mongoAggregate(queryData)

  if (response.data.result.length === 0) {
    if(locationData.name === undefined)
      locationData.name = ''
    if(locationData.country === undefined)
      locationData.country = ''
    if(locationData.city === undefined)
      locationData.city = ''
    if(locationData.city1 === undefined)
      locationData.city1 = ''
    if(locationData.address === undefined)
      locationData.address = ''
    if(locationData.address1 === undefined)
      locationData.address1 = ''
  }
  else {
    Object.assign(locationData, response.data.result[0])
  }
  console.log(locationData)
  const addr_parts = locationData.address.split('\n')
  const city_parts = locationData.city.split('\n')
  if (addr_parts.length === 2) {
    locationData.address = addr_parts[0]
    locationData.address1 = addr_parts[1]
  }
  if (city_parts.length === 2) {
    locationData.city = city_parts[0]
    locationData.city1 = city_parts[1]
  }

  queryData = { database: 'OCPI', collection: 'Tariff',
                      pipelines: [ { $match: { id: { UUID: connectorData.tariff_ids?.[0]}}}, 
                      { $project: { _id: 0, byCompany:0, last_updated:0, type:0, id:0, country_code:0, party_id:0} }],
                  }
  response = await MsiApi.mongoAggregate(queryData)
  Object.assign(tariffData, response.data.result[0])
  tariffData.name = tariffData.custom?.name
  tariffData.description = tariffData.custom?.description
  
  Object.assign(tariff_elements, tariffData.elements )
  
  tariff_elements.forEach((item)=> {
    if(!item?.restrictions?.day_of_week) return
    let day_of_week_str = []
    for (const day of item.restrictions.day_of_week) {
      switch (day) {
        case 'MONDAY':
          day_of_week_str.push(t('mon'))
        break
        case 'TUESDAY':
          day_of_week_str.push(t('tue'))
        break
        case 'WEDNESDAY':
          day_of_week_str.push(t('wed'))
        break
        case 'THURSDAY':
          day_of_week_str.push(t('thu'))
        break
        case 'FRIDAY':
          day_of_week_str.push(t('fri'))
        break
        case 'SATURDAY':
          day_of_week_str.push(t('sat'))
        break
        case 'SUNDAY':
          day_of_week_str.push(t('sun'))
        break
      }
    }
    item.restrictions.day_of_week_str = day_of_week_str
    item.price_components[0].price_incl = item.price_components[0].price *  (1 + (item.price_components[0].vat / 100))
    switch (item.price_components[0].type) {
      case 'ENERGY' :
        item.price_components[0].type_str = t('charging_by_energy')
        item.step_size_str = item.price_components[0].step_size
        break
      case 'TIME' :
        item.price_components[0].type_str = t('charging_by_time')
        item.step_size_str = item.price_components[0].step_size / 60
        break
      case 'PARKING_TIME' :
        item.price_components[0].type_str = t('parking_by_time')
        item.step_size_str = item.price_components[0].step_size / 60
        item.restrictions_min_duration_str = item.restrictions.min_duration / 60
        item.restrictions_max_duration_str = item.restrictions.max_duration / 60
        break
      default:
        item.price_components[0].type_str = item.price_components[0].type
    }
  })
  fillFullCalendar()
  getCharging_profile()
})


onUnmounted(() => {
  clearInterval(interval) 
  clearInterval(interval1) 
})

</script>

<template>
  <div class="evse-detail">
    <div class="evse-detail-header pt-40px pb-40px bg-white">
      <div class="container lg">
        <el-row :gutter="0">
          <el-col class="el-col" :xs="24" :md="14">
            <div class="h-full">
              <p class="evse-id pb-20px" > {{evseData.evse_id}}</p>
              <p class="status pb-20px available" v-if="evseData.status === 'AVAILABLE'"> {{ "●" + evseData.status_str }}</p>
              <p class="status pb-20px charging" v-else-if="evseData.status === 'CHARGING'"> {{ "●" + evseData.status_str }} </p>
              <p class="status pb-20px offline" v-else-if="evseData.status === 'UNKNOWN'"> {{ "●" + evseData.status_str }}</p>
              <p class="status pb-20px error" v-else-if="evseData.status === 'ERROR' || evseData.status === 'OUTOFORDER' || evseData.status === 'INOPERATIVE'"> {{ "●" + evseData.status_str }}</p>
              <div v-if="evseData.status === 'CHARGING'" >
                <p class="status pb-12px ">{{ "Start Time :" + chargingValue.start_date_time }}</p>
                <p class="status pb-12px ">{{ "Wh:" + chargingValue.wh  + " / V :" + chargingValue.V + " / A :" +chargingValue.A + " / Temperature :" +chargingValue.systemTemp}}</p>
              </div>

            </div>
          </el-col>
          <el-col class="el-col" :xs="24" :md="10">
            <div class="text-right">
              <p class="location-name text-right mb-20px"><span>&zwnj;</span>{{ locationData.name }}</p>
              <p class="location-addr text-right mb-20px">
                <span>&zwnj;</span>
                <span>{{ locationData.country + ' ' + locationData.city + locationData.address }}</span>
                <span v-if="locationData.city || locationData.address">/</span>
                <span>{{ locationData.city1 + locationData.address1 }}</span>
              </p>
              <div class="flex justify-end" >
                <el-button v-if="MStore.rule_permission.EVSEDetail.changeAvailablility === 'O'"
                  type="primary" class="btn-secondary box-shadow delete" @click="changeAvailability"> {{t('change_availability')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.delete === 'O'"
                  type="primary" class="btn-secondary box-shadow delete" @click="deleteEvse"> {{t('delete')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.edit === 'O'"
                  type="primary" class="btn-secondary box-shadow edit" @click="edit"> {{t('edit')}} </el-button>
              </div>
              <br>
              <div class="flex justify-end">
                <!-- <el-button v-if="MStore.rule_permission.EVSEDetail.dataTransfer === 'O'" disabled
                  type="primary" class="btn-secondary box-shadow delete" @click="dataTransfer"> {{t('data_transfer')}} </el-button> -->
                <el-button v-if="MStore.rule_permission.EVSEDetail.remoteTransaction === 'O'"
                  type="primary" class="btn-secondary box-shadow delete" @click="remoteTransaction"> {{ remote_transaction_title }} </el-button>
                <el-button v-if="MStore.rule_permission.EVSEDetail.getDiagnostics === 'O'"
                  type="primary" class="btn-secondary box-shadow delete" @click="getDiagnostics"> {{t('get_diagnostics')}} </el-button>
                <el-button v-if="MStore.rule_permission.EVSEDetail.configuration === 'O'"
                  type="primary" class="btn-secondary box-shadow delete" @click="openConfigurationDialog"> {{t('configuration')}} </el-button>

                  <el-dropdown class="ml-12px">
                  <el-button v-if="MStore.rule_permission.EVSEDetail.chargingProfile === 'O'" 
                    type="primary" class="btn-secondary box-shadow delete"> {{t('charging_profile')}} </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="openChargingProfileDialog('get')">{{t('get_composite_schedule')}}</el-dropdown-item>
                      <el-dropdown-item @click="openChargingProfileDialog('set')">{{t('set_charging_profile')}}</el-dropdown-item>
                      <el-dropdown-item @click="openChargingProfileDialog('clear')">{{t('clear_charging_profile')}}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>  
                </el-dropdown>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="evse-detail-main pt-30px pb-40px">
      <div class="container lg">
        <el-row class="evse-connector-hmi-container pb-20px" :gutter="30">
          <el-col class="el-col evse-col" :xs="24" :md="8">
            <div class="evse flex-col w-full h-full rounded-2xl p-16px bg-white lg:rounded-none lg:rounded-l-2xl">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_evse.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> {{ t('evse_info') }}</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Charger ID</p>
                  <p class="info-value w-50% ml-24px">{{ !.uid }}</p>
                </div> -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('evse_id') }}</p>
                  <p class="info-value w-50% ml-24px">{{evseData.evse_id}}</p>
                </div>
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('floor_level') }}</p>
                  <p class="info-value w-50% ml-24px">{{evseData.floor_level}}</p>
                </div>
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Charger Label</p>
                  <p class="info-value w-50% ml-24px">{{evseData.physical_reference}}</p>
                </div> -->
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Note / Description</p>
                  <p class="info-value w-50% ml-24px">{{evseData.description}} </p>
                </div>             -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('last_updated') }}</p>
                  <p class="info-value w-50% ml-24px">{{evseData.last_updated_str}}</p>
                </div>
              </div>
            </div >
          </el-col>
          <el-col class="el-col connector-col" :xs="24" :md="8">
            <div class="connector flex-col w-full h-full rounded-2xl p-16px bg-white lg:rounded-none lg:rounded-r-2xl">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_edit_connector.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> {{ t('connector_info') }}</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Connector ID</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.id }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('type') }}</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.type_str }} </p>
                </div>   
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Format</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.format }}</p>
                </div>    -->
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Power Type</p>
                  <p class="info-value w-50% ml-24px">{{connectorData.power_type}} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{t('max_voltage')}} </p>
                  <p class="info-value w-50% ml-24px">{{connectorData.max_voltage + ' V '}}</p>
                </div>   

                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('max_current') }}</p>
                  <p class="info-value w-50% ml-24px">{{hmiInfoData.max_amperage + ' A '}}</p>
                </div>   

                <div class="info-item">
                  <p class="info-title w-50%">{{ t('output_current')}}</p>
                  <p class="info-value w-50% ml-24px">{{connectorData.max_amperage + ' A '}}</p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('max_electric_power') }}</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.max_electric_power / 1000 + ' kW'}} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('last_updated') }}</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.last_updated_str }} </p>
                </div>  
              </div> 
            </div>
          </el-col>
          <el-col class="el-col" :xs="24" :md="8">
            <div class="hmi-container flex-col h-full rounded-2xl p-16px bg-white">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_hmi.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> {{ t('hmi_info')}}</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Control Board Model</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_model_name }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('control_board_sn')}}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_sn }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('control_board_fw_version')}}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_fw_version }} </p>
                </div>   
                <!-- <div class="info-item">
                  <p class="info-title w-50%">HMI Board Model</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_model_name }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('hmi_board_sn')}}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_sn }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('hmi_board_sw_version')}}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_sw_version }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('charge_point_sn') }}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.charge_point_sn }} </p>
                </div>  
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('created_date')}} </p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.created_date }} </p>
                </div>  
                <div class="info-item">
                  <p class="info-title w-50%"> {{ t('last_updated') }}</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.updated_date }} </p>
                </div>  
              </div> 
          </div>
          </el-col>
        </el-row>
        <!-- ------------- -->
        <el-row class="tariff-container rounded-2xl"  :gutter="30">
          <el-col class="el-col" :xs="24" :md="24">
            <div class=" h-full rounded-2xl p-16px bg-white">
              <el-tabs v-model="activeName" class="">
                <el-tab-pane name="one">
                  <template #label>
                    <div class="title flex w-full items-center mb-20px">
                      <img class="w-24px h-24px filter-black" src="@/assets/img/charger_tariff.png" alt="">
                      <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('rate') }}</h4>
                    </div>
                  </template>
                  <div class="lg:flex mb-20px bg-blue-100 p-20px md:px-0 rounded-2xl">
                    <div class="tariff-left lg:w-30% mb-20px lg:mb-0">
                      <div class="container-data h-full md:px-32px">
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('plan_name') + ':' }}  </span>
                            <span class="ml-18px">{{ tariffData.name }} </span>
                          </p>
                        </div>
                        <!-- <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">Rate Alt Url : </span>
                            <span class="ml-18px">{{ tariffData.tariff_alt_url }}</span>
                          </p>
                        </div> -->
                      </div>
                    </div>
                    <div class="tariff-right lg:w-70%">
                      <!-- <div class="container-data h-full md:px-32px"> -->
                      <div class="container-data h-full md:px-32px flex justify-between">
                        <div class="">
                          <p class="info-title font-700 text-blue-900 mb-7px"> {{ t('rate_description') + ':' }}  </p>
                          <p class="info-value">{{ tariffData.description}}</p>
                        </div>
    
                        <el-switch
                          v-model="displaySwitch"
                          size="large"
                          :active-text="t('schedule')"
                          :inactive-text="t('table')"
                          class="flex-items-start"
                        />
                      </div>
                    </div>
                  </div>
                  <el-table v-if="displaySwitch === false" :data="tariff_elements" style="width: 100%; height:300px" stripe 
                    :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
                    <el-table-column prop="price_components[0].type_str" :label="t('type')" min-width="130" align="center"/>
                    <el-table-column prop="price_components[0].price" :label="t('price_excl_vat')" min-width="120" align="center"/>
                    <el-table-column prop="price_components[0].price_incl" :label="t('price_incl_vat')" min-width="120" align="center"/>
                    <el-table-column prop="price_components[0].vat" :label="t('vat')" min-width="80" align="center"/>
                    <el-table-column prop="step_size_str" :label="t('unit')" min-width="80" align="center"/>
                    <el-table-column prop="restrictions.start_time" :label="t('start_time')" min-width="120" align="center"/>
                    <el-table-column prop="restrictions.end_time" :label="t('end_time')" min-width="120" align="center"/>
                    <el-table-column prop="restrictions_min_duration_str" :label="t('active_minute')" min-width="120" align="center"/>
                    <el-table-column prop="restrictions_max_duration_str" :label="t('deactivate_minute')" min-width="150" align="center"/>
                    <el-table-column prop="restrictions.day_of_week_str" :label="t('day_of_week')" min-width="200" align="center"/>
                  </el-table>
                  
                  <div v-if="displaySwitch === true" class="overflow-x-auto">
                    <div class="flex-col 2xl:flex-row">
                      <div class="2xl:mr-10px w-100% min-w-800px 2xl:w-50%">
                        <p class="font-700 text-blue-900">▶ {{ t('charging') }}</p>
                        <FullCalendar ref="chargingCalendarRef" :options="chargingCalendarOptions" class="mt-5px mb-5px w-100%" />
                      </div>
                      <div class="pt-30px 2xl:pt-0px w-100% min-w-800px 2xl:w-50%">
                        <p class="font-700 text-blue-900">▶ {{ t('parking') }}</p>
                        <FullCalendar ref="parkingCalendarRef" :options="parkingCalendarOptions" class="mt-5px mb-5px w-100%" />
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <!-- <el-tab-pane name="two" class="charging-profile">
                  <template #label>
                    <div class="title flex w-full items-center mb-20px">
                      <font-awesome-icon icon="fa-regular fa-file-lines" class="w-20px h-20px text-black-100" />
                      <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('charging_profile') }}</h4>
                    </div>
                  </template>

                  <div class="flex-col lg:flex-row pt-24px overflow-x-auto">
                    <div class="flex flex-wrap lg:flex-col lg:mr-24px">
                      <el-button v-for="(item, index) in chargingProfilePurpose" class="button mb-24px mr-12px" @click="changeDisplayProfile(index)">{{ item.label }}</el-button>
                    </div>

                    <div class="v-line w-3px"></div>

                    <div class="min-w-420px lg:w-25% md:px-32px">
                      <p class="font-bold text-20px pb-20px">{{ t('general') }}</p>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('name') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.name }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('stack_level') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.stack_level }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('purpose') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.charging_profile_purpose_str }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('kind') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.charging_profile_kind_str }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('recurrency') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.recurrency_kind_str }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('valid_from') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.valid_from_str }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('valid_to') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_profile.valid_to_str }}</p>
                      </div>
                    </div>

                    <div class="v-line"></div>

                    <div class="min-w-420px lg:w-25% md:px-32px">
                      <p class="font-bold text-20px pb-20px pt-30px lg:pt-0px">{{ t('charging_schedule') }}</p>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('duration') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_schedule.duration }} <span v-if="charging_schedule.duration">s</span></p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('start_schedule') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_schedule.start_schedule_str }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('scheduling_unit') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_schedule.charging_rate_unit }}</p>
                      </div>
                      <div class="info-item">
                        <p class="info-title w-50%"> {{ t('min_charging_rate') + ':' }}</p>
                        <p class="info-value w-50% ml-24px">{{ charging_schedule.min_charging_rate }} <span v-if="charging_schedule.min_charging_rate"> {{ charging_schedule.charging_rate_unit }}</span></p>
                      </div>
                    </div>

                    <div class="v-line"></div>

                    <div class="min-w-400px lg:w-25% md:px-32px">
                      <p class="font-bold text-20px pb-20px pt-30px lg:pt-0px">{{ t('charging_schedule_period') }}</p>
                      <el-table :data="charging_schedule_period">
                        <el-table-column prop="start_period" :label="t('start_period')+'(s)'" align="center" min-width="100" />
                        <el-table-column prop="limit" :label="t('limit')" align="center" min-width="100" >
                          <template #header>
                            <span v-if="charging_schedule.charging_rate_unit">{{ t('limit') }} ({{ charging_schedule.charging_rate_unit }})</span>
                            <span v-else>{{ t('limit') }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="number_phases" :label="t('number_phases')" align="center" />
                      </el-table>
                    </div>

                  </div>
                </el-tab-pane> -->
              </el-tabs>
            </div>
          </el-col>
        </el-row >
      </div>
    </div>

    <el-dialog
      append-to-body
      v-model="chargingProfile_dialog_visible"
      class="max-w-600px"
      width="90%"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ dialog_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context pb-20px">
        <div v-if="chargingProfile_dialog_step === 'one'">
          <div v-if="chargingProfile_dialog_type === 'get'" class="">
            <el-form class="w-full" :rules="get_composite_schedule_rules" :model="chargingProfile_dialog_data" ref="get_composite_schedule_formRef" label-position="left">
              <el-form-item class="m-auto w-360px mb-24px" :label= "t('duration')" prop="durationInput" label-width="140px" >
                <el-input v-model.number="chargingProfile_dialog_data.durationInput" class="w-200px" >
                  <template #suffix> <span class="h-30px">s</span></template>
                </el-input>
              </el-form-item>
              <!-- <el-form-item class="m-auto w-360px mb-24px" :label= "t('scheduling_unit')" prop="get_charge_rate_unit" label-width="140px" >
                <el-select v-model="chargingProfile_dialog_data.get_charge_rate_unit" class="w-200px" placeholder="Select" size="large">
                  <el-option v-for="item in chargingRateUnit" :label="item.name" :value="item.value" />
                </el-select>
              </el-form-item> -->
            </el-form>
          </div>
          <div v-if="chargingProfile_dialog_type === 'set'">
            <el-form class="w-full" :rules="set_charging_profile_rules" :model="chargingProfile_dialog_data" ref="set_charging_profile_formRef" label-position="left">
              <el-form-item class="m-auto w-360px mb-24px" :label= "t('profile_purpose')" prop="set_charge_profile_purpose" label-width="140px" >
                <el-select v-model="chargingProfile_dialog_data.set_charge_profile_purpose" class="w-200px" placeholder="Select" size="large" @change="filterChargeProfilePurpose">
                  <el-option v-for="item in chargingProfilePurpose" :key="item.name" :label="item.name" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item class="m-auto w-360px mb-24px" :label= "t('profile_name')" prop="set_charge_profile" label-width="140px" >
                <el-select v-model="chargingProfile_dialog_data.set_charge_profile" class="w-200px" placeholder="Select" size="large">
                  <el-option v-for="item in chargingProfile_dialog_data.filter_charge_profile_options" :key="item._id" :label="item.name" :value="item._id" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <div v-if="chargingProfile_dialog_type === 'clear'" class="h-180px">
            <el-radio-group v-model="clear_charging_profile_method" class="flex flex-justify-center">
              <el-radio-button label="1">{{ t('clear_all') }}</el-radio-button>
              <el-radio-button label="2">{{ t('clear_by_name') }}</el-radio-button>
              <el-radio-button label="3">{{ t('clear_by_purpose_and_stacklevel') }}</el-radio-button>
            </el-radio-group>
            <el-form class="w-full" :rules="clear_charging_profile_rules" :model="chargingProfile_dialog_data" ref="clear_charging_profile_formRef" label-position="left">
              <div v-if="clear_charging_profile_method === '2'" class="mt-44px">
                <el-form-item class="m-auto w-360px mb-24px" :label= "t('profile_name')" prop="clear_charge_profile" label-width="140px" >
                  <el-select v-model="chargingProfile_dialog_data.clear_charge_profile" class="w-200px" placeholder="Select" size="large">
                    <el-option v-for="item in chargingProfile_dialog_data.filter_charge_profile_options" :key="item._id" :label="item.name" :value="item.charging_profile_id" />
                  </el-select>
                </el-form-item>
              </div>
              <div v-if="clear_charging_profile_method === '3'" class="mt-44px">
                <el-form-item class="m-auto w-360px mb-24px" :label= "t('profile_purpose')" prop="clear_charge_profile_purpose" label-width="140px" >
                  <el-select v-model="chargingProfile_dialog_data.clear_charge_profile_purpose" class="w-200px" placeholder="Select" size="large">
                    <el-option v-for="item in chargingProfilePurpose" :key="item.value" :label="item.name" :value="item.value" />
                  </el-select>
                </el-form-item>

                <el-form-item class="m-auto w-360px mb-24px" :label= "t('profile_stack_level')" prop="clear_charge_profile_stacklevel" label-width="140px" >
                  <el-input v-model="chargingProfile_dialog_data.clear_charge_profile_stacklevel" class="w-200px" />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>

        <div v-if="chargingProfile_dialog_step === 'two'">
          <div v-if="chargingProfile_dialog_type === 'get'">
            <div class="flex  text-18px pb-8px">
              <p class="w-160px">{{ t('start_schedule') }} : </p>
              <p>{{ chargingProfile_dialog_data?.start_schedule_str }}</p>
            </div>
            <div class="flex  text-18px pb-8px">
              <p class="w-160px">{{ t('duration') }} : </p>
              <p>{{ chargingProfile_dialog_data?.charging_schedule?.duration }}</p>
            </div>
            <div class="flex text-18px pb-20px">
              <p class="w-160px">{{ t('scheduling_unit') }} : </p>
              <p>{{ chargingProfile_dialog_data?.charging_schedule?.charging_rate_unit }}</p>
            </div>
            <el-table :data="chargingProfile_dialog_data?.charging_schedule?.charging_schedule_period" 
              style="width: 100%" stripe :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
              <el-table-column prop="limit" :label="t('limit')" min-width="130" align="center"/>
              <el-table-column prop="start_period" :label="t('start_period')" min-width="130" align="center"/>
              <el-table-column prop="number_phases" :label="t('number_phases')" min-width="130" align="center"/>
            </el-table>
          </div>
        </div>
      </div>
      <template #footer>
        <div v-if="chargingProfile_dialog_step === 'one'">
          <div class="flex flex-justify-center">
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirmChargingProfileDialog(chargingProfile_dialog_type)">{{ t('confirm') }}</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      append-to-body
      v-model="configuration_dialog_visible"
      class="max-w-600px"
      width="90%"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ dialog_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context pb-20px configuration">
        <el-form class="max-w-500px m-auto" >
          <el-form-item v-for="(item, index) in cp_config" :key="item.key" class="mb-24px flex">
            <span slot="label" class="w-290px" :class="{modify_item: item.modify}">{{ item.key }}</span>
            <el-switch v-if="item.value === false || item.value === true" v-model="item.value" :disabled="item.readonly" @change="value => editConfiguration(value, index)" />
            <el-input v-else v-model="item.value" :disabled="item.readonly" @change="value => editConfiguration(value, index)" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button 
            round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="confirmConfigurationDialog">
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      append-to-body
      v-model="remote_dialog_visible"
      class="max-w-600px"
      width="90%"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ t('remote_start') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context pb-20px remote-transaction">
        <el-form class="w-full" :rules="remote_transaction_rules" :model="remote_transaction_data" ref="remote_transaction_formRef" label-position="left" >
          <el-form-item class="m-auto w-360px mb-24px" :label= "t('id')" prop="id" label-width="100px" >
            <el-input v-model="remote_transaction_data.id" class="w-240px" @change="filterRemoteRfid" />
          </el-form-item>
          <el-form-item class="m-auto w-360px mb-24px" :label= "t('rfid_num')" prop="rfid_num" label-width="100px" >
            <el-select v-model="remote_transaction_data.rfid_num" class="w-240px" :placeholder="t('select')" size="large">
              <el-option 
                v-if="Object.keys(remote_transaction_data.rfid_list).length === 0"
                :label="$t('please_bind_rfid_num')" 
                :value="$t('please_bind_rfid_num')" 
              />
              <el-option 
                v-else
                v-for="item in remote_transaction_data.rfid_list" 
                :key="item.rfid"
                :label="item.nickname + ' (' + item.rfid + ')'" 
                :value="item.rfid"
              />
            </el-select>   
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            :disabled="Object.keys(remote_transaction_data.rfid_list).length === 0"
            round class="w-48% bg-btn-100 text-white max-w-140px" @click.stop="confirmRemoteTransaction">
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.evse-detail {
  height: 100%;
  width: 100%;
  .evse-detail-header {
    .location-name {
      font-size: 20px;
    }
    .log {
      width: 220px;
      height: 40px;
      font-size: 18px;
      color:var(--white);
      border-radius: 20px;
    }
    .evse-id{
      font-size: 36px;
    }
    .status {
      font-size: 25px;
    }
  }
  .evse-detail-main {
    width: 100%;
    background-color: #f3f7fa;
    .evse-col{
      @media (min-width: 992px) {
        padding-right: 0 !important;
      }
    }
    .info-title,.info-value{
      text-align: left;
      word-break: break-all;
    }
    .connector-col{
      position: relative;
      @media (min-width: 992px) {
        padding-left: 0 !important;
      }
      &:before {
        @media (min-width: 992px) {
          content: "";
          width: .3rem;
          height: 70%;
          position: absolute;
          top: 15%;
          left: -1.5rem;
          background-color: var(--gray-200);
        }
      }
    }
    .info-item{
      display: flex;
      justify-content: space-between;
      margin-bottom: .8rem;
    }
  }
}

// FullCalendar --------------------------------------------------------------- 
::-webkit-scrollbar {
  width: 0.8rem;
  height: 0.8rem;
}
::-webkit-scrollbar-thumb {
  background-color: var(--gray-300);
}
::-webkit-scrollbar-thumb {
  border-radius: 2rem;
}

:deep(.mfc-event) {
  padding: 0 0 5px 0;
  border-width: 0 0 5px !important;
  border-style: solid !important;
  box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
}
:deep(.fc-timegrid-event-harness) {
  border-radius: 5px;
  border: 2px solid var(--gray-200);
}
:deep(.fc-event-main) {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
:deep(.fc .fc-day-today) {
  background-color: unset;
}
:deep(.fc-scrollgrid) {
  color: var(--blue-1200);
}

// for table border
:deep(.fc-scrollgrid) {
  // 全部表格邊框初始化
  border: 0px;
  th {
    border: 0px;
  }
  tr {
    border: 0px;
  }
  td {
    border: 0px;
  }
  // 時間軸直線 + body橫線
  .fc-timegrid-slot-lane {
    border: 1px solid var(--gray-200);
  }
  // body直線
  .fc-timegrid-col {
    border: 1px solid var(--gray-200);
  }
  // 日期標題下框線
  .fc-day {
    border-bottom: 1px solid var(--gray-200);
    // body下框線
    .fc-timegrid-col-frame {
      border-bottom: 1px solid var(--gray-200);
    }
  }
  // body最右側直線
  .fc-timegrid-slots {
    border-right: 1px solid var(--gray-200);
  }
}
// for day title
:deep(.fc-col-header-cell-cushion) {
  background-color: var(--gray-300);
  color: var(--white);
  margin-bottom: 8px;
  width: 44px;
  height: 20px;
  line-height: 20px;
  border-radius: 5px;
}

.charging-profile {
  .el-button + .el-button {
    margin-left: 0;
  }
  .button {
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--secondary);
    border-color: var(--secondary);
    border-radius: 2rem;
    @media (min-width: 768px) {
      width: 22rem;
    }
  }
  .v-line {
    width: 0;
    height: 0;
    padding: 0;
    background-color: unset;
    @media (min-width: 992px) {
      height: inherit;
      margin: 1.5rem;
      padding: 1.5px;
      background-color: var(--gray-200);
    }
  }
}
.configuration {
  .modify_item {
    font-weight: bolder;
    text-decoration: underline;
  }
  :deep(.el-form-item__content) {
    flex-wrap: nowrap;
  }
  :deep(.el-input) {
    width: auto;
  }
}
</style>
