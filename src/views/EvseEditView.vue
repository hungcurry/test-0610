<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/composables/CommonFunc'
import msi from '@/assets/msi_style'
import { useI18n } from 'vue-i18n'
import moment from "moment"

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import tippy from 'tippy.js'
import "tippy.js/dist/tippy.css"

import { useMStore } from "../stores/m_cloud"
const MStore = useMStore()
const { t } = useI18n()
const MsiFunc = CommpnFunc()
const route = useRoute()
const MsiApi = ApiFunc()
const tariff_profile = reactive([])
const station_id = route.query.station_id
const evse_id = route.query.evse_id
const stationName = ref('')
const ruleFormRef  = ref()
let station_evses = []
const evse_edit_title = ref(t('add_evse'))
const activeName = ref('one')

const connector_obj = reactive({
  class: 'Connector',
  standard: '-',
  standard_str: '-',
  format: '-',
  power_type: '-',
  max_voltage: '0',
  max_amperage: '0',
  max_electric_power: '0',
  tariff_ids: [],
})
const evse_obj = reactive({
  class: 'EVSE',
  evse_id: '',
  status: 'UNKNOWN',
  connectors: [],
})
const router = useRouter()
const selectTariffObj = reactive({})

const max_amperage = ref(0)

const rules = reactive({
  evse_id: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  floor_level: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },
                 { min: 1, max: 4, message: t('length_should_be_1_to_4'), trigger: 'blur' },],
  select_profile: [{ required: true, message: t('this_item_is_required'), trigger: 'change' },],
})

const selectTariff = (select_id) => {
  selectTariffObj.length = 0
  for (let i = 0; i < tariff_profile.length; i++) {
    if (select_id === tariff_profile[i].id) {
      Object.assign(selectTariffObj, tariff_profile[i])
    }
  }
  fillFullCalendar()
}

const CancelEvseEdit = () => {
  router.back(-1)
}
const SaveEvseEdit = async (formEl) => {  
  if (!formEl) return
  let check_format_success = false
  await formEl.validate((valid) => {
    if (valid === true) 
      check_format_success = true
  })
  if (check_format_success === false) {
    return 
  }
  console.log(EVSEChargingProfileData) // Tony: The data need to save to DB.

  if (evse_id === undefined) {
    if (evse_obj.select_profile !== '') connector_obj.tariff_ids.push(evse_obj.select_profile)
    connector_obj.id = uuidv4()
    MsiFunc.deleteEmptyKeys(connector_obj)
    MsiFunc.deleteEmptyKeys(evse_obj)

    if (check_format_success === true) {
      ElMessageBox.confirm( t('do_you_want_to_create'), t('warning'), {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      })
        .then(async () => {
          let response = await MsiApi.setCollectionData('post', 'ocpi', connector_obj)
          if (response.status !== 201) {
            ElMessage.error(response.data.message)
            return
          }
          let queryData = {
            database: 'OCPI',
            collection: 'Connector',
            query: { id: { UUID: connector_obj.id } },
          }
          response = await MsiApi.mongoQuery(queryData)
          evse_obj.connectors.push(response.data.all[0]._id)
          evse_obj.uid = uuidv4()

          response = await MsiApi.setCollectionData('post', 'ocpi', evse_obj)
          if (response.status !== 201) {
            ElMessage.error(response.data.message)
            return
          }
          queryData = {
            database: 'OCPI',
            collection: 'EVSE',
            query: { uid: { UUID: evse_obj.uid } },
          }
          response = await MsiApi.mongoQuery(queryData)
          station_evses.push(response.data.all[0]._id)
          if (response.status === 200) {
            router.push({ name: 'evse', query: { page: 'unpaired' } })
          }
        })
        .catch((e) => {
          console.log(e)
        })
    }
  } else {
    connector_obj.tariff_ids[0] = evse_obj.select_profile
    evse_obj.id = evse_obj.uid
    if (check_format_success === true) {
      ElMessageBox.confirm( t('do_you_want_to_modify'), 'Warning', {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      })
        .then(async () => {
          await MsiApi.setCollectionData('patch', 'ocpi', connector_obj)
          let res = await MsiApi.setCollectionData('patch', 'ocpi', evse_obj)
          res.status === 200? ElMessage({message: res.data.message, type: 'success'}) : ElMessage({message: res.data.message, type: 'error'})
          router.back(-1)
        })
        .catch((e) => {
          console.log(e)
        })
    }
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
  Object.assign(tariffObj, selectTariffObj.elements)
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
  let step_size_str = tariffObj[index].price_components[0].step_size_str
  let price_excl_vat_str = tariffObj[index].price_components[0].price
  let price_incl_vat_str = tariffObj[index].price_components[0].price_incl
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
    </div>
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
  slotEventOverlap: false,    // �ƥ󤣭��|
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
// Tony - TBD: save charging profile
const ChargingProfileData = reactive([])
const EVSEChargingProfileData = reactive([])
const selectChargingProfileData = reactive({})
const select_charging_schedule = reactive({})
const select_charging_schedule_period = reactive([])
const charging_profile_options = reactive([])
const chargingProfilePurpose = [
  { value: 'ChargePointMaxProfile', label: t('charge_point_max_profile')},
  { value: 'TxDefaultProfile', label: t('tx_default_profile')},
  { value: 'TxProfile', label: t('tx_profile')},
]
const changeChargingProfileTab = (index) => {
  charging_profile_options.length = 0
  charging_profile_options.push({_id: undefined, name: t('none')})
  for (let i=0; i<ChargingProfileData.length; i++) {
    if (ChargingProfileData[i].charging_profile_purpose === chargingProfilePurpose[index].value) {
      charging_profile_options.push(ChargingProfileData[i])
    }
  }
  for (let i=0; i<EVSEChargingProfileData.length; i++) {
    if (EVSEChargingProfileData[i].charging_profile_purpose === chargingProfilePurpose[index].value) {
      evse_obj.select_charging_profile = EVSEChargingProfileData[i]._id
      Object.assign(selectChargingProfileData, EVSEChargingProfileData[i])
      Object.assign(select_charging_schedule, EVSEChargingProfileData[i].charging_schedule)
      Object.assign(select_charging_schedule_period, EVSEChargingProfileData[i].charging_schedule.charging_schedule_period)
      return
    }
  }
  
  evse_obj.select_charging_profile = ''
  for (let key in selectChargingProfileData) {
    selectChargingProfileData[key] = undefined
  }
  for (let key in select_charging_schedule) {
    select_charging_schedule[key] = undefined
  }
  select_charging_schedule_period.length = 0
}
const selectChargingProfile = (select_id) => {
  for (let key in selectChargingProfileData) {
    selectChargingProfileData[key] = undefined
  }
  for (let key in select_charging_schedule) {
    select_charging_schedule[key] = undefined
  }
  select_charging_schedule_period.length = 0
  for (let i=0; i<ChargingProfileData.length; i++) {
    if (ChargingProfileData[i]._id === select_id) {
      Object.assign(selectChargingProfileData, ChargingProfileData[i])
      Object.assign(select_charging_schedule, ChargingProfileData[i].charging_schedule)
      Object.assign(select_charging_schedule_period, ChargingProfileData[i].charging_schedule.charging_schedule_period)

      for (let j=0; j<EVSEChargingProfileData.length; j++) {
        if (EVSEChargingProfileData[j].charging_profile_purpose === ChargingProfileData[i].charging_profile_purpose) {
          EVSEChargingProfileData[j] = ChargingProfileData[i]
          break
        }
        else if (j === EVSEChargingProfileData.length-1) {
          EVSEChargingProfileData.push(ChargingProfileData[i])
        }
      }
    }
  }
}
const getCharging_profile = async() => {
  let queryData = null
  let response = null
  let sample_id = [{_id: '6541f4a9037ef078b00aba67'}, {_id: '6541f530037ef078b00aba6a'}]  // Tony: id of thecharging Profile which binding with EVSE

  // get ChargingProfileData
  queryData = {
    database: 'CPO',
    collection: 'ChargingProfile',
    pipelines: [{ $project: { aaa: 0} }],
  }
  response = await MsiApi.mongoAggregate(queryData)
  ChargingProfileData.length = 0
  Object.assign(ChargingProfileData, response.data.result)
  ChargingProfileData.forEach((item) => {
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
    item.name = item.custom?.name

    // get EVSEChargingProfileData
    sample_id.forEach((item2) => {  // Tony
      if (item._id === item2._id) {
        EVSEChargingProfileData.push(item)
        if (item.charging_profile_purpose === chargingProfilePurpose[0].value) {
          evse_obj.select_charging_profile = item._id
        }
      }
    })
  })

  changeChargingProfileTab(0)
}

onMounted(async () => {
  let queryData,
    response = undefined
  let connectors = []
  let tariff_ids = []
  queryData = { database: 'OCPI', collection: 'Tariff', query: {} }
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(tariff_profile, response.data.all)

  tariff_profile.forEach((item)=>{
    item.elements.forEach((element)=>{
      let day_of_week_str = []
      for (const day of element.restrictions.day_of_week) {
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
      element.restrictions.day_of_week_str = day_of_week_str
      element.price_components[0].price_incl = element.price_components[0].price *  (1 + (element.price_components[0].vat / 100))
      switch (element.price_components[0].type) {
        case 'ENERGY' :
          element.price_components[0].type_str = t('charging_by_energy')
          element.price_components[0].step_size_str = element.price_components[0].step_size
          break
        case 'TIME' :
          element.price_components[0].type_str = t('charging_by_time')
          element.price_components[0].step_size_str = element.price_components[0].step_size / 60
          break
        case 'PARKING_TIME' :
          element.price_components[0].type_str = t('parking_by_time')
          element.price_components[0].step_size_str = element.price_components[0].step_size / 60
          element.restrictions_min_duration_str = element.restrictions.min_duration / 60
          element.restrictions_max_duration_str = element.restrictions.max_duration / 60
          break
        default:
          element.price_components[0].type_str = element.price_components[0].type
      }
    })
    item.name = item?.custom?.name
    item.description = item?.custom?.description
  })
  if (evse_id !== undefined) {
    evse_edit_title.value = t('edit_evse')

    queryData = {
      database: 'OCPI',
      collection: 'EVSE',
      query: { uid: { UUID: evse_id } },
    }
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(evse_obj, response.data.all[0])
    for (let i = 0; i < evse_obj?.connectors?.length; i++) {
      connectors.push(evse_obj?.connectors[i]._id)
    }
    evse_obj.connectors = connectors
    queryData = {
      database: 'OCPI',
      collection: 'Connector',
      query: { _id: { ObjectId: evse_obj.connectors[0] } },
    }
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(connector_obj, response.data.all[0])

    switch (connector_obj.standard) {
      case 'IEC_62196_T1':
        connector_obj.standard_str = 'Type 1 (J1772)'
      break
      case 'IEC_62196_T2':
        connector_obj.standard_str = 'Type 2 (Mennekes)'
      break
      default:
        connector_obj.standard_str = t('others')
    }

    evse_obj.select_profile = connector_obj.tariff_ids[0]

    for (let i = 0; i < tariff_profile.length; i++) {
      if (evse_obj.select_profile === tariff_profile[i].id)
        Object.assign(selectTariffObj, tariff_profile[i])
    }

    for (let i = 0; i < connector_obj?.tariff_ids?.length; i++) {
      tariff_ids.push(connector_obj?.tariff_ids[i])
    }
    connector_obj.tariff_ids = tariff_ids
  }
  queryData = {
    database: 'OCPI',
    collection: 'Location',
    query: { id: { UUID: station_id } },
  }
  response = await MsiApi.mongoQuery(queryData)
  for (let i = 0; i < response.data.all[0]?.evses?.length; i++) {
    station_evses.push(response.data.all[0]?.evses[i]._id)
  }
  stationName.value = response.data.all[0]?.name

  queryData = {
    database: 'CPO',
    collection: 'ChargePointInfo',
    query: { evse: { ObjectId: evse_obj._id } },
  }
  response = await MsiApi.mongoQuery(queryData)
  if (response.data.all[0]?.hmi !== '') {
    queryData = {
      database: 'CPO',
      collection: 'HMIControlBoardInfo',
      query: { _id: { ObjectId: response.data.all[0].hmi } },
    }
    response = await MsiApi.mongoQuery(queryData)
    max_amperage.value = response.data.all[0].minmax_current
      .split(' ')
      .map((hex) => parseInt(hex, 16))[7]
  }
  fillFullCalendar()
  getCharging_profile()
})
</script>

<template>
  <div class="evse-edit">
    <div class="container lg flex-col">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-30px">{{ evse_edit_title }}</p>
      </div>
      <el-form class="w-full min-w-190px" :rules="rules" :model="evse_obj" ref="ruleFormRef">
      <div class="evse-edit-main flex-grow mb-44px">
        <el-row class="h-full" :gutter="30">
          <el-col class="mb-24px lg:mb-0" :xs="24" :md="6">
            <div class="evse-edit-left h-full">
              <div class="evse-edit-left-up w-full mb-24px">
                <div class="title flex items-center mb-20px">
                  <img
                    class="w-24px h-24px filter-black"
                    src="@/assets/img/charger_evse.png"
                    alt=""
                  />
                  <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('station') }}</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">
                    <el-form-item class="block mb-4px" :label= "t('name')" prop="name">
                      <el-input v-model.trim="stationName" disabled />
                    </el-form-item>
                    <el-form-item class="block mb-4px" :label= "t('evse_id')" prop="evse_id">
                      <el-input v-model.trim="evse_obj.evse_id" />
                    </el-form-item>
                    <el-form-item class="block mb-4px" :label= "t('floor_level')" prop="floor_level">
                      <el-input v-model.trim="evse_obj.floor_level" />
                    </el-form-item>
                </div>
              </div>
              <div class="evse-edit-left-down w-full">
                <div class="title flex items-center mb-20px">
                  <img
                    class="w-24px h-24px filter-black"
                    src="@/assets/img/charger_edit_connector.png"
                    alt=""
                  />
                  <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('connector_info') }}</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('type') }}</p>
                    <p class="info-value w-50% ml-24px">{{ connector_obj.standard_str }}</p>
                  </div>
                  <!-- <div class="info-item">
                    <p class="info-title w-50%">Connector ID</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.id }}</p>
                  </div>  
                  <div class="info-item">
                    <p class="info-title w-50%">Format</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.format }}</p>
                  </div>  
                  <div class="info-item">
                    <p class="info-title w-50%">Power Type</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.power_type }}</p>
                  </div>   -->
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_voltage') }}</p>
                    <p class="info-value w-50% ml-24px">
                      {{ connector_obj.max_voltage + 'V' }}
                    </p>
                  </div>
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_current') }}</p>
                    <p class="info-value w-50% ml-24px">{{ max_amperage + 'A' }}</p>
                  </div>
                  <div class="info-item items-center">
                    <p class="info-title w-50%">{{ t('output_current') }}</p>
                    <el-input
                      class="w-45% ml-24px"
                      v-model="connector_obj.max_amperage"
                    />
                    <span class="w-5% ml-5px">A</span>
                  </div>

                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_electric_power') }}</p>
                    <p class="info-value w-50% ml-24px">
                      {{ connector_obj.max_electric_power / 1000 + ' kW' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :md="18">
            <el-tabs v-model="activeName" class="">
              <el-tab-pane name="one">
                <template #label>
                  <div class="title flex items-center mb-20px">
                    <img
                      class="w-24px h-24px filter-black"
                      src="@/assets/img/charger_tariff.png"
                      alt=""
                    />
                    <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('rate_plan') }}</h4>
                  </div>
                </template>

                <div class="rounded-lg bg-gray-100 p-20px">
                  <div class="mb-20px flex justify-between">
                    <el-form-item class="block mb-4px" :label= "t('plan_name')" prop="select_profile">
                      <el-select
                        class="el-select w-full"
                        v-model="evse_obj.select_profile"
                        placeholder="Select"
                        size="large"
                        @change="selectTariff"
                      >
                        <el-option
                            v-for="item in tariff_profile"
                            :key="item.value"
                            :label="item.name"
                            :value="item.id"
                          />
                      </el-select>
                    </el-form-item>

                    <el-switch
                      v-model="displaySwitch"
                      size="large"
                      :active-text="t('schedule')"
                      :inactive-text="t('table')"
                      class="self-end"
                    />
                  </div>

                  <div class="lg:flex mb-24px bg-white px-14px py-20px rounded-2xl">
                    <div class="tariff-left lg:w-30% mb-20px lg:mb-0">
                      <div class="container-data h-full md:px-32px">
                        <!-- <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">Type : </span>
                            <span class="ml-18px">AD_HOC_PAYMENT</span>
                          </p>
                        </div> -->
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('currency') + ':' }}  </span>
                            <span class="ml-18px">{{ selectTariffObj.currency }}</span>
                          </p>
                        </div>
                        <!-- <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">Rate Alt Url : </span>
                            <span class="ml-18px">NONE</span>
                          </p>
                        </div> -->
                      </div>
                    </div>
                    <div class="tariff-right lg:w-70%">
                      <div class="container-data h-full md:px-32px">
                        <div class="">
                          <p class="info-title font-700 text-blue-900 mb-7px">
                            {{ t('rate_description') + ':' }}
                          </p>
                          <p class="info-value">{{selectTariffObj.description}}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="px-14px bg-white" v-if="displaySwitch === false">
                    <el-table
                      :data="selectTariffObj.elements"
                      style="width: 100%; height: 300px"
                      stripe
                      :cell-style="msi.tb_cell"
                      :header-cell-style="msi.tb_header_cell"
                      size="large"
                    >
                      <el-table-column
                        prop="price_components[0].type_str"
                        :label="t('type')"
                        min-width="120"
                        align="center"
                      />
                      <el-table-column
                        prop="price_components[0].price"
                        :label="t('price_excl_vat')"
                        min-width="170"
                        align="center"
                      />
                      <el-table-column
                        prop="price_components[0].price_incl"
                        :label="t('price_incl_vat')"
                        min-width="170"
                        align="center"
                      />
                      <el-table-column
                        prop="price_components[0].vat"
                        :label="t('vat')"
                        min-width="80"
                        align="center"
                      />
                      <el-table-column
                        prop="price_components[0].step_size_str"
                        :label="t('unit')"
                        min-width="80"
                        align="center"
                      />
                      <el-table-column
                        prop="restrictions.start_time"
                        :label="t('start_time')"
                        min-width="120"
                        align="center"
                      />
                      <el-table-column
                        prop="restrictions.end_time"
                        :label="t('end_time')"
                        min-width="120"
                        align="center"
                      />
                      <el-table-column prop="restrictions_min_duration_str" :label="t('active_minute')" min-width="170" align="center"/>
                      <el-table-column prop="restrictions_max_duration_str" :label="t('deactivate_minute')" min-width="200" align="center"/>
                  
                      <el-table-column
                        prop="restrictions.day_of_week_str"
                        :label="t('day_of_week')"
                        min-width="200"
                        align="center"
                      />
                    </el-table>
                  </div>
                  <div class="px-14px py-20px bg-white mb-24px rounded-2xl" v-if="displaySwitch === true">
                    <p class="pt-10px font-700 text-blue-900">{{ t('charging') }}</p>
                    <div class="overflow-x-auto">
                      <FullCalendar ref="chargingCalendarRef" :options="chargingCalendarOptions" class="mt-5px mb-5px min-w-800px" />
                    </div>
                  </div>
                  <div class="px-14px py-20px bg-white rounded-2xl" v-if="displaySwitch === true">
                    <p class="pt-10px font-700 text-blue-900">{{ t('parking') }}</p>
                    <div class="overflow-x-auto">
                      <FullCalendar ref="parkingCalendarRef" :options="parkingCalendarOptions" class="mt-5px mb-5px min-w-800px" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- <el-tab-pane name="two">
                <template #label>
                  <div class="title flex items-center mb-20px">
                    <font-awesome-icon icon="fa-regular fa-file-lines" class="w-20px h-20px text-black-100" />
                    <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('charging_profile') }}</h4>
                  </div>
                </template>

                <div class="rounded-lg bg-gray-100 p-20px">
                  <el-menu mode="horizontal overflow-x-auto" default-active="1" @select="changeChargingProfileTab">
                    <el-menu-item v-for="(item, index) in chargingProfilePurpose" :index="index"><span>{{ item.label }}</span></el-menu-item>
                  </el-menu>

                  <div>
                    <div class="mb-20px flex justify-between">
                      <el-form-item class="block mb-4px" :label= "t('profile_name')" prop="select_charging_profile">
                        <el-select
                          class="el-select w-full"
                          v-model="evse_obj.select_charging_profile"
                          placeholder="Select"
                          size="large"
                          @change="selectChargingProfile"
                        >
                          <el-option
                            v-for="item in charging_profile_options"
                            :key="item.value"
                            :label="item.name"
                            :value="item._id"
                          />
                        </el-select>
                      </el-form-item>
                    </div>
  
                    <div class="lg:flex overflow-x-auto">
                      <div class="mb-24px bg-white px-14px py-20px rounded-2xl lg:w-25% min-w-250px">
                        <p class="font-bold pb-20px">{{ t('general') }}</p>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('stack_level') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.stack_level }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('purpose') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.charging_profile_purpose_str }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('kind') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.charging_profile_kind_str }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('recurrency') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.recurrency_kind_str }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('valid_from') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.valid_from_str }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('valid_to') + ':' }}  </span>
                            <span class="ml-18px">{{ selectChargingProfileData.valid_to_str }}</span>
                          </p>
                        </div>
                      </div>
                      <div class="mb-24px bg-white px-14px py-20px rounded-2xl lg:w-25% min-w-200px lg:mx-24px">
                        <p class="font-bold pb-20px">{{ t('charging_schedule') }}</p>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('duration') + ':' }}  </span>
                            <span class="ml-18px">{{ select_charging_schedule.duration }}</span>
                            <span class="ml-10px" v-if="select_charging_schedule.duration">s</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('start_schedule') + ':' }}  </span>
                            <span class="ml-18px">{{ select_charging_schedule.start_schedule_str }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('scheduling_unit') + ':' }}  </span>
                            <span class="ml-18px">{{ select_charging_schedule.charging_rate_unit }}</span>
                          </p>
                        </div>
                        <div class="info-item">
                          <p class="info-title">
                            <span class="font-700 text-blue-900">{{ t('min_charging_rate') + ':' }}  </span>
                            <span class="ml-18px">{{ select_charging_schedule.min_charging_rate }}</span>
                            <span class="ml-10px" v-if="select_charging_schedule.min_charging_rate">{{ select_charging_schedule.charging_rate_unit }}</span>
                          </p>
                        </div>
                      </div>
                      <div class="mb-24px bg-white px-14px py-20px rounded-2xl lg:w-50% min-w-400px">
                        <p class="font-bold pb-20px">{{ t('charging_schedule_period') }}</p>
                        <el-table :data="select_charging_schedule_period">
                          <el-table-column prop="start_period" :label="t('start_period')+'(s)'" align="center" min-width="100" />
                          <el-table-column prop="limit" :label="t('limit')" align="center" min-width="100" >
                            <template #header>
                              <span v-if="select_charging_schedule.charging_rate_unit">{{ t('limit') }} ({{ select_charging_schedule.charging_rate_unit }})</span>
                              <span v-else>{{ t('limit') }}</span>
                            </template>
                          </el-table-column>
                          <el-table-column prop="number_phases" :label="t('number_phases')" align="center" />
                        </el-table>
                      </div>
                    </div>
                  </div>

                </div>
              </el-tab-pane> -->
            </el-tabs>
          </el-col>
        </el-row>
      </div>
      </el-form>
      <div class="flex justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="CancelEvseEdit">
          {{ t('cancel') }}
        </el-button>
        <el-button 
          v-if="MStore.rule_permission.EVSEEdit.save === 'O' || MStore.permission.isCompany"  
          class="btn-secondary" @click="SaveEvseEdit(ruleFormRef)"> 
          {{ t('save') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evse-edit {
  width: 100%;
  height: 100%;
  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    .info-title {
      color: #566575;
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
  .fc-timegrid-slot-lane {
    border: 1px solid var(--gray-200);
  }
  .fc-timegrid-col {
    border: 1px solid var(--gray-200);
  }
  .fc-day {
    border-bottom: 1px solid var(--gray-200);
    .fc-timegrid-col-frame {
      border-bottom: 1px solid var(--gray-200);
    }
  }
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
:deep(.el-menu) {
  background-color: unset;
  border-bottom: 2px solid var(--gray-300);
  margin-bottom: 12px;
  .el-sub-menu {
    background-color: unset !important;
  }
  .el-menu-item:hover {
    background-color: var(--gray-200) !important;
    border-left: 0rem solid !important;
  }
  .el-menu-item.is-active {
    font-weight: 700;
    background-color: unset !important;
  }
  .el-menu-item span {
    font-size: 1.6rem !important;
    font-weight: bold;
  }
}
</style>
