<script setup>
import axios from 'axios'
import { ref, reactive, onMounted} from 'vue'
import { useRoute, useRouter} from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
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
const evseData = reactive([])
const connectorData = reactive([])
const chargePointInfoData = reactive([])
const hmiInfoData = reactive([])
const locationData = reactive([])
const tariffData = reactive([])
const tariff_elements = reactive([])
const config_dialog_visible = ref(false)

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
const cp_config = reactive (cp_config_core)


const deleteEvse = () => {
  ElMessageBox.confirm(t('do_you_want_to_delete'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = { 'class' : 'EVSE', 'id' : evseId }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    sendData = { 'class' : 'Connector', 'id' : connectorData.id }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    if(chargePointInfoData.hmi !== '') { 
      sendData = { 'class' : 'HMIControlBoardInfo', 'pk' : chargePointInfoData.hmi }
      console.log(await MsiApi.setCollectionData('delete', 'cpo', sendData))
    }
    let evseArr = []
    for (let i = 0; i < locationData?.evses?.length; i++) {
      if (locationData.evses[i].uid === evseId) {
        continue
      }
      evseArr.push(locationData.evses[i]._id)
    }
    let sendData1 = { 'class' : 'Location', 'id': locationData.id, 'evses' : evseArr}
    console.log(await MsiApi.setCollectionData('patch', 'ocpi', sendData1))

    router.back(-1)
  })
}
const edit = () => {
  router.push({ name: 'evseEdit', query: {station_id:locationData.id, evse_id:evseId} })
}

let interval = undefined
let retry = 3

const check_uploaded  = async () => {
  let queryData = { database: 'CPO', collection: 'ChargePointInfo', pipelines: [{ $match: {evse_id:evseData.evse_id},},{ $project: { _id: 0 } }]}
  let response = await MsiApi.mongoAggregate(queryData)
  console.log(response)
  if (response.data.result?.[0]?.ocpp_info?.[0]?.statusNotification?.diagnosticsStatus === "Uploaded") {
    console.log(111)
    axios({method: 'get', url: 'google10/msi-hmi-logs/cs_logs.zip', responseType: 'blob'})
    .then(response => {
      clearInterval(interval)
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cs_logs.zip'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click();
      window.URL.revokeObjectURL(url)
      clearInterval(interval)
    })
    .catch(error => {
      ElMessage.error('Error downloading ZIP file:', error);
      clearInterval(interval)
    })
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



  ElMessageBox.confirm(t('do_you_want_to_get_diagnostics'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    
    let sendData = {
      evse_id: evseData.evse_id,
      location: "https://storage.googleapis.com/msi-hmi-logs/",
    }
    let response = await MsiApi.get_diagnostics(sendData)
    console.log(response)
    if (response.status === 200) {
      interval = setInterval(check_uploaded, 10000) 
    }
    else {
      ElMessage.error(response.data.message)
    }

  })
}

const getConfiguration = async () => {
  ElMessageBox.confirm(t('do_you_want_to_get_configuration'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = {
      evse_id: evseData.evse_id,
    }
    const response = await MsiApi.get_configuration(sendData)
    console.log(response)
    if (response.status === 200) {
      console.log(11)
      cp_config = response.data.configurationKey
      console.log(cp_config)
    }
    else 
      ElMessage.error(response.data.message)
  })
  
}

const clearChargingProfile = async () => {
  ElMessageBox.confirm(t('do_you_want_to_clear_charging_profile'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = {
      evse_id: evseData.evse_id,
    }
    console.log(await MsiApi.clear_charging_profile(sendData))
  })
}


const getCompositeSchedule = async () => {
  ElMessageBox.confirm(t('do_you_want_to_get_composite_schedule'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = {
      evse_id: evseData.evse_id,
      duration: 100,
    }
    console.log(await MsiApi.get_composite_schedule(sendData))
  })
}


const changeAvailability = async () => {
  ElMessageBox.confirm(t('do_you_want_to_change_availability'),'Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
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

const changeConfiguration = async () => {
  config_dialog_visible.value = true
}


const downloadZIP = async () =>{

  axios({ method: 'get', url: 'google10/msi-hmi-logs/cs_logs.zip', responseType: 'blob'})
  .then(response => {
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cs_logs.zip'
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  })
  .catch(error => {
    console.error('Error downloading ZIP file:', error)
  })
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
  console.log(tariffObj)

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
    for (let j=0; j<tariffObj[i].restrictions.day_of_week.length; j++) {
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
  let startTime = parseInt(startTimeStr.split(':')[0])*60 + parseInt(startTimeStr.split(':')[1])
  let endTime = parseInt(endTimeStr.split(':')[0])*60 + parseInt(endTimeStr.split(':')[1])
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

onMounted( async () => {
  let queryData = { "database":"OCPI", "collection":"EVSE", "query": { "uid": {"UUID":evseId}}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(evseData, response.data.all[0]) 

  let localEndTime =  new Date( (new Date(evseData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  evseData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  switch (evseData.status) {
    case 'AVAILABLE':
      evseData.status_str = t('available')
    break
    case 'CHARGING':
      evseData.status_str = t('charging')
    break
    case 'UNKNOWN':
      evseData.status_str = t('offline')
    break
    case 'OUTOFORDER':
      evseData.status_str = t('error')
    break
    case 'INOPERATIVE':
      evseData.status_str = t('INOPERATIVE')
    break
    default:
      evseData.status_str = t('others')
  }
  queryData = { "database":"OCPI", "collection":"Connector", "query": { "_id": { "ObjectId" : evseData?.connectors?.[0]?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(connectorData, response.data.all[0])
  if (connectorData.standard === 'IEC_62196_T1') 
    connectorData.type_str = 'Type 1 (J1772)'
  else if (connectorData.standard === 'IEC_62196_T2')
    connectorData.type_str = 'Tyep 2 (Mennekes)' 
  else
    connectorData.type_str = t('others')
  
  localEndTime =  new Date( (new Date(connectorData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  connectorData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

  queryData = { "database":"CPO", "collection":"ChargePointInfo", "query": { "evse": { "ObjectId" : evseData?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(chargePointInfoData, response.data.all[0])
  hmiInfoData.max_amperage = 0
  if(chargePointInfoData.hmi !== '') {
    queryData = { "database":"CPO", "collection":"HMIControlBoardInfo", "query": { "_id": { "ObjectId" : chargePointInfoData?.hmi}}}    
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(hmiInfoData, response.data.all[0])    
    if (hmiInfoData.minmax_current)
      hmiInfoData.max_amperage = (hmiInfoData.minmax_current.split(" ").map(hex => parseInt(hex, 16)))[7]
  }
  queryData = { "database":"OCPI", "collection":"Location", "query": {  "evses" : {"$in": [  {"ObjectId" : evseData?._id }]}  }}
  response = await MsiApi.mongoQuery(queryData)
  if (response.data.all.length === 0) {
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
    Object.assign(locationData, response.data.all[0])
  }
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

  queryData = { "database":"OCPI", "collection":"Tariff", "query": { "id": { "UUID" : connectorData.tariff_ids[0]}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(tariffData, response.data.all[0])
  tariffData.name = tariffData.custom?.name
  tariffData.description = tariffData.custom?.description
  
  Object.assign(tariff_elements, tariffData.elements )
  
  tariff_elements.forEach((item)=> {
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
              <p class="status pb-20px charging" v-else-if="evseData.status === 'CHARGING'"> {{ "●" + evseData.status_str }}</p>
              <p class="status pb-20px offline" v-else-if="evseData.status === 'UNKNOWN'"> {{ "●" + evseData.status_str }}</p>
              <p class="status pb-20px error" v-else-if="evseData.status === 'ERROR' || evseData.status === 'OUTOFORDER' || evseData.status === 'INOPERATIVE'"> {{ "●" + evseData.status_str }}</p>
              
            </div>
          </el-col>
          <el-col class="el-col" :xs="24" :md="10">
            <div class="text-right">
              <p class="location-name text-right mb-20px">{{ locationData.name }}</p>
              <p class="location-addr text-right mb-20px">{{ locationData.country + ' ' + locationData.city + locationData.address + '/' + locationData.city1 + locationData.address1}}</p>
              <div class="flex justify-end">
                  <el-button v-if="MStore.rule_permission.EVSEDetail.dataTransfer === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="dataTransfer"> {{t('data_transfer')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.getChargingProfile === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="setChargingProfile"> {{t('set_charging_profile')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.changeConfiguration === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="changeConfiguration"> {{t('change_configuration')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.compositeSchedule === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="getCompositeSchedule"> {{t('get_composite_schedule')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.clearChargingProfile === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="clearChargingProfile"> {{t('clear_charging_profile')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.getDiagnostics === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="getDiagnostics"> {{t('get_diagnostics')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.changeConfiguration === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="getConfiguration"> {{t('get_configuration')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.changeAvailablility === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="changeAvailability"> {{t('change_availability')}} </el-button>
                  <el-button v-if="MStore.rule_permission.EVSEDetail.delete === 'O' || MStore.permission.isCompany"
                  type="primary" class="btn-secondary box-shadow delete" @click="deleteEvse"> {{t('delete')}} </el-button>
                <el-button type="primary" class="btn-secondary box-shadow edit" @click="edit"> {{t('edit')}} </el-button>
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
                  <p class="info-value w-50% ml-24px">{{ evseData.uid }}</p>
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
              <div class="title w-full flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_tariff.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('rate') }}</h4>
              </div>
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
                <el-table-column prop="restrictions_max_duration_str" :label="t('deactivate_minute')" min-width="120" align="center"/>
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

            </div>
          </el-col>
        </el-row >
      </div>
    </div>
    <el-dialog
      append-to-body
      v-model="config_dialog_visible"
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
      <div class="dialog-context">
        <el-form class="pr-10px" label-position="left" label-width="110px" :rules="program_rules" :model="ProgramMod" ref="program_ref" :scroll-to-error=true>
          <el-form-item :label="t('name')" prop="name">
            <el-input v-model="cp_config.name" />
          </el-form-item>
          <el-form-item :label="t('station')" prop="location">
            <el-input v-model="ProgramMod.location" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelDialog"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click="confirmDialog"
            >{{ t('confirm') }}</el-button
          >
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
</style>
