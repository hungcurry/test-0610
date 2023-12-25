<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import CommpnFunc from '@/composables/CommonFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMStore } from '../stores/m_cloud'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import moment from "moment"
import tippy from 'tippy.js'
import "tippy.js/dist/tippy.css"
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const vat_select = ref('1')
const isCalendarMounted = ref(false)
const chargingCalendarRef = ref()
const parkingCalendarRef = ref()
const tariffObj = reactive([])
const multiTime = reactive([])
const charging_bgColor = '#61a8d8'
const parking_bgColor = '#94eadb'
const ruleFormRef = ref()

const calPrice = (select) => {
  if (select === '1') {
    new_element.value.price_price_incl = parseFloat(  (new_element.value.price_price * (1 + new_element.value.vat / 100) )  )
  }
  else {
    new_element.value.price_price = parseFloat(  (new_element.value.price_price_incl / (1 + new_element.value.vat / 100))   )
  }
}

const rules = reactive({
  custom_profile_name: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  currency: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
})

let eventCount = 1
let pressCloseIcon = false  // for Calendar close button

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
const overEventHeight = (startTimeStr, endTimeStr) => {
  let rowHeight = 24;
  let startTime = parseInt(startTimeStr.split(':')[0])*60 + parseInt(startTimeStr.split(':')[1])
  let endTime = parseInt(endTimeStr.split(':')[0])*60 + parseInt(endTimeStr.split(':')[1])
  let eventHeight = (endTime - startTime) / 60 * rowHeight
  if (eventHeight < 5 * rowHeight) {
    return true
  }
  return false
}

const handleTabClick = (tab) => {
  activeName.value = tab
  isCalendarMounted.value = false
  switch (activeName.value) {
    case 'three' :
      price_type_opeion = [{ value: 'ENERGY', label: t('charging_by_energy') }, { value: 'TIME', label: t('charging_by_time') }]
      fillFullCalendar()
      break

    case 'four' :
      price_type_opeion = [{ value: 'PARKING_TIME', label: t('parking_by_time') }]
      fillFullCalendar()
      break
    
    default :
      price_type_opeion = [{ value: 'ENERGY', label: t('charging_by_energy') }, { value: 'TIME', label: t('charging_by_time') }, { value: 'PARKING_TIME', label: t('parking_by_time') }]
      break
  }
}
const openDialog = () => {
  if (activeName.value === 'three' && new_element.value.price_type === '') {
    new_element.value.price_type = 'ENERGY'
  }
  else if (activeName.value === 'four') {
    new_element.value.price_type = 'PARKING_TIME'
  }
}
const closeDialog = () => {
  fillFullCalendar()
}

const fillFullCalendar = () => {
  tariffObj.length = 0
  Object.assign(tariffObj, tariff_elements)

  chargingCalendarOptions.events = []
  parkingCalendarOptions.events = []
  setTimeout(() => isCalendarMounted.value = true, 0)
  let price_excl_str = ''
  let price_incl_str = ''
  let startTime = ''
  let endTime = ''
  let daysOfWeek = []
  let chargingCount = 0
  let parkingCount = 0
  for (let i = 0; i < tariffObj.length; i++) {
    for (let j = 0; j < tariffObj[i].restrictions.day_of_week.length; j++) {
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
        shortTitle: overEventHeight(startTime, endTime),
        borderColor: setEventBgColor(charging_bgColor, chargingCount),
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
const handleEventCreate = (selectInfo) => {
  let calendarApi = selectInfo.view.calendar
  let startDay = new Date(selectInfo.start).getDay()
  let endDay = new Date(selectInfo.end).getDay()
  let startTime = moment(new Date(selectInfo.start)).format("HH:mm")
  let endTime = moment(new Date(selectInfo.end)).format("HH:mm")
  let startTimeStr = selectInfo.startStr 
  let endTimeStr = selectInfo.endStr

  let firstDayCount = 1
  let continueDayCount = 0
  let lastDayCount = 0

  let firstEndTimeStr = ''

  let secondEndTimeStr = ''

  eventCount = 1
  // calendarApi.unselect() // clear date selection
  calendarApi.addEvent({
    title: 'test',
    start: startTimeStr,
    end: endTimeStr,
  })

  // Set Sunday number as 7 
  if (startDay === 0) startDay = 7
  if (endDay === 0) endDay = 7

  // e.g. Mon 00:00 -> Sun 23:59
  if (endTime === '00:00') {
    endTime = '23:59'
    endDay === 1? endDay = 7 : endDay-=1
  }

  // set eventCount = 1 / 2 / 3, and firstDayCount / continueDayCount / lastDayCount
  if (startDay !== endDay) {
    if (startTime === '00:00' && endTime === '23:59') {
      eventCount = 1
      firstDayCount = endDay-startDay + 1
    }
    else if (startTime === '00:00' || endTime === '23:59' || (endDay-startDay) === 1){
      eventCount = 2
      if (startTime === '00:00') {
        firstDayCount = endDay-startDay
        lastDayCount = 1
      }
      else {
        firstDayCount = 1
        lastDayCount = endDay-startDay
      }
    }
    else {
      eventCount = 3
      firstDayCount = 1
      continueDayCount = endDay-startDay - 1
      lastDayCount = 1
    }
  }

  for (let i=0; i<eventCount; i++) {
    let timeZone = selectInfo.startStr.split("+")[1]

    // First event, set new_element
    if (i === 0) {
      if (eventCount !== 1) {
        if (firstDayCount === 1) {  // set endTimeStr as the next day of startStr, and endTime is 00:00
          let date = new Date(selectInfo.startStr)
          let nextTime = date.getTime() + 24*60*60*1000
          let tempTime = new Date(nextTime).toLocaleString()
          let nextDate = tempTime.replaceAll('/', '-').split(' ')[0]
          
          firstEndTimeStr = endTimeStr = nextDate + 'T00:00:00' + timeZone
        }
        else {    // set endTimeStr as the next day of endStr, and endTime is 00:00
          let date = new Date(selectInfo.endStr)
          let nextTime = date.getTime() + 24*60*60*1000
          let tempTime = new Date(nextTime).toLocaleString()
          let nextDate = tempTime.replaceAll('/', '-').split(' ')[0]
          
          firstEndTimeStr = endTimeStr = nextDate + 'T00:00:00' + timeZone
        }
        startTime = moment(new Date(selectInfo.start)).format("HH:mm")
        endTime = '23:59'
      }
      new_element.value.start_time = startTime
      new_element.value.end_time = endTime
      new_element.value.day_of_week = []
      for (let j=0; j<firstDayCount; j++) {
        let day = startDay + j
        if (day === 1) new_element.value.day_of_week.push('MONDAY')
        if (day === 2) new_element.value.day_of_week.push('TUESDAY')
        if (day === 3) new_element.value.day_of_week.push('WEDNESDAY')
        if (day === 4) new_element.value.day_of_week.push('THURSDAY')
        if (day === 5) new_element.value.day_of_week.push('FRIDAY')
        if (day === 6) new_element.value.day_of_week.push('SATURDAY')
        if (day === 7) new_element.value.day_of_week.push('SUNDAY')
      }
    }
    // Continue event, set multiTime
    else if (i !== eventCount-1) {
      startTimeStr = firstEndTimeStr
      secondEndTimeStr = endTimeStr = selectInfo.endStr.split("T")[0] + 'T00:00:00' + timeZone
      startTime = '00:00'
      endTime = '23:59'
      multiTime[i - 1] = []
      multiTime[i - 1].start_time = startTime
      multiTime[i - 1].end_time = endTime
      multiTime[i - 1].day_of_week = []
      for (let j=0; j<continueDayCount; j++) {
        let day = startDay + firstDayCount + j
        if (day === 1) multiTime[i - 1].day_of_week.push('MONDAY')
        if (day === 2) multiTime[i - 1].day_of_week.push('TUESDAY')
        if (day === 3) multiTime[i - 1].day_of_week.push('WEDNESDAY')
        if (day === 4) multiTime[i - 1].day_of_week.push('THURSDAY')
        if (day === 5) multiTime[i - 1].day_of_week.push('FRIDAY')
        if (day === 6) multiTime[i - 1].day_of_week.push('SATURDAY')
        if (day === 7) multiTime[i - 1].day_of_week.push('SUNDAY')
      }
    }
    // Last event, set multiTime
    else {
      startTimeStr = secondEndTimeStr
      endTimeStr = selectInfo.endStr
      startTime = '00:00'
      endTime = moment(new Date(selectInfo.end)).format("HH:mm")
      if (endTime === '00:00')  
        endTime = '23:59'
      multiTime[i - 1] = []
      multiTime[i - 1].start_time = startTime
      multiTime[i - 1].end_time = endTime
      multiTime[i - 1].day_of_week = []
      for (let j=0; j<lastDayCount; j++) {
        let day = startDay + firstDayCount + continueDayCount + j
        if (day === 1) multiTime[i - 1].day_of_week.push('MONDAY')
        if (day === 2) multiTime[i - 1].day_of_week.push('TUESDAY')
        if (day === 3) multiTime[i - 1].day_of_week.push('WEDNESDAY')
        if (day === 4) multiTime[i - 1].day_of_week.push('THURSDAY')
        if (day === 5) multiTime[i - 1].day_of_week.push('FRIDAY')
        if (day === 6) multiTime[i - 1].day_of_week.push('SATURDAY')
        if (day === 7) multiTime[i - 1].day_of_week.push('SUNDAY')
      }
    }
  }
  add_tariff_visible.value = true
  element_action.value = 'add'
  add_tariff_title.value = t('add_rate')
  new_element.value.price_type = ''
  new_element.value.vat = 5
  new_element.value.price_price = 0
  new_element.value.step_size = new_element.value.step_size_str = 1
  new_element.value.min_duration = new_element.value.max_duration = 0
  new_element.value.min_duration_str = new_element.value.max_duration_str =  0
}
const handleEventEdit = (clickInfo) => {
  add_tariff_visible.value = true
  element_action.value = 'edit'
  add_tariff_title.value = t('edit_rate')

  modifyIndex.value = clickInfo.event.extendedProps.index
  new_element.value.day_of_week.length =  0
  new_element.value.price_type = tariffObj[modifyIndex.value].price_components[0].type
  new_element.value.price_price = tariffObj[modifyIndex.value].price_components[0].price
  new_element.value.price_price_incl = tariffObj[modifyIndex.value].price_components[0].price * (1 + tariffObj[modifyIndex.value].price_components[0].vat / 100)
  // console.log(tariffObj[modifyIndex.value].price_components[0].step_size)
  // console.log(tariffObj[modifyIndex.value].price_components[0].price)
  // console.log(tariffObj[modifyIndex.value].price_components[0].price / (60 / (tariffObj[modifyIndex.value].price_components[0].step_size / 60)))
  if (new_element.value.price_type !== 'ENERGY') 
    new_element.value.step_size_str = tariffObj[modifyIndex.value].price_components[0].step_size / 60 
  else 
    new_element.value.step_size_str = tariffObj[modifyIndex.value].price_components[0].step_size
  new_element.value.vat = tariffObj[modifyIndex.value].price_components[0].vat
  new_element.value.min_duration_str = tariffObj[modifyIndex.value].restrictions.min_duration / 60
  new_element.value.max_duration_str = tariffObj[modifyIndex.value].restrictions.max_duration / 60
  new_element.value.start_time = tariffObj[modifyIndex.value].restrictions.start_time 
  new_element.value.end_time = tariffObj[modifyIndex.value].restrictions.end_time
  for (let i = 0; i < tariffObj[modifyIndex.value].restrictions.day_of_week.length; i++) {
    new_element.value.day_of_week.push(tariffObj[modifyIndex.value].restrictions.day_of_week[i]) 
  }
}
const handleEventDelete = (clickInfo) => {    // for Calendar close button
  if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
    modifyIndex.value = clickInfo.event.extendedProps.index
    new_element.value.day_of_week.length =  0
    new_element.value.price_type = tariffObj[modifyIndex.value].price_components[0].type
    new_element.value.price_price = tariffObj[modifyIndex.value].price_components[0].price
    if (new_element.value.price_type !== 'ENERGY') 
      new_element.value.step_size_str = tariffObj[modifyIndex.value].price_components[0].step_size / 60 
    else 
      new_element.value.step_size_str = tariffObj[modifyIndex.value].price_components[0].step_size
    new_element.value.vat = tariffObj[modifyIndex.value].price_components[0].vat
    new_element.value.min_duration_str =tariffObj[modifyIndex.value].restrictions.min_duration / 60
    new_element.value.max_duration_str =tariffObj[modifyIndex.value].restrictions.max_duration / 60
    new_element.value.start_time = tariffObj[modifyIndex.value].restrictions.start_time 
    new_element.value.end_time = tariffObj[modifyIndex.value].restrictions.end_time
    for (let i = 0; i < tariffObj[modifyIndex.value].restrictions.day_of_week.length; i++) {
      new_element.value.day_of_week.push(tariffObj[modifyIndex.value].restrictions.day_of_week[i]) 
    }
    editElement('delete')
    clickInfo.event.remove()
  }
}
const handleEventClick = (clickInfo) => {
  if (pressCloseIcon === true) {  // do delete, and reset flag
    pressCloseIcon = false
    handleEventDelete(clickInfo)
  }
  else {  // do edit
    handleEventEdit(clickInfo)
  }
}
const handleEventMouseEnter = (info) => {
  let index = info.event._def.extendedProps.index
  let type_str = tariffObj[index].price_components_type_str
  let vat_str = tariffObj[index].price_components[0].vat
  let step_size_str = tariffObj[index].price_components_step_size_str
  let price_excl_vat_str = tariffObj[index].price_components[0].price
  let price_incl_vat_str = tariffObj[index].price_components[0].price * (1 + vat_str / 100)
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

const chargingCalendarOptions = reactive({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  height: 'auto',  // 609px 602px
  initialView: 'timeGridWeek',
  editable: false,
  selectMirror: true,
  selectable: true,
  selectOverlap: false,
  allDaySlot: false,
  firstDay: 1,
  headerToolbar: false,
  slotMinTime: '00:00',
  slotMaxTime: '24:00',
  slotDuration: '00:60:00',
  slotLabelFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },
  slotLabelContent: info => info.text.replace(/24:00/g, '00:00'),   // can also try: locale: 'en-GB'
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
  eventClick: handleEventClick,
  select: handleEventCreate,
  eventContent: handleEventContent,
  eventMouseEnter: handleEventMouseEnter,
  // editable: true,
  // eventDrop: handleEventDrop,
  // validRange: selectValidRange,
})
const parkingCalendarOptions = reactive({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  height: 'auto',    // 609px 602px
  initialView: 'timeGridWeek',
  editable: false,
  selectMirror: true,
  selectable: true,
  selectOverlap: false,
  allDaySlot: false,
  firstDay: 1,
  headerToolbar: false,
  slotMinTime: '00:00',
  slotMaxTime: '24:00',
  slotDuration: '00:60:00',
  slotLabelFormat: {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  },
  slotLabelContent: info => info.text.replace(/24:00/g, '00:00'),   // can also try: locale: 'en-GB'
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
  eventClick: handleEventClick,
  select: handleEventCreate,
  eventContent: handleEventContent,
  eventMouseEnter: handleEventMouseEnter,
})

const router = useRouter()
const MsiApi = ApiFunc()
const MsiFunc = CommpnFunc()
const tariff_elements = reactive([])
const MStore = useMStore()

const new_element = ref({day_of_week:[]})
const element_action = ref('')
const route = useRoute()
const activeName = ref('one')
const add_tariff_title = ref(t('add_rate'))
const add_tariff_visible = ref(false)
const modifyIndex = ref(0)
const used_evse = reactive([])
const TariffData = reactive({})
const day = [{ label: 'Mon.', value: 'MONDAY' }, { label: 'Tue.', value: 'TUESDAY' }, { label: 'Wed.', value: 'WEDNESDAY' }, { label: 'Thu.', value: 'THURSDAY' },
{ label: 'Fri.', value: 'FRIDAY' }, { label: 'Sat.', value: 'SATURDAY' }, { label: 'Sun.', value: 'SUNDAY' }]
const tariff_currency_opeion = [{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' },{ value: 'CNY', label: 'CNY' }]
let price_type_opeion = [{ value: 'ENERGY', label: 'Charging By Energy' }, { value: 'TIME', label: 'Charging By Time' }, { value: 'PARKING_TIME', label: 'Parking By Time' }]

const addLanguage = ref(0)
const addLanguage_select = reactive([])
const languageOptions = [ {value: 'English', label: 'English',}, {value: 'Chinese',label: 'Chinese',}, {value: 'Japanese', label: 'Japanese',}  ]

const textarea_en = ref('')
const textarea_zh = ref('')
const textarea_jp = ref('')
const save_status = ref(false)
const tariff_id = route.query.id
const add_language = () => {
  addLanguage.value++
  addLanguage_select.push("")
}
const clear_alt_text = (item, index, type) => {

  if (type === 'input') {
    if (item.language === 'en') {
      textarea_en.value = undefined
    }
    else if (item.language === 'zh') {
      textarea_zh.value = undefined
    }
    else if (item.language === 'jp') {
      textarea_jp.value = undefined
    }
    TariffData.tariff_alt_text[index].text = undefined
  }
  else {
    addLanguage_select[index] = 'none'
  }
}

const seletcType = (type) => {
  if (type === 'ENERGY')
    new_element.value.step_size = 1
  else
    new_element.value.step_size = 0
}

const cancel_tariff = () => {
  router.push({ name: 'ratePlan' })
}
const save_tariff = async (formEl) => {
  if (!formEl) return
  let check_format_success = false
  await formEl.validate((valid) => {
    if (valid === true) 
      check_format_success = true
  })
  if (check_format_success === false) {
    return 
  }
  let new_tariff_alt_text = [{ language: 'en', text: textarea_en.value }, { language: 'zh', text: textarea_zh.value }, { language: 'jp', text: textarea_jp.value }]
  TariffData.elements = tariff_elements
  TariffData.class = 'Tariff'
  TariffData.type = 'AD_HOC_PAYMENT'
  TariffData.party_id = 'MSI'
  TariffData.country_code = 'TW'
  TariffData.custom = {name: TariffData.custom_profile_name, description : TariffData.custom_description}

  if (TariffData.min_price_str !== undefined && TariffData.min_price_str !== '') {
    TariffData.min_price = { excl_vat: parseInt(TariffData.min_price_str), incl_vat: parseInt(TariffData.min_price_str) }
  }
  else {
    delete TariffData.min_price
  }
  if (TariffData.max_price_str !== undefined && TariffData.max_price_str !== '') {
    TariffData.max_price = { excl_vat: parseInt(TariffData.max_price_str), incl_vat: parseInt(TariffData.max_price_str) }
  }
  else {
    delete TariffData.max_price
  }
  TariffData.tariff_alt_text = new_tariff_alt_text
  if (tariff_id) {
    ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
    .then(async () => {
      MsiFunc.deleteEmptyKeys(TariffData)
      save_status.value = true
      if (TariffData.elements.length > 0) {
        for(let i = 0; i < TariffData.elements.length; i++) {
          delete TariffData.elements[i].price_components_type_str
          delete TariffData.elements[i].price_components_step_size_str
          delete TariffData.elements[i].restrictions_max_duration_str
          delete TariffData.elements[i].restrictions_min_duration_str
          delete TariffData.elements[i].restrictions.day_of_week_str
          for (let j = 0; j < TariffData.elements[i].price_components.length; j++) {
            delete TariffData.elements[i].price_components[j].price_incl
          }
        }
      }
      let res = await MsiApi.setCollectionData('patch', 'ocpi', TariffData)
      if (res.status === 200)
        ElMessage.success(res.data.message)
      else {
        ElMessage.error(res.data.message)
      }
      router.push({ name: 'ratePlan' })
    })
  }
  else {
    ElMessageBox.confirm( t('do_you_want_to_create'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
    .then(async () => {
      MsiFunc.deleteEmptyKeys(TariffData)
      save_status.value = true
      if (TariffData.elements.length > 0) {
        for(let i = 0; i < TariffData.elements.length; i++) {
          delete TariffData.elements[i].price_components_type_str
          delete TariffData.elements[i].price_components_step_size_str
          delete TariffData.elements[i].restrictions_max_duration_str
          delete TariffData.elements[i].restrictions_min_duration_str
          delete TariffData.elements[i].restrictions.day_of_week_str
          for (let j = 0; j < TariffData.elements[i].price_components.length; j++) {
            delete TariffData.elements[i].price_components[j].price_incl
          }
        }
      }
      let res = await MsiApi.setCollectionData('post', 'ocpi', TariffData)
      if (res.status === 201) {
        ElMessage.success(res.data.message)
      }
      else {
        ElMessage.error(res.data.message)
      }
      router.push({ name: 'ratePlan' })
    })
  }
}

const ShowAddElementDialog = () => {
  add_tariff_visible.value = true
  element_action.value = 'add'
  add_tariff_title.value = t('add_rate')
  new_element.value.price_type = ''
  new_element.value.vat = 5
  new_element.value.price_price = 0
  new_element.value.price_price_incl = 0
  new_element.value.step_size = new_element.value.step_size_str = 1
  new_element.value.min_duration = new_element.value.max_duration = 0
  new_element.value.min_duration_str = new_element.value.max_duration_str =  0
  new_element.value.start_time = '00:00' 
  new_element.value.end_time = '23:59'
  new_element.value.day_of_week = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
}

const ShowEditElementDialog = (scope) => {
  add_tariff_visible.value = true
  element_action.value = 'edit'
  add_tariff_title.value = t('edit_rate')
  modifyIndex.value = scope.$index
  new_element.value.day_of_week.length =  0
  new_element.value.price_type = scope.row.price_components[0].type
  new_element.value.price_price = scope.row.price_components[0].price
  new_element.value.price_price_incl = scope.row.price_components[0].price * (1 + scope.row.price_components[0].vat / 100)
  if (new_element.value.price_type !== 'ENERGY') 
    new_element.value.step_size_str = scope.row.price_components[0].step_size / 60 
  else 
    new_element.value.step_size_str = scope.row.price_components[0].step_size
  new_element.value.vat = scope.row.price_components[0].vat
  new_element.value.min_duration_str = scope.row.restrictions.min_duration / 60
  new_element.value.max_duration_str = scope.row.restrictions.max_duration / 60
  new_element.value.start_time = scope.row.restrictions.start_time 
  new_element.value.end_time = scope.row.restrictions.end_time
  for (let i = 0; i < scope.row.restrictions.day_of_week.length; i++) {
    new_element.value.day_of_week.push(scope.row.restrictions.day_of_week[i]) 
  }
}

const editElement = (action) => {
  if (new_element.value.end_time === '00:00')
    new_element.value.end_time = '23:59'
  let tempArr = []
  for(let i = 0; i < new_element.value.day_of_week.length; i++) {
    tempArr.push(new_element.value.day_of_week[i])
  }
  if (new_element.value.price_type !== 'PARKING_TIME') {
    new_element.value.max_duration = new_element.value.min_duration = 0
  }

  if (new_element.value.price_type === "ENERGY")
    new_element.value.price_components_type_str = t('charging_by_energy')
  else if (new_element.value.price_type === "TIME")
    new_element.value.type_str = t('charging_by_time')
  else if (new_element.value.price_type === "PARKING_TIME")
    new_element.value.type_str = t('parking_by_time')

    new_element.value.min_duration = new_element.value.min_duration_str * 60
    new_element.value.max_duration = new_element.value.max_duration_str * 60
    if (new_element.value.price_type !== "ENERGY")
      new_element.value.step_size = new_element.value.step_size_str * 60
  new_element.value.price_price_incl = new_element.value.price_price *  (1 + (new_element.value.vat / 100))
  let modify_element = { price_components:[{ type:new_element.value.price_type, price:new_element.value.price_price, price_incl:new_element.value.price_price_incl,
                                            step_size:new_element.value.step_size, vat:new_element.value.vat} ],
                                            restrictions:{ min_duration:new_element.value.min_duration, max_duration:new_element.value.max_duration,
                                            start_time:new_element.value.start_time, end_time:new_element.value.end_time, day_of_week:tempArr
                                            }
                                          }
  if (action === 'add') {
    for (let i=0; i<eventCount; i++) {
      if (i !== 0) {
        tempArr = []
        for(let j = 0; j < multiTime[i - 1].day_of_week.length; j++) {
          tempArr.push(multiTime[i - 1].day_of_week[j])
        }
        modify_element = {
          price_components:[{ type:new_element.value.price_type, price:new_element.value.price_price, price_incl:new_element.value.price_price_incl,
            step_size:new_element.value.step_size, vat:new_element.value.vat} ],
          restrictions:{ min_duration:new_element.value.min_duration, max_duration:new_element.value.max_duration,
            start_time:multiTime[i - 1].start_time, end_time:multiTime[i - 1].end_time, day_of_week:tempArr
          }
        }
      }
      let element = JSON.parse(JSON.stringify(modify_element))
      if (element.price_components[0].type === "ENERGY") {
        element.price_components_type_str = t('charging_by_energy')
        element.price_components_step_size_str = 1 
        element.price_components[0].step_size = 1 
      }
      else if (element.price_components[0].type === "TIME") {
        element.price_components_type_str = t('charging_by_time')
        element.price_components_step_size_str = new_element.value.step_size / 60
      }
      else if (element.price_components[0].type === "PARKING_TIME") {
        element.price_components_type_str = t('parking_by_time')
        element.price_components_step_size_str = new_element.value.step_size / 60
        element.restrictions_min_duration_str = new_element.value.min_duration / 60
        element.restrictions_max_duration_str = new_element.value.max_duration / 60
      }
      else if (element.price_components[0].type === '') {   // Invalid data, don't push to tariff_elements
        add_tariff_visible.value = false
        eventCount = 1
        return
      }
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

      tariff_elements.push(element)
    }
    eventCount = 1
  }
  else if (action === 'edit') {
    tariff_elements[modifyIndex.value] = modify_element
    if (tariff_elements[modifyIndex.value].price_components[0].type === "ENERGY") {
      tariff_elements[modifyIndex.value].price_components_type_str = t('charging_by_energy')
      tariff_elements[modifyIndex.value].price_components_step_size_str = 1
      tariff_elements[modifyIndex.value].price_components[0].step_size = 1  
    }
    else if (tariff_elements[modifyIndex.value].price_components[0].type === "TIME") {
      tariff_elements[modifyIndex.value].price_components_type_str = t('charging_by_time')
      tariff_elements[modifyIndex.value].price_components_step_size_str = modify_element.price_components[0].step_size / 60
    }
    else if (tariff_elements[modifyIndex.value].price_components[0].type === "PARKING_TIME") {
      tariff_elements[modifyIndex.value].price_components_type_str = t('parking_by_time')
      tariff_elements[modifyIndex.value].price_components_step_size_str = modify_element.price_components[0].step_size / 60
      tariff_elements[modifyIndex.value].restrictions_min_duration_str = modify_element.restrictions.min_duration / 60
      tariff_elements[modifyIndex.value].restrictions_max_duration_str = modify_element.restrictions.max_duration / 60
    }
    let day_of_week_str = []
    for (const day of tariff_elements[modifyIndex.value].restrictions.day_of_week) {
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
      tariff_elements[modifyIndex.value].restrictions.day_of_week_str = day_of_week_str
  }
  else if (action === 'delete') {
    tariff_elements.splice(modifyIndex.value, 1)
  }
  add_tariff_visible.value = false
}

const status_filter_item = [
  { text: t('available'), value: 'AVAILABLE' },
  { text: t('charging'), value: 'CHARGING' },
  { text: t('offline'), value: 'UNKNOWN' },
  { text: t('error'), value: 'ERROR' },
]
const status_filter = (value, rowData) => {
  return rowData.status === value
}
const goToEvseDetail = async(detail) => {
  router.push({name: 'evseDetail', query: { evse_id: detail.uid }})
}

onMounted(async () => {
  if (tariff_id) {
    let queryData = { "database": "OCPI", "collection": "Tariff", "query": { "_id": { "ObjectId": tariff_id } } }
    let res = await MsiApi.mongoQuery(queryData)
    Object.assign(TariffData, res.data.all[0])
    TariffData.custom_profile_name = TariffData?.custom?.name
    TariffData.custom_description = TariffData?.custom?.description
    for (let i = 0; i < TariffData?.tariff_alt_text?.length; i++) {
      if (TariffData.tariff_alt_text[i].language === 'en') {
        textarea_en.value = TariffData.tariff_alt_text[i].text
      }
      else if (TariffData.tariff_alt_text[i].language === 'zh') {
        textarea_zh.value = TariffData.tariff_alt_text[i].text
      }
      else if (TariffData.tariff_alt_text[i].language === 'jp') {
        textarea_jp.value = TariffData.tariff_alt_text[i].text
      }
    }
    Object.assign(tariff_elements, TariffData.elements)
    tariff_elements.forEach((item)=>{
      item.price_components[0].price_incl = item.price_components[0].price *  (1 + (item.price_components[0].vat / 100))
      if (item.price_components[0].type === "ENERGY") {
        item.price_components_type_str = t('charging_by_energy')
        item.price_components_step_size_str = item.price_components[0].step_size
      }
      else if (item.price_components[0].type === "TIME") {
        item.price_components_type_str = t('charging_by_time')
        item.price_components_step_size_str = item.price_components[0].step_size / 60
      }
      else if (item.price_components[0].type === "PARKING_TIME") {
        item.price_components_type_str = t('parking_by_time')
        item.price_components_step_size_str = item.price_components[0].step_size / 60
        item.restrictions_min_duration_str = item.restrictions.min_duration / 60
        item.restrictions_max_duration_str = item.restrictions.max_duration / 60
      }
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
    })
    TariffData.min_price_str = TariffData?.min_price?.incl_vat
    TariffData.max_price_str = TariffData?.max_price?.incl_vat
    queryData = {
      "database": "OCPI", "collection": "Tariff", "pipelines": [
        { $match: { "_id": { "ObjectId": tariff_id } } }, { "$project": { "id": 1, } }
      ]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    queryData = {
      "database": "OCPI", "collection": "Connector", "pipelines": [
        { $match: { "tariff_ids": { "UUID": response.data.result[0].id } } }, { "$project": { "_id": 1, } }
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    let used_connector = response.data.result

    queryData = {
      "database": "OCPI", "collection": "EVSE", "pipelines": [
        { "$project": { "byCompany": 0}}
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    let evse = response.data.result

    for (let i = 0; i < used_connector.length; i++) {
      for (let j = 0; j < evse.length; j++) {
        if (used_connector[i]._id === evse[j].connectors[0]) {
          let localTime = new Date(new Date(evse[j].last_updated).getTime() + MStore.timeZoneOffset * -60000)
          switch (evse[j].status) {
            case 'AVAILABLE':
              evse[j].status_str = t('available')
            break
            case 'CHARGING':
              evse[j].status_str = t('charging')
            break
            case 'UNKNOWN':
              evse[j].status_str = t('offline')
            break
            case 'OUTOFORDER':
              evse[j].status_str = t('error')
            break
            default:
              evse[j].status_str = t('others')
          }
          let evse_data = {
            _id: evse[j]._id,
            uid: evse[j].uid,
            evse_id: evse[j].evse_id,
            status_str: evse[j].status_str,
            status: evse[j].status,
            floor_level: evse[j].floor_level,
            last_updated: moment(localTime).format('YYYY-MM-DD HH:mm:ss'),
          }
          used_evse.push(evse_data)
        }
      }
    }
  }
})
</script>

<template>
  <div class="tariff-detail">
    <div class="container lg flex-col wh-full">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-36px"> {{ t('rate_profile_details') }}</p>
        <el-button 
          v-if="MStore.rule_permission.RatePlanDetail.addRatePlan === 'O' || MStore.permission.isCompany"  
          class="btn-secondary box-shadow mt-4 md:mt-0 md:ml-30px box-shadow" @click="ShowAddElementDialog"> {{ t('add_rate') }} </el-button>
      </div>

      <div class="tabs flex-grow">
        <el-tabs v-model="activeName" @tab-change="handleTabClick">
          <el-tab-pane :label="t('general')" name="one">
            <div class="pb-24px sm:flex-col lg:flex-row">
              <div class="left mt-24px lg:mr-40px 2xl:w-350px">
                <el-form class="flex-col" :rules="rules" :model="TariffData" ref="ruleFormRef" >
                  <el-form-item class="mb-24px lg-w-full" :label="t('plan_name')" prop="custom_profile_name">
                    <el-input v-model="TariffData.custom_profile_name"/>
                  </el-form-item>
                  <el-form-item class="mb-24px lg-w-full" :label="t('currency')" prop="currency">
                    <el-select v-model="TariffData.currency" placeholder="Select" size="large" class="w-full 2xl:w-350px">
                      <el-option v-for="item in tariff_currency_opeion" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item class="mb-24px lg-w-full" :label="t('min_price')">
                    <el-input v-model.trim="TariffData.min_price_str"/>
                  </el-form-item>
                </el-form>
              </div>
              <div class="v-line"></div>

              <div class="right w-full flex-col mt-24px lg:ml-20px">
                <div class="flex justify-between">
                  <p class="text-secondary text-22px lg:ml-20px"> {{ t('rate_description') }}</p>
                </div>
                <div class="card-container w-full max-h-95% flex flex-wrap overflow-y-auto">
                  <div class="w-full flex flex-wrap overflow-y-auto">
                    <div class="card ml-20px mt-20px rounded-5px">
                      <el-input v-model="TariffData.custom_description" :rows="10" type="textarea" class="mt-8px rounded-5px"/>
                    </div>
                  </div>
                </div>
              </div>


              <!-- <div class="right w-full flex-col mt-24px lg:ml-20px">
                <div class="flex justify-between">
                  <p class="text-secondary text-22px lg:ml-20px"> {{ t('rate_description') }}</p>
                  <el-button class="add-lang-button" @click="add_language"> {{ t('add_language') }} </el-button>
                </div>
                <div class="card-container w-full max-h-85% flex flex-wrap overflow-y-auto">
                  <el-skeleton v-if="save_status" :rows="3" animated class="flex w-full">
                    <template #template>
                      <el-skeleton-item variant="card" class="w-200px h-200px" />
                    </template>
                  </el-skeleton>
                  <div v-else class="w-full flex flex-wrap overflow-y-auto">
                    <template v-for="(item, index) in TariffData.tariff_alt_text" :key="item">
                      <div v-if="item.text !== undefined" class="card ml-20px mt-20px rounded-5px">
                        <div class="pl-15px h-40px bg-blue-1200 text-white text-15px line-height-40px rounded-5px"> 
                          <span v-if="item.language === 'en'">English</span>
                          <span v-if="item.language === 'zh'">Chinese</span>
                          <span v-if="item.language === 'jp'">Japanese</span>
                        </div>
                        <el-input v-if="item.language === 'en'"
                          v-model="textarea_en" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="1. Charging Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $10/per kWh; Time: 18:00 ~ 07:59 TWD $6/per kWh Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $6/per kWh 
  2. Parking Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $40/per hour; Time: 18:00 ~ 07:59 TWD $20/per hour Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $20/per hour"/>
                        <el-input v-else-if="item.language === 'zh'"
                          v-model="textarea_zh" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="1. 充電費 平日：星期一到星期五 時間：早上八點到晚上六點費用：一度電10元；時間：晚上六點到早上八點  費用：一度電6元 假日：星期六到星期日 時間：00:00 ~23:59 費用：一度電6元
  2. 停車費 平日：星期一到星期五 時間：早上八點到晚上六點 費用：每小時40元；時間：晚上六點到早上八點 費用：每小時20元 假日：星期六到星期日 時間：00:00 ~23:59 費用：每小時20元"/>
                        <el-input v-else-if="item.language === 'jp'"
                          v-model="textarea_jp" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="..."/>
                        <img src="@/assets/img/station_edit_close.png" class="close-btn w-20px h-20px" @click="clear_alt_text(item, index, 'input')">
                      </div>
                    </template>
  
                    <template v-for="item in addLanguage" :key="item">
                      <div v-if="addLanguage_select[item] !== 'none'" class="card ml-20px mt-20px rounded-5px">
                        <el-select v-model="addLanguage_select[item]" placeholder="Select" size="large" class="w-full">
                          <el-option v-for="item2 in languageOptions" :key="item2.value" :label="item2.label" :value="item2.value" />
                        </el-select>
                        <el-input 
                          v-if="addLanguage_select[item] === 'English'"
                          v-model="textarea_en" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="..."/>
                        <el-input 
                          v-else-if="addLanguage_select[item] === 'Chinese'"
                          v-model="textarea_zh" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="..."/>
                        <el-input 
                          v-else-if="addLanguage_select[item] === 'Japanese'"
                          v-model="textarea_jp" 
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="..."/>
                        <el-input 
                          v-else
                          :rows="10" 
                          type="textarea" 
                          class="mt-8px rounded-5px"
                          placeholder="...">
                        </el-input>
                        <img src="@/assets/img/station_edit_close.png" class="close-btn w-20px h-20px" @click="clear_alt_text(addLanguage_select[item], item, 'select')">
                      </div>
                    </template>
                  </div>
                </div>
              </div> -->
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('rate')" name="two">
            <el-table 
              :data="tariff_elements" 
              class="white-space-nowrap text-primary"
              height="calc(100vh - 340px)"
              style="width: 100%"
              stripe 
              size="large"
              empty=""
              :cell-style=msi.tb_cell
              :header-cell-style=msi.tb_header_cell 
            >
              <el-table-column
                prop="price_components_type_str"
                :label="t('type')"
                sortable
                min-width="180"
                align="center"
              />
              <el-table-column
                prop="price_components[0].price"
                :label="t('price_excl_vat')"
                sortable
                min-width="150"
                align="center"
              />
              <el-table-column
                prop="price_components[0].price_incl"
                :label="t('price_incl_vat')"
                sortable
                min-width="150"
                align="center"
              />
              <el-table-column
                prop="price_components[0].vat"
                :label="t('vat')"
                sortable
                min-width="80"
                align="center"
              />
              <el-table-column
                prop="price_components_step_size_str"
                :label="t('unit')"
                sortable
                min-width="80"
                align="center"
              />
              <el-table-column
                prop="restrictions.start_time"
                :label="t('start_time')"
                sortable
                min-width="120"
                align="center"
              />
              <el-table-column
                prop="restrictions.end_time"
                :label="t('end_time')"
                sortable
                min-width="120"
                align="center"
              />
              <el-table-column
                prop="restrictions_min_duration_str"
                :label="t('active_minute')"
                sortable
                min-width="150"
                align="center"
              />
              <el-table-column
                prop="restrictions_max_duration_str"
                :label="t('deactivate_minute')"
                sortable
                min-width="180"
                align="center"
              />
              <el-table-column
                prop="restrictions.day_of_week_str"
                :label="t('day_of_week')"
                sortable
                min-width="150"
                
              />
              <el-table-column
                prop="detail"
                label=""
                align="center"
                min-width="100"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="ShowEditElementDialog(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>


          <el-tab-pane :label="t('charging_rate')" name="three">
            <div class="overflow-x-auto pb-8px">
              <FullCalendar v-if="isCalendarMounted" ref="chargingCalendarRef" :options="chargingCalendarOptions" class="min-w-992px">
              </FullCalendar>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('parking_rate')" name="four">
            <div class="overflow-x-auto pb-8px">
              <FullCalendar v-if="isCalendarMounted" ref="parkingCalendarRef" :options="parkingCalendarOptions" class="min-w-992px">
              </FullCalendar>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('evse_list')" name="five">
            <!-- <p v-for="item in used_evse" :key="item" :label="item" :value="item" class="mt-18px"> {{ item.evse_id }}</p> -->
            <el-table 
              :data="used_evse" 
              class="white-space-nowrap text-primary"
              height="calc(100vh - 340px)"
              style="width: 100%"
              stripe 
              size="large"
              empty=""
              :cell-style=msi.tb_cell
              :header-cell-style=msi.tb_header_cell 
            >
              <el-table-column
                prop="evse_id"
                :label="t('evse_id')"
                sortable
                min-width="200"
              />
              <el-table-column
                prop="status"
                :label="t('status')"
                :filters="status_filter_item"
                :filter-method="status_filter"
                min-width="150"
              >
                <template #default="scope">
                  <p
                    class="available"
                    v-if="scope.row.status === 'AVAILABLE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="charging"
                    v-else-if="scope.row.status === 'CHARGING'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="offline"
                    v-else-if="scope.row.status === 'UNKNOWN'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error"
                    v-else-if="scope.row.status === 'OUTOFORDER'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                </template>
              </el-table-column>
              <el-table-column
                prop="floor_level"
                :label="t('floor_level')"
                min-width="150"
              />
              <el-table-column
                prop="last_updated"
                :label="t('last_updated')"
                sortable
                min-width="200"
              />
              <el-table-column
                prop="detail"
                label=""
                align="center"
                min-width="100"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="goToEvseDetail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

        </el-tabs>
      </div>

      <div class="flex justify-center mb-44px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="cancel_tariff"> {{t('cancel')}} </el-button>
        <el-button 
          v-if="MStore.rule_permission.RatePlanDetail.save === 'O' || MStore.permission.isCompany"  
          class="btn-secondary" @click="save_tariff(ruleFormRef)"> {{t('save')}} </el-button>
      </div>

      <el-dialog 
        v-model="add_tariff_visible" 
        class="max-w-600px flex-col h-95%"
        :show-close="true"
        width="90%"
        destroy-on-close
        center
        @open='openDialog'
        @close='closeDialog'
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ add_tariff_title }}
            </h4>
          </div>
        </template>

        <div class="dialog-context">
          <el-form class="max-w-500px m-auto">
            <el-form-item class="mb-24px" :label= "t('type')">
              <el-select v-model="new_element.price_type" placeholder="Select" size="large" class="w-full"
                @change="seletcType">
                <el-option v-for="item in price_type_opeion" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <div class="v-line1 mt-12px mb-12px"></div>

            <div v-for="(item, index) in eventCount" :key="item">
              <div v-if="index === 0">
                <el-form-item class="time-select mb-24px" :label="t('time')">
                  <div class="flex justify-between flex-items-center w-full">
                    <el-time-select v-model="new_element.start_time" :max-time="new_element.end_time" placeholder="Start time" class="w-220px"
                  start="00:00" step="00:30" end="24:00" />
                    <div class="time-line"></div>
                    <el-time-select v-model="new_element.end_time" :min-time="new_element.start_time" placeholder="End time" class="w-220px"
                    start="00:00" step="00:30" end="24:00" />
                  </div>
                </el-form-item>
                <el-form-item class="time-select mb-24px" :label="t('applied_day_of_week')">
                  <el-checkbox-group v-model="new_element.day_of_week" size="large" class="w-full flex justify-between" fill="#414c58">
                    <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value" class="week-btn"> {{ week.label }}
                    </el-checkbox-button>
                  </el-checkbox-group>
                </el-form-item>
              </div>
              <div v-else>
                <div class="v-line2"></div>
                <el-form-item class="time-select mb-24px" :label="t('time')">
                  <div class="flex justify-between flex-items-center w-full">
                    <el-time-select v-model="multiTime[index-1].start_time" :max-time="multiTime[index-1].end_time" placeholder="Start time" class="w-220px"
                  start="00:00" step="00:30" end="24:00" />
                    <div class="time-line"></div>
                    <el-time-select v-model="multiTime[index-1].end_time" :min-time="multiTime[index-1].start_time" placeholder="End time" class="w-220px"
                    start="00:00" step="00:30" end="24:00" />
                  </div>
                </el-form-item>
                <el-form-item class="time-select mb-24px" :label="t('applied_day_of_week')">
                  <el-checkbox-group v-model="multiTime[index-1].day_of_week" size="large" class="w-full flex justify-between" fill="#414c58">
                    <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value" class="week-btn"> {{ week.label }}
                    </el-checkbox-button>
                  </el-checkbox-group>
                </el-form-item>
              </div>
            </div>

            <div class="v-line1 mt-12px mb-12px"></div>

            <div v-if="new_element.price_type !== ''">
              

              <el-radio-group v-model="vat_select" @change="calPrice(vat_select)">
                <el-radio label="1" size="large">{{ t('price_excl_vat') }}</el-radio>
                <el-radio label="2" size="large">{{ t('price_incl_vat') }}</el-radio>
              </el-radio-group>
                <div v-if="vat_select === '1'">
                  <el-form-item class="mb-24px" :label="t('price_excl_vat')">
                  <el-input v-if="new_element.price_type === 'ENERGY'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('kwh') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'TIME'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)" >
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'PARKING_TIME'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span>{{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
                </el-form-item>
              </div>

              <div v-else>
                  <el-form-item class="mb-24px" :label="t('price_incl_vat')">
                  <el-input v-if="new_element.price_type === 'ENERGY'" v-model="new_element.price_price_incl" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('kwh') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'TIME'" v-model="new_element.price_price_incl" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'PARKING_TIME'" v-model="new_element.price_price_incl" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)" >
                  <template #prefix>
                    <span>{{ TariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span>{{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
                </el-form-item>
              </div>


              <div class="flex justify-between">
                <el-form-item class="mb-24px" :label="t('unit')">
                  <el-input v-if="new_element.price_type === 'ENERGY'" v-model="new_element.step_size_str" type="number" class="w-220px" :controls="false" disabled >
                    <template #suffix>
                      <span> {{ '/' + t('wh') }} </span>
                    </template>
                  </el-input>
  
                  <div v-else-if="new_element.price_type === 'TIME'">
                    <el-input v-model="new_element.step_size_str" type="number" class="w-220px" :controls="false" >
                      <template #suffix>
                        <span> {{ t('min') }}</span>
                      </template>
                    </el-input>
                  </div>
  
                  <div v-else-if="new_element.price_type === 'PARKING_TIME'">
                    <el-input v-model="new_element.step_size_str" type="number" class="w-220px" :controls="false" >
                      <template #suffix>
                        <span> {{  t('min') }}</span>
                      </template>
                    </el-input>
                  </div>
                  
                </el-form-item>
                <el-form-item class="mb-24px" :label="t('vat')">
                  <el-input v-model="new_element.vat" type="number" class="w-220px" :controls="false" >
                    <template #suffix>
                      <span>%</span>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <div v-if="new_element.price_type === 'PARKING_TIME'" class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('active_minute')">
                <!-- <el-input-number v-model="new_element.min_duration" :controls="false" /> -->
                <el-input v-model="new_element.min_duration_str" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('deactivate_minute')">
                <!-- <el-input-number v-model="new_element.max_duration" :controls="false" /> -->
                <el-input v-model="new_element.max_duration_str" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <template #footer>
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="editElement('cancel')"> {{ t('cancel') }}</el-button>
          <template v-if="element_action === 'add'">
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px mb-44px" @click="editElement('add')"> {{ t('create') }}</el-button>
          </template>
          <template v-else>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="editElement('delete')"> {{ t('delete') }}</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px mb-44px" @click="editElement('edit')">{{ t('modify') }}</el-button>
          </template>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<style lang="scss" scoped >

.tariff-detail {
  height: 100%;
  .v-line {
    // border-left: thick solid rgb(226, 234, 242);
    border-top: thick solid rgb(226, 234, 242);
    @media (min-width: 992px) {
      border-left: thick solid rgb(226, 234, 242);
    }
  }
  .v-line1 {
    margin-top: 24px;
    border-top: thick solid rgb(226, 234, 242);
    height: 10px;
  }
  .v-line2 {
    border-top: thick solid rgb(241, 241, 241);
  }
  .add-lang-button {
    width: 15rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--secondary);
    border-color: var(--secondary);
    border-radius: 2rem;
  }
  .card-container {
    .card {
      position: relative;
      width: 30%;
      min-width: 200px;
      background-color: var(--gray-100);
      padding: 16px;
      :deep(.el-input__wrapper) {
        width: 314px;
      }
    }
    .close-btn {
      position: absolute;
      background-color: var(--blue-1100);
      border-radius: 50%;
      padding: 2px;
      top: -8px;
      right: -8px;
    }

    :deep(.el-textarea__inner) {
      background-color: var(--blue-1200);
      color: var(--white);
    }
  }

  .dialog-context {
    max-height: calc(100vh - 30rem);
    :deep(.el-input__inner) {
      text-align: center;
    }
    :deep(.el-input__suffix) {
      width: 30px;
      justify-content: flex-end;
    }
  }

  .time-select {
    .time-line {
      margin: 0 5px;
      border-top: 2px solid var(--blue-1200);
      width: 15px;
    }
    :deep(.el-input__inner) {
      padding-left: 20px;
    }
  }
  .week-btn {
    width: 12%;
    :deep(.el-checkbox-button__inner) {
      width: 100%;
      padding: 8px 0px;
      border-radius: 0.5rem;
    }

    :deep(.el-checkbox-button__inner) {
      background-color: var(--gray-300);
      color: var(--white);
    }
  }
}

:deep(.el-dialog__body) {
  flex-grow: 1;
}
.el-form-item {
  display: block;
}
:deep(.el-form-item__label) {
  display: block;
  font-size: 1.6rem;
}
:deep(.el-input__wrapper) {
  height: 38px;
  .el-icon {
    top: 0;
    right: 0;
    color: var(--white);
    width: 2rem;
  }
  ::-webkit-outer-spin-button {
    -webkit-appearance: none !important;
  }
  ::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
  }
}



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

// for charging rate fullCalendar width
// :deep(.fc-scrollgrid) {
//   .fc-scroller {
//     table {
//       width: 100% !important;
//     }
//   }
//   .fc-timegrid-body {
//     width: 100% !important;
//     table {
//       width: 100% !important;
//     }
//   }
// }
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
  height: 24px;
  line-height: 24px;
  border-radius: 5px;
}

.close-calendar-btn {
  position: absolute;
  top: -15px;
  right: -10px;
  background-color: var(--blue-1100);
  border-radius: 50%;
  padding: 2px;
}
</style>