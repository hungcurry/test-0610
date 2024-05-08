<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { useMStore } from '../stores/m_cloud'
import { ElMessageBox, ElMessage } from 'element-plus'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import moment from "moment"
import tippy from 'tippy.js'
import "tippy.js/dist/tippy.css"
import { useI18n } from 'vue-i18n'

const env = ref('')
env.value = import.meta.env.VITE_NAME

let tariffData = []
let connectorData = []
let evseData = []
let tariffElementsData = []
let eventCount = 1
let select_element_index = 0

const displayRestrictions = ref(false)
const renderEvseListData = reactive([])
const renderTariffData = reactive({})
const renderTariffElementsData = reactive([])
const renderElementDetail = reactive({price_components:[],restrictions:{}})
const add_element = ref(false)

const { t } = useI18n()
const vat_select = ref('1')
const isCalendarMounted = ref(false)
const chargingCalendarRef = ref()
const parkingCalendarRef = ref()
const ElementsData = reactive([])
const multiTime = reactive([])
const charging_bgColor = '#61a8d8'
const parking_bgColor = '#94eadb'
const ruleFormRef = ref()
const ruleFormRef1 = ref()

const router = useRouter()
const MsiApi = ApiFunc()
const MStore = useMStore()

const new_element = reactive({day_of_week:[]})
const element_action = ref('')
const route = useRoute()
const activeName = ref('one')
const element_title = ref(t('add_rate'))
const element_detail_visible = ref(false)
const element_detail_visible1 = ref(false)
const element_restrictions_visible = ref(false)
const modifyIndex = ref(0)
const tariff_id = route.query.id
const day = [{ label: 'Mon.', value: 'MONDAY' }, { label: 'Tue.', value: 'TUESDAY' }, { label: 'Wed.', value: 'WEDNESDAY' }, { label: 'Thu.', value: 'THURSDAY' },
{ label: 'Fri.', value: 'FRIDAY' }, { label: 'Sat.', value: 'SATURDAY' }, { label: 'Sun.', value: 'SUNDAY' }]
const tariff_currency_opeion = [{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' },{ value: 'CNY', label: 'CNY' }]
let price_type_opeion = [ { value: 'ENERGY', label: 'Charging By Energy' }, { value: 'TIME', label: 'Charging By Time' }, { value: 'PARKING_TIME', label: 'Parking By Time' }, 
                          // { value: 'FLAT', label: 'FLAT' }, { value: 'PARKING_LOT_TIME', label: 'PARKING_LOT_TIME' }
                        ]

const statusMap = {
  [t('available')]: { class: 'available' },
  [t('charging')]: { class: 'charging' },
  [t('offline')]: { class: 'offline' },
  [t('error')]: { class: 'error' },
}

const formatNumber = (num, round) => {
  const formattedNum = num.toFixed(round)
  const withoutTrailingZeros = formattedNum.replace(/\.?0+$/, '')
  return parseFloat(withoutTrailingZeros)
}

const convertEvseStatusString = (item) => {
  switch (item) {
    case 'AVAILABLE':                     return t('available')
    case 'CHARGING':                      return t('charging')
    case 'UNKNOWN':                       return t('offline')
    case 'OUTOFORDER':                    return t('error')
    default:                              return t('others')
  }
}

const convertTypeString = (item) => {
  switch (item) {
    case 'ENERGY':                        return t('charging_by_energy')
    case 'TIME':                          return t('charging_by_time')
    case 'PARKING_TIME':                  return t('parking_by_time')
    case 'FLAT':                          return (item)
    default:                              return (item)
  }
}

const reConvertTypeString = (item) => {
  switch (item) {
    case t('charging_by_energy'):         return 'ENERGY'
    case t('charging_by_time'):           return 'TIME'
    case t('parking_by_time'):            return 'PARKING_TIME'
    case t('flat'):                       return 'FLAT'
    default:                              return ('item')
  }
}

const convertDayString = (item) => {
  switch (item) {
    case 'MONDAY':                        return t('mon')
    case 'TUESDAY':                       return t('tue')
    case 'WEDNESDAY':                     return t('wed')
    case 'THURSDAY':                      return t('thu')
    case 'FRIDAY':                        return t('fri')
    case 'SATURDAY':                      return t('sat')
    case 'SUNDAY':                        return t('sun')   
  }
}

const reConverDayString = (item) => {
  switch (item) {
    case t('mon'):                        return 'MONDAY'
    case t('tue'):                        return 'TUESDAY'
    case t('wed'):                        return 'WEDNESDAY'
    case t('thu'):                        return 'THURSDAY'
    case t('fri'):                        return 'FRIDAY'
    case t('sat'):                        return 'SATURDAY'
    case t('sun'):                        return 'SUNDAY'
  }
}

const rules = reactive({
  name: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  currency: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
})

const rules1 = reactive({
  type: [{ required: true, message: '' }],
  price: [{ required: true, message: ''}],
  unit: [{ required: true,  message: ''},],
})

const calPrice = (select) => {
  if (select === '1') {
    new_element.price_price_incl = parseFloat(  (new_element.price_price * (1 + new_element.vat / 100) )  )
  }
  else {
    new_element.price_price = parseFloat(  (new_element.price_price_incl / (1 + new_element.vat / 100))   )
  }
}

const calPrice1 = (incl_vat, index) => {
  if (renderElementDetail.price_components[index].price !== null) {
    if (incl_vat) 
      renderElementDetail.price_components[index].price = formatNumber(renderElementDetail.price_components[index].price * (1 + renderElementDetail.price_components[index].vat / 100), 4)
    else 
      renderElementDetail.price_components[index].price = formatNumber(renderElementDetail.price_components[index].price / (1 + renderElementDetail.price_components[index].vat / 100), 4 )
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

const overEventHeight = (startTimeStr, endTimeStr) => {
  let rowHeight = 24;
  let startTime = parseInt(startTimeStr.split(':')[0]) * 60 + parseInt(startTimeStr.split(':')[1])
  let endTime = parseInt(endTimeStr.split(':')[0]) * 60 + parseInt(endTimeStr.split(':')[1])
  let eventHeight = (endTime - startTime) / 60 * rowHeight
  if (eventHeight < 5 * rowHeight)
    return true
  else
    return false
}

const handleTabClick = (tab) => {
  activeName.value = tab
  isCalendarMounted.value = false
  switch (activeName.value) {
    case 'three' :
      price_type_opeion = [{ value: 'ENERGY', label: t('charging_by_energy') }, { value: 'TIME', label: t('charging_by_time') }, 
                          //  { value: 'FLAT', label: 'FLAT' }
                          ]
      fillFullCalendar()
      break
    case 'four' :
      price_type_opeion = [{ value: 'PARKING_TIME', label: t('parking_by_time') }
                          // , { value: 'PARKING_LOT_TIME', label: 'PARKING_LOT_TIME' }, { value: 'FLAT', label: 'FLAT' }
                          ]
      fillFullCalendar()
      break
    default :
      price_type_opeion = [ { value: 'ENERGY', label: 'Charging By Energy' }, { value: 'TIME', label: 'Charging By Time' }, 
                            { value: 'PARKING_TIME', label: 'Parking By Time' }, 
                            // { value: 'FLAT', label: 'FLAT' }, { value: 'PARKING_LOT_TIME', label: 'PARKING_LOT_TIME' }
                          ]
      break
  }
}

const openDialog = () => {
  if (activeName.value === 'three' && new_element.price_type === '') 
    new_element.price_type = 'ENERGY'
  else if (activeName.value === 'four') 
    new_element.price_type = 'PARKING_TIME'
}

const closeDialog = () => {
  fillFullCalendar()
}

const fillFullCalendar = () => {
  ElementsData.length = 0
  Object.assign(ElementsData, tariffElementsData)
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
  for (let i = 0; i < ElementsData?.length; i++) {
    for (let j = 0; j < ElementsData[i].restrictions?.day_of_week?.length; j++) {
      if (ElementsData[i].restrictions.day_of_week[j] === 'MONDAY') daysOfWeek.push('1')
      if (ElementsData[i].restrictions.day_of_week[j] === 'TUESDAY') daysOfWeek.push('2')
      if (ElementsData[i].restrictions.day_of_week[j] === 'WEDNESDAY') daysOfWeek.push('3')
      if (ElementsData[i].restrictions.day_of_week[j] === 'THURSDAY') daysOfWeek.push('4')
      if (ElementsData[i].restrictions.day_of_week[j] === 'FRIDAY') daysOfWeek.push('5')
      if (ElementsData[i].restrictions.day_of_week[j] === 'SATURDAY') daysOfWeek.push('6')
      if (ElementsData[i].restrictions.day_of_week[j] === 'SUNDAY') daysOfWeek.push('0')
    }
    startTime = ElementsData[i]?.restrictions?.start_time
    endTime = ElementsData[i]?.restrictions?.end_time
    if (endTime === '00:00')
      endTime = '23:59'
    if (startTime === undefined)
      startTime = ''
    if (endTime === undefined)
      endTime = ''
    let event_title = 'title'
    let elements_index = i
    for (let j = 0; j < ElementsData[i].price_components.length; j++ ) {
      let evsnts_obj = { daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, title: event_title, index: elements_index,
      shortTitle: overEventHeight(startTime, endTime),
      borderColor: setEventBgColor(charging_bgColor, chargingCount),
    }
      price_excl_str = ElementsData[i].price_components[j].price
      price_incl_str = ElementsData[i].price_components[j].price * (1 + ElementsData[i].price_components[j].vat / 100)
      if (ElementsData[i].price_components[j].type === 'ENERGY') {
        evsnts_obj.extendedProps = { price_excl: '$' + price_excl_str + ' /' + t('kwh'), price_incl: '$' + price_incl_str + ' /' + t('kwh'),
                                      time: startTime + ' - ' + endTime, price: ElementsData[i].price_components[j].price + 
                                      ' / ' + t('kwh')
        }
        chargingCalendarOptions.events.push(evsnts_obj)
        
        chargingCount++
      }
      else if ( ElementsData[i].price_components[j].type === 'TIME') {
        evsnts_obj.extendedProps = { price_excl: '$' + price_excl_str + ' /' + t('hr'), price_incl: '$' + price_incl_str + ' /' + t('hr'),
                                      time: startTime + ' - ' + endTime, 
                                      price: (ElementsData[i].price_components[j].price / (3600 / ElementsData[i].price_components[j].step_size)).toFixed(2) + 
                                      ' / ' + ElementsData[i].price_components[j].step_size / 60 + t('min')
        }
        chargingCalendarOptions.events.push(evsnts_obj)
        chargingCount++
      }
      else if ( ElementsData[i].price_components[j].type === 'PARKING_TIME') {
        evsnts_obj.extendedProps = { price_excl: '$' + price_excl_str + ' /' + t('hr'), price_incl: '$' + price_incl_str + ' /' + t('hr'),
                                      time: startTime + ' - ' + endTime, 
                                      price: (ElementsData[i].price_components[j].price / (3600 / ElementsData[i].price_components[j].step_size)).toFixed(2) + 
                                      ' / ' + ElementsData[i].price_components[j].step_size / 60 + t('min')
        }
        evsnts_obj.borderColor = setEventBgColor(parking_bgColor, parkingCount)
        chargingCalendarOptions.events.push(evsnts_obj)
        parkingCount++
      }  
    }
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
        let date
        if (firstDayCount === 1)   // set endTimeStr as the next day of startStr, and endTime is 00:00
          date = new Date(selectInfo.startStr)
        else 
          date = new Date(selectInfo.endStr)
        let nextTime = date.getTime() + 24 * 60 * 60 * 1000
        let tempTime = new Date(nextTime).toLocaleString()
        let nextDate = tempTime.replaceAll('/', '-').split(' ')[0]

        firstEndTimeStr = endTimeStr = nextDate + 'T00:00:00' + timeZone
        startTime = moment(new Date(selectInfo.start)).format("HH:mm")
        endTime = '23:59'
      }
      new_element.start_time = startTime
      new_element.end_time = endTime
      new_element.day_of_week = []
      for (let j=0; j<firstDayCount; j++) {
        let day = startDay + j
        if (day === 1) new_element.day_of_week.push('MONDAY')
        if (day === 2) new_element.day_of_week.push('TUESDAY')
        if (day === 3) new_element.day_of_week.push('WEDNESDAY')
        if (day === 4) new_element.day_of_week.push('THURSDAY')
        if (day === 5) new_element.day_of_week.push('FRIDAY')
        if (day === 6) new_element.day_of_week.push('SATURDAY')
        if (day === 7) new_element.day_of_week.push('SUNDAY')
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
  element_detail_visible.value = true
  element_action.value = 'add'
  element_title.value = t('add_rate')
  new_element.price_type = ''
  new_element.vat = 5
  new_element.price_price = 0
  new_element.step_size = new_element.step_size_str = 1
  new_element.min_duration = new_element.max_duration = 0
  new_element.min_duration_str = new_element.max_duration_str =  0
}

const handleEventEdit = (clickInfo) => {
  element_detail_visible1.value = true
  element_action.value = 'edit'
  element_title.value = t('edit_rate')
  modifyIndex.value = clickInfo.event.extendedProps.index
  ShowEditElementDialog( {event:clickInfo.event.extendedProps.index})
}


function getElementAtIndex(arr, index) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
            if (count === index) {
                return [i, j];
            }
            count++;
        }
    }
    return "Index out of range";
}

const handleEventMouseEnter = (info) => {
  let index = info.event._def.extendedProps.index
  let i = 0 
  let j = 0
  let count = 0;
  for (i = 0; i < ElementsData.length; i++) {
    for (j = 0; j < ElementsData[i].price_components.length; j++)  {
      if (count === index) {
        break
      }
      count++
    }
  }

  // let i,j =  getElementAtIndex(index)
  // console.log(i,j)
  let type_str = ElementsData[i].price_components_type_str
  let vat_str = ElementsData[i].price_components[j].vat
  let step_size_str = ElementsData[i].price_components_step_size_str
  let price_excl_vat_str = ElementsData[i].price_components[j].price
  let price_incl_vat_str = ElementsData[i].price_components[j].price * (1 + vat_str / 100)
  let min_duration_str = ElementsData[i].restrictions.min_duration / 60
  let max_duration_str = ElementsData[i].restrictions.max_duration / 60
  let unit = ''
  let duration_content = ''

  switch (ElementsData[i].price_components[j].type) {
    case 'ENERGY' :
      step_size_str = ElementsData[i].price_components[j].step_size
      unit = t('kwh')
      break
    case 'TIME' :
      step_size_str = ElementsData[i].price_components[j].step_size / 60
      unit = t('min')
      break
    case 'PARKING_TIME' :
      step_size_str = ElementsData[i].price_components[j].step_size / 60
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
  // let content = '<div style="width: fit-content; margin: auto;">'
  let content = '<div>'
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

const CalendarOptions =  reactive({
  plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
  height: 'auto',  // 609px 602px
  initialView: 'timeGridWeek', editable: false, selectMirror: true, selectable: true, selectOverlap: false,
  allDaySlot: false, firstDay: 1, headerToolbar: false, slotMinTime: '00:00', slotMaxTime: '24:00', slotDuration: '00:60:00',
  slotLabelFormat: { hour12: false, hour: '2-digit', minute: '2-digit'},
  eventTimeFormat: { hour12: false, hour: '2-digit', minute: '2-digit'},
  slotLabelContent: info => info.text.replace(/24:00/g, '00:00'),   // can also try: locale: 'en-GB'
  dayHeaderFormat: { weekday: 'short'},
  events: [],
  eventClassNames: ['mfc-event'],
  eventColor: '#fff',
  eventTextColor: '#000',
  // eventClick: handleEventEdit,
  // select: handleEventCreate,
  eventContent: handleEventContent,
  eventMouseEnter: handleEventMouseEnter
})

const chargingCalendarOptions = {...CalendarOptions}
const parkingCalendarOptions = {...CalendarOptions}

const seletcType = (type) => {
  if (type === 'ENERGY')
    new_element.step_size = 1
  else
    new_element.step_size = 0
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
    ElMessage.error(t('please_check_required_items'))
    return 
  }
  let sendData = await renderDataToSendData()
  console.log(sendData)
  sendData.country_code = 'TW'
  if (tariff_id) {
    sendData.id = tariff_id
    ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), { confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning' })
    .then(async () => {      
      let res = await MsiApi.setCollectionData('patch', 'ocpi', sendData)
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
      let res = await MsiApi.setCollectionData('post', 'ocpi', sendData)
      if (res.status === 201) 
        ElMessage.success(res.data.message)
      else 
        ElMessage.error(res.data.message)
      router.push({ name: 'ratePlan' })
    })
  } 
}

const deleteRestrictions = () => {
  displayRestrictions.value = false
}

const ShowRestrictions = (scope) => {
  element_restrictions_visible.value = true
  let restrictions = { day_of_week: [], start_time: null , end_time: null , max_duration: null, min_duration: null,
    max_parking_duration: null, min_parking_duration: null, min_current: null, max_current: null }
  renderElementDetail.restrictions = restrictions
  if ( Object.keys(scope.row.restrictions).length !== 0) {
    displayRestrictions.value = true
    if(scope.row.restrictions.start_time)
    renderElementDetail.restrictions.start_time = scope.row.restrictions.start_time
    if(scope.row.restrictions.end_time)
      renderElementDetail.restrictions.end_time = scope.row.restrictions.end_time
    if(scope.row.restrictions.min_current || scope.row.restrictions.min_current === 0)
      renderElementDetail.restrictions.min_current = scope.row.restrictions.min_current      
    if(scope.row.restrictions.max_current || scope.row.restrictions.max_current === 0)
      renderElementDetail.restrictions.max_current = scope.row.restrictions.max_current
    if(scope.row.restrictions.min_duration || scope.row.restrictions.min_duration === 0)
      renderElementDetail.restrictions.min_duration = scope.row.restrictions.min_duration
    if(scope.row.restrictions.max_duration || scope.row.restrictions.max_duration === 0)
      renderElementDetail.restrictions.max_duration = scope.row.restrictions.max_duration
    if(scope.row.restrictions.min_parking_duration || scope.row.restrictions.min_parking_duration === 0)
      renderElementDetail.restrictions.min_parking_duration = scope.row.restrictions.min_parking_duration
    if(scope.row.restrictions.max_parking_duration || scope.row.restrictions.max_parking_duration === 0)
      renderElementDetail.restrictions.max_parking_duration = scope.row.restrictions.max_parking_duration      
    if(scope.row.restrictions.day_of_week.length !== 0) {
      let dayArray = scope.row.restrictions.day_of_week.split(/[/ ]+/)
      dayArray = dayArray.filter(function(day) {return day !== ""})
      dayArray.forEach((day) => {
        renderElementDetail.restrictions.day_of_week.push(reConverDayString(day))
      })
    }
  }
}

const ShowEditElementDialog = (scope) => {
  if (scope.event !== null && scope.event !== undefined) {
    scope.row = renderTariffElementsData[scope.event]
  }
  if (scope.row.hasRestrictions === false ) 
    displayRestrictions.value = false
  element_title.value = t('edit_rate')
  add_element.value = false
  let restrictions = { day_of_week: [], start_time: null , end_time: null , max_duration: null, min_duration: null, min_current: null, max_current: null,
    min_parking_duration:null, max_parking_duration:null }
  renderElementDetail.restrictions = restrictions
  if ( Object.keys(scope.row.restrictions).length !== 0) {
    displayRestrictions.value = true
    if(scope.row.restrictions.start_time)
      renderElementDetail.restrictions.start_time = scope.row.restrictions.start_time
    if(scope.row.restrictions.end_time)
      renderElementDetail.restrictions.end_time = scope.row.restrictions.end_time
    if(scope.row.restrictions.min_current || scope.row.restrictions.min_current === 0)
      renderElementDetail.restrictions.min_current = scope.row.restrictions.min_current      
    if(scope.row.restrictions.max_current || scope.row.restrictions.max_current === 0)
      renderElementDetail.restrictions.max_current = scope.row.restrictions.max_current
    if(scope.row.restrictions.min_duration || scope.row.restrictions.min_duration === 0)
      renderElementDetail.restrictions.min_duration = scope.row.restrictions.min_duration      
    if(scope.row.restrictions.max_duration || scope.row.restrictions.max_duration === 0)
      renderElementDetail.restrictions.max_duration = scope.row.restrictions.max_duration
    if(scope.row.restrictions.min_parking_duration || scope.row.restrictions.min_parking_duration === 0)
      renderElementDetail.restrictions.min_parking_duration = scope.row.restrictions.min_parking_duration      
    if(scope.row.restrictions.max_parking_duration || scope.row.restrictions.max_parking_duration === 0)
      renderElementDetail.restrictions.max_parking_duration = scope.row.restrictions.max_parking_duration
    if(scope?.row?.restrictions?.day_of_week?.length > 0) {
      let dayArray = scope.row.restrictions.day_of_week.split(/[/ ]+/)
      dayArray = dayArray.filter(function(day) {return day !== ""})
      dayArray.forEach((day) => {
        renderElementDetail.restrictions.day_of_week.push(reConverDayString(day))
      })
    }
  }
  renderElementDetail.price_components = []
  scope.row.price_components.forEach((price_component) => {
    let price_componentObj = { type: price_component.type, price: price_component.price, vat: price_component.vat, step_size: price_component.step_size, incl_vat: false } 
    renderElementDetail.price_components.push(price_componentObj)
  }) 
  select_element_index = scope.$index
  element_detail_visible1.value = true
}

const renderDataToSendData = async () => {
  let sendData = {country_code:'TW', party_id:'MSI', custom:{}, elements:[]}
  sendData.class = 'Tariff'
  sendData.currency = renderTariffData.currency
  sendData.custom.name = renderTariffData.name
  sendData.country_code = renderTariffData.country_code
  sendData.tariff_alt_url = renderTariffData.tariff_alt_url
  if (renderTariffData.description)
    sendData.custom.description = renderTariffData.description

  if (renderTariffData.min_price || renderTariffData.min_price === 0) {
    sendData.min_price = {}
    sendData.min_price.incl_vat = renderTariffData.min_price
    sendData.min_price.excl_vat = renderTariffData.min_price
  }
  else {
    if (tariff_id)
      sendData.min_price = ''
  }
  if (renderTariffData.max_price || renderTariffData.max_price === 0) {
    sendData.max_price = {}
    sendData.max_price.incl_vat = renderTariffData.max_price
    sendData.max_price.excl_vat = renderTariffData.min_price
  }
  else {
    if (tariff_id)
      sendData.max_price = ''
  }
  
  renderTariffElementsData.forEach((element, index) => {
    if (element.restrictions) {
      sendData.elements[index] = {}
      sendData.elements[index].restrictions = {}
      let elementKeys = Object.keys(element.restrictions)  
      elementKeys.forEach ( (key) => {
        if (element.restrictions[key] !== null && element.restrictions[key] !== '') {
          if (key === 'day_of_week')
            return
          if (key === 'min_duration' || key === 'max_duration' || key === 'min_parking_duration' || key === 'max_parking_duration') 
            sendData.elements[index].restrictions[key] = element.restrictions[key] * 60
          else 
            sendData.elements[index].restrictions[key] = element.restrictions[key]
        }
        else 
          sendData.elements[index].restrictions[key] = ''
      })
      if( element.restrictions?.day_of_week && element.restrictions?.day_of_week?.length !== 0) {
        sendData.elements[index].restrictions.day_of_week = []
        let dayArray = element.restrictions.day_of_week.split(/[/ ]+/)
        dayArray = dayArray.filter(function(day) {return day !== ""})
        dayArray.forEach((day) => {
          sendData.elements[index].restrictions.day_of_week.push(reConverDayString(day))
        })
      }
    }
    sendData.elements[index].price_components = []
    element.price_components.forEach((price_component) => {
      let price_component_obj = {}
      price_component_obj.type = reConvertTypeString(price_component.type)
      price_component_obj.price = price_component.price
      if (price_component_obj.type === 'PARKING_TIME' || price_component_obj.type === 'TIME')
        price_component_obj.step_size = price_component.step_size * 60
      else 
        price_component_obj.step_size = price_component.step_size
      if (price_component.vat)
        price_component_obj.vat = price_component.vat
      sendData.elements[index].price_components.push(price_component_obj)
    })
  })
  return sendData
}

const addElement = () => {
  add_element.value = true
  element_title.value = t('add_rate')
  let price_components = [ { type: null, price: null, vat: null, step_size: null, incl_vat: false } ]
  renderElementDetail.price_components = price_components
  renderElementDetail.restrictions = {}
  element_detail_visible1.value = true
  displayRestrictions.value = false
}

const add_price_component = () => {
  let price_components = { type: null, price: null, vat: null, step_size: null }
  renderElementDetail.price_components.push(price_components)
}

const createElement = async () => {
  for (let i = 0; i < renderElementDetail.price_components.length; i++) {
    if (renderElementDetail.price_components[i].type === null || 
        renderElementDetail.price_components[i].price === null || 
        renderElementDetail.price_components[i].step_size === null) {
      ElMessage.error(t('this_item_is_required'))
      return
    }
  }
  let renderTariffElementsDataObj = {}
  if (renderElementDetail.restrictions)
    renderTariffElementsDataObj.restrictions = {}
  if (renderElementDetail.price_components)
    renderTariffElementsDataObj.price_components = []
  if (renderElementDetail.restrictions.day_of_week) {
    renderTariffElementsDataObj.restrictions.day_of_week = ''
    renderElementDetail.restrictions.day_of_week.forEach( ( day, index ) => {
      renderTariffElementsDataObj.restrictions.day_of_week += convertDayString(day)
      if (renderElementDetail.restrictions.day_of_week.length - 1 !== index )
        renderTariffElementsDataObj.restrictions.day_of_week += ' / '
    })
  }
  if (renderElementDetail.restrictions.start_time)
    renderTariffElementsDataObj.restrictions.start_time = renderElementDetail.restrictions.start_time
  if (renderElementDetail.restrictions.end_time)
    renderTariffElementsDataObj.restrictions.end_time = renderElementDetail.restrictions.end_time
  if (renderElementDetail.restrictions.min_current)
    renderTariffElementsDataObj.restrictions.min_current = renderElementDetail.restrictions.min_current  
  if (renderElementDetail.restrictions.max_current)
    renderTariffElementsDataObj.restrictions.max_current = renderElementDetail.restrictions.max_current
  if (renderElementDetail.restrictions.min_duration)
    renderTariffElementsDataObj.restrictions.min_duration = renderElementDetail.restrictions.min_duration
  if (renderElementDetail.restrictions.max_duration)
    renderTariffElementsDataObj.restrictions.max_duration = renderElementDetail.restrictions.max_duration
  if (renderElementDetail.restrictions.min_parking_duration)
    renderTariffElementsDataObj.restrictions.min_parking_duration = renderElementDetail.restrictions.min_parking_duration
  if (renderElementDetail.restrictions.max_parking_duration)
    renderTariffElementsDataObj.restrictions.max_parking_duration = renderElementDetail.restrictions.max_parking_duration

  renderElementDetail.price_components.forEach( (PriceComponent) => {
    let price_componentsObj = { price:0, step_size:0, type:'', vat:0, incl_vat:false }
    price_componentsObj.vat = PriceComponent.vat
    price_componentsObj.incl_vat = PriceComponent.incl_vat
    if (price_componentsObj.incl_vat === true) {
      price_componentsObj.price_incl_vat = formatNumber((PriceComponent.price ), 4)
      price_componentsObj.price_excl_vat = formatNumber((PriceComponent.price / (1 + PriceComponent.vat/100) ), 4)
      price_componentsObj.price = formatNumber((PriceComponent.price / (1 + PriceComponent.vat/100) ), 4)
    }
    else {
      price_componentsObj.price_incl_vat = formatNumber((PriceComponent.price * (1 + PriceComponent.vat/100) ), 4)
      price_componentsObj.price_excl_vat = formatNumber((PriceComponent.price), 4)
      price_componentsObj.price = formatNumber((PriceComponent.price), 4)
    }
    price_componentsObj.type = convertTypeString(PriceComponent.type)
    price_componentsObj.step_size = PriceComponent.step_size
    renderTariffElementsDataObj.price_components.push(price_componentsObj)
  })
  renderTariffElementsData.push(renderTariffElementsDataObj)
  element_detail_visible1.value = false
  
  if ( Object.keys(renderTariffElementsDataObj.restrictions).length !== 0) 
    renderTariffElementsDataObj.hasRestrictions = true
}

const deleteElement = () => {
  renderTariffElementsData.splice(select_element_index,1)
  element_detail_visible1.value = false
}

const modifyElement = () => {
  renderTariffElementsData[select_element_index].price_components = []
  renderElementDetail.price_components.forEach((price_component, index) => {
    if (renderTariffElementsData[select_element_index].price_components[index] === undefined) {
      renderTariffElementsData[select_element_index].price_components[index] = []
    }
    renderTariffElementsData[select_element_index].price_components[index].price = price_component.price
    renderTariffElementsData[select_element_index].price_components[index].step_size = price_component.step_size
    renderTariffElementsData[select_element_index].price_components[index].type = convertTypeString(price_component.type)
    renderTariffElementsData[select_element_index].price_components[index].vat = price_component.vat
    if (renderElementDetail.price_components[index]?.incl_vat === true) {
      renderTariffElementsData[select_element_index].price_components[index].price_incl_vat = formatNumber((price_component.price ), 4)
      renderTariffElementsData[select_element_index].price_components[index].price_excl_vat = formatNumber((price_component.price / (1 + price_component.vat/100) ), 4)
      renderTariffElementsData[select_element_index].price_components[index].price = formatNumber((price_component.price / (1 + price_component.vat/100) ), 4)
    }
    else {
      renderTariffElementsData[select_element_index].price_components[index].price_incl_vat = formatNumber((price_component.price * (1 + price_component.vat/100) ), 4)
      renderTariffElementsData[select_element_index].price_components[index].price_excl_vat = formatNumber((price_component.price  ), 4)
      renderTariffElementsData[select_element_index].price_components[index].price = formatNumber((price_component.price  ), 4)
    }
  })

  if (displayRestrictions.value === false) {
    delete renderTariffElementsData[select_element_index].restrictions
    delete renderElementDetail.restrictions
  }
  if (renderElementDetail.restrictions) {
    renderTariffElementsData[select_element_index].restrictions = {}
    if (renderElementDetail.restrictions.day_of_week) {
      renderTariffElementsData[select_element_index].restrictions.day_of_week = ''
      renderElementDetail.restrictions.day_of_week.forEach( ( day, index ) => {
        renderTariffElementsData[select_element_index].restrictions.day_of_week += convertDayString(day)
        if (renderElementDetail.restrictions.day_of_week.length - 1 !== index )
          renderTariffElementsData[select_element_index].restrictions.day_of_week += ' / '
      })
    }
    renderTariffElementsData[select_element_index].restrictions.start_time = renderElementDetail.restrictions.start_time
    renderTariffElementsData[select_element_index].restrictions.end_time = renderElementDetail.restrictions.end_time
    renderTariffElementsData[select_element_index].restrictions.max_duration = renderElementDetail.restrictions.max_duration
    renderTariffElementsData[select_element_index].restrictions.min_duration = renderElementDetail.restrictions.min_duration
    renderTariffElementsData[select_element_index].restrictions.max_current = renderElementDetail.restrictions.max_current
    renderTariffElementsData[select_element_index].restrictions.min_current = renderElementDetail.restrictions.min_current
    renderTariffElementsData[select_element_index].restrictions.max_parking_duration = renderElementDetail.restrictions.max_parking_duration
    renderTariffElementsData[select_element_index].restrictions.min_parking_duration = renderElementDetail.restrictions.min_parking_duration
  }
  if ( (renderTariffElementsData[select_element_index].restrictions)) {
    renderTariffElementsData[select_element_index].hasRestrictions = true
  }
  else {
    let restrictions = { day_of_week: [], start_time: null , end_time: null , max_duration: null, min_duration: null, min_current: null, max_current: null,
        min_parking_duration:null, max_parking_duration: null}
    renderTariffElementsData[select_element_index].hasRestrictions = false
    renderTariffElementsData[select_element_index].restrictions = restrictions
    renderElementDetail.restrictions = restrictions
  }
  element_detail_visible1.value = false
}

const deletePriceComponent = (index) => {
  renderElementDetail.price_components.splice(index,1)
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

const getTariffData = async () => {
  let queryData = { database: "OCPI", collection: "Tariff", pipelines: [ 
      { $match: { id: { UUID: tariff_id } } }, 
      { $project: { _id: 0, country_code: 1, custom: 1, elements: 1, id: 1, min_price: 1, currency: 1, tariff_alt_url: 1} }
    ]}
  let res = await MsiApi.mongoAggregate(queryData)
  
  if (res.data.result.length === 0) {
    return 'rate_not_found'
  }
  tariffData = res.data.result
  tariffElementsData = tariffData[0].elements
}

const getConnector = async () => {
  let queryData = { database: "OCPI", collection: "Connector", pipelines: [
      { $match: { tariff_ids: { UUID: tariffData[0].id } } }, { $project: { _id: 1} }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  connectorData = response.data.result
}

const getEVSE = async () => {
  let connectorDataList = []
  for (let i = 0; i < connectorData.length; i++ ) {
    connectorDataList.push( {ObjectId: connectorData[i]._id} )
  }
  let queryData = { database: 'OCPI', collection: 'EVSE', pipelines: [ 
      { $match: { connectors: {$in: connectorDataList } } },
      { $project: { _id: 0, evse_id: 1, status: 1, last_updated: 1, uid:1 } }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  evseData = response.data.result
}

const renderTarinffDataLayout = async () => {
  renderTariffData.country_code = tariffData[0].country_code
  renderTariffData.name = tariffData[0].custom?.name
  renderTariffData.currency = tariffData[0].currency
  renderTariffData.tariff_alt_url = tariffData[0].tariff_alt_url
  if (tariffData[0].min_price?.incl_vat || tariffData[0].min_price?.incl_vat === 0) {
    renderTariffData.min_price = tariffData[0].min_price?.incl_vat
  }
  if (tariffData[0].custom?.description)
    renderTariffData.description = tariffData[0].custom?.description
}

const renderElementLayout = async () => {
  tariffElementsData.forEach((element)=> {
    let renderTariffElementsDataObj = { price_components:[], restrictions:{}, hasRestrictions:false }
    
    if (element?.restrictions?.day_of_week) {
      renderTariffElementsDataObj.restrictions.day_of_week = ''
    }
    
    element?.restrictions?.day_of_week?.forEach( ( day, index ) => {
      renderTariffElementsDataObj.restrictions.day_of_week += convertDayString(day)
      if (element.restrictions.day_of_week.length - 1 !== index )
        renderTariffElementsDataObj.restrictions.day_of_week += ' / '
    })

    if (element.restrictions) {
      let elementKeys = Object.keys(element.restrictions)  
      elementKeys.forEach ( (key) => {
        if (key === 'day_of_week')
          return
        if (key === 'min_duration' || key === 'max_duration' || key === 'min_parking_duration' || key === 'max_parking_duration') {
          if (element.restrictions[key] === '')
            renderTariffElementsDataObj.restrictions[key] = element.restrictions[key]
          else 
            renderTariffElementsDataObj.restrictions[key] = element.restrictions[key] / 60
        }
        else 
          renderTariffElementsDataObj.restrictions[key] = element.restrictions[key]
      })
    }

    if ( Object.keys(renderTariffElementsDataObj.restrictions).length !== 0) 
      renderTariffElementsDataObj.hasRestrictions = true
      element.price_components.forEach( (PriceComponent) => {
        let price_componentsObj = { price:0, step_size:0, type:'', vat:0 }
        price_componentsObj.vat = PriceComponent.vat
        price_componentsObj.price = formatNumber(PriceComponent.price, 4)
        price_componentsObj.price_excl_vat = formatNumber(PriceComponent.price, 4)
        if (PriceComponent.vat)
          price_componentsObj.price_incl_vat = formatNumber((PriceComponent.price * (1 + PriceComponent.vat/100) ), 4)
        else 
          price_componentsObj.price_incl_vat = price_componentsObj.price_excl_vat
        price_componentsObj.type = convertTypeString(PriceComponent.type)
        if ( PriceComponent.type !== "ENERGY") 
          price_componentsObj.step_size = PriceComponent.step_size / 60
        else 
          price_componentsObj.step_size = PriceComponent.step_size
        renderTariffElementsDataObj.price_components.push(price_componentsObj)
      })
    renderTariffElementsData.push(renderTariffElementsDataObj)
  })
}

const renderEvseLayout = async () => {
  renderEvseListData.length = 0
  for (let i = 0; i < evseData.length; i++ ) {
    let renderEvseListDataObj = {}
    renderEvseListDataObj.evse_id = evseData[i].evse_id
    renderEvseListDataObj.last_updated = moment(evseData[i].last_updated).utcOffset(MStore.timeZoneOffset).format('YYYY-MM-DD HH:mm:ss');
    renderEvseListDataObj.status = convertEvseStatusString(evseData[i].status)
    renderEvseListDataObj.uid = evseData[i].uid
    renderEvseListData.push(renderEvseListDataObj)
  }
}

onMounted(async () => {
  if (tariff_id) {
    let status = await getTariffData()
    if (status === 'rate_not_found')
      router.push({ name: 'ratePlan' })
    await getConnector()
    await getEVSE()
    await renderTarinffDataLayout()
    await renderElementLayout()
    await renderEvseLayout()
  }
})
</script>

<template>
  <div class="tariff-detail">
    <div class="container lg flex-col wh-full">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-36px"> {{ t('rate_profile_details') }}</p>
        <el-button v-if="MStore.rule_permission.RatePlanDetail.addRatePlan === 'O'" 
          class="btn-secondary box-shadow mt-4 md:mt-0 md:ml-30px box-shadow" @click="addElement"> {{ t('add_rate') }} 
        </el-button>
      </div>

      <div class="tabs flex-grow">
        <el-tabs v-model="activeName" @tab-change="handleTabClick">
          <el-tab-pane :label="t('general')" name="one">
            <div class="pb-24px sm:flex-col lg:flex-row">
              <div class="left mt-24px lg:mr-40px 2xl:w-350px">
                <el-form class="flex-col" :rules="rules" :model="renderTariffData" ref="ruleFormRef" >
                  <el-form-item class="mb-24px lg-w-full" :label="t('plan_name')" prop="name">
                    <el-input v-model="renderTariffData.name"/>
                  </el-form-item>
                  <el-form-item class="mb-24px lg-w-full" :label="t('currency')" prop="currency">
                    <el-select v-model="renderTariffData.currency" placeholder="Select" size="large" class="w-full 2xl:w-350px">
                      <el-option v-for="item in tariff_currency_opeion" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item class="mb-24px lg-w-full" :label="t('min_price')">
                    <el-input v-model.number="renderTariffData.min_price"/>
                  </el-form-item>
                  <el-form-item v-show="false" class="mb-24px lg-w-full" :label="t('tariff_url')">
                    <el-input v-model.number="renderTariffData.tariff_alt_url"/>
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
                      <el-input v-model="renderTariffData.description" :rows="10" type="textarea" class="mt-8px rounded-5px"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('rate')" name="two">
            <el-table  :data="renderTariffElementsData" class="white-space-nowrap text-primary" height="calc(100vh - 340px)"
              style="width: 100%" stripe size="large" empty="" :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell>
              <el-table-column :label="t('type')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.type }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('price_excl_vat')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.price_excl_vat }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('price_incl_vat')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.price_incl_vat }}
                  </div>
                </template>
              </el-table-column>              
              <el-table-column :label="t('vat')" prop="price_components" min-width="50">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.vat }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('unit')" prop="price_components" min-width="50" >
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.step_size }}
                  </div>
                </template>
              </el-table-column>     
              <el-table-column :label="t('restrictions')" align="center" min-width="100">
                <template #default="scope">
                  <el-button class="btn-more" v-if="scope.row.hasRestrictions" @click="ShowRestrictions(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
                </template>
              </el-table-column>
              <el-table-column :label="t('detail')" align="center" min-width="100">
                <template #default="scope">
                  <el-button class="btn-more" @click="ShowEditElementDialog(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="t('rate_table')" name="three" v-if="env === 'dev' || env === undefined">
            <div class="overflow-x-auto pb-8px">
              <FullCalendar v-if="isCalendarMounted" ref="chargingCalendarRef" :options="chargingCalendarOptions" class="min-w-992px">
              </FullCalendar>
            </div>
          </el-tab-pane>

          <!-- <el-tab-pane :label="t('parking_rate')" name="four">
            <div class="overflow-x-auto pb-8px">
              <FullCalendar v-if="isCalendarMounted" ref="parkingCalendarRef" :options="parkingCalendarOptions" class="min-w-992px">
              </FullCalendar>
            </div>
          </el-tab-pane> -->

          <el-tab-pane :label="t('evse_list')" name="five">
            <el-table 
              :data="renderEvseListData" class="white-space-nowrap text-primary" height="calc(100vh - 340px)" style="width: 100%"
              stripe size="large" empty="" :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell>
              <el-table-column prop="evse_id" :label="t('evse_id')" sortable min-width="200"/>
              <el-table-column prop="status" :label="t('status')" :filters="status_filter_item" :filter-method="status_filter" min-width="150">
                <template #default="scope">
                  <p v-if="statusMap[scope.row.status]" :class="statusMap[scope.row.status].class">
                    {{ '●' + scope.row.status }}
                  </p>
                </template>
              </el-table-column>
              <el-table-column prop="last_updated" :label="t('last_updated')" sortable min-width="200"/>
              <el-table-column prop="detail" label="" align="center" min-width="100">
                <template #default="scope">
                  <el-button class="btn-more" @click="goToEvseDetail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="flex justify-center mb-44px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="cancel_tariff"> {{t('cancel')}} </el-button>
        <el-button v-if="MStore.rule_permission.RatePlanDetail.save === 'O'" class="btn-secondary" @click="save_tariff(ruleFormRef)"> {{t('save')}} </el-button>
      </div>

      <el-dialog v-model="element_detail_visible" class="max-w-600px flex-col h-95%" :show-close="true" width="90%" destroy-on-close
        center @open='openDialog' @close='closeDialog' draggable>
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4 :id="titleId" :class="titleClass" class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px">
              {{ element_title }}
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

            <div v-if="new_element.price_type !== ''">

              <el-radio-group v-model="vat_select" @change="calPrice(vat_select)">
                <el-radio label="1" size="large">{{ t('price_excl_vat') }}</el-radio>
                <el-radio label="2" size="large">{{ t('price_incl_vat') }}</el-radio>
              </el-radio-group>
                <div v-if="vat_select === '1'">
                  <el-form-item class="mb-24px" :label="t('price_excl_vat')">
                  <el-input v-if="new_element.price_type === 'ENERGY'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ renderTariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('kwh') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'TIME'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)" >
                  <template #prefix>
                    <span>{{ renderTariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'PARKING_TIME'" v-model="new_element.price_price" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ renderTariffData.currency }}</span>
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
                    <span>{{ renderTariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('kwh') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'TIME'" v-model="new_element.price_price_incl" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)">
                  <template #prefix>
                    <span>{{ renderTariffData.currency }}</span>
                  </template>
                  <template #suffix>
                    <span> {{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
  
                <el-input v-else-if="new_element.price_type === 'PARKING_TIME'" v-model="new_element.price_price_incl" type="number" :controls="false" class="w-full" @blur="calPrice(vat_select)" >
                  <template #prefix>
                    <span>{{ renderTariffData.currency }}</span>
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

            <div class="v-line1 mt-12px mb-12px"></div>

            <div v-for="(item, index) in eventCount" :key="item">
              <div v-if="index === 0">
                <el-form-item class="time-select mb-24px" :label="t('time')">
                  <div class="flex justify-between flex-items-center w-full">
                    <el-time-select v-model="new_element.start_time" :max-time="new_element.end_time" placeholder="Start time" class="w-220px"
                  start="00:00" step="00:01" end="24:00" />
                    <div class="time-line"></div>
                    <el-time-select v-model="new_element.end_time" :min-time="new_element.start_time" placeholder="End time" class="w-220px"
                    start="00:00" step="00:01" end="24:00" />
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
                  start="00:00" step="00:01" end="24:00" />
                    <div class="time-line"></div>
                    <el-time-select v-model="multiTime[index-1].end_time" :min-time="multiTime[index-1].start_time" placeholder="End time" class="w-220px"
                    start="00:00" step="00:01" end="24:00" />
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

            <div v-if="new_element.price_type === 'PARKING_TIME'" class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('active_minute')">
                <el-input v-model="new_element.min_duration_str" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('deactivate_minute')">
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
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="element_detail_visible = false "> {{ t('cancel') }}</el-button>
          <template v-if="element_action === 'add'">
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px mb-44px" @click="createElement(ruleFormRef1)"> {{ t('create') }}</el-button>
          </template>
        </template>
      </el-dialog>

      <el-dialog v-model="element_detail_visible1" class="max-w-600px flex-col" :show-close="true" width="90%" destroy-on-close center 
                                                  @open='openDialog'  @close='closeDialog' draggable>
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4 :id="titleId" :class="titleClass" class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"> {{ element_title }} </h4>
          </div>
        </template>

        <el-form class="max-w-500px m-auto" ref="ruleFormRef1" :model="renderElementDetail" :rules="rules1">
          <div v-for="(item, index) in renderElementDetail.price_components" :key="item">
             {{ t('component') + (index + 1) }} 
            <el-button v-if="index > 0" @click="deletePriceComponent(index)"> {{t('delete')}}</el-button>
            <el-form-item class="mb-24px" :label= "t('type')" prop="type">
              <el-select v-model="item.type" placeholder="Select" size="large" class="w-full" @change="seletcType">
                <el-option v-for="item in price_type_opeion" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-radio-group v-model=item.incl_vat @change="calPrice1(item.incl_vat, index)">
                <el-radio :label=false size="large">{{ t('price_excl_vat') }}</el-radio>
                <el-radio :label=true size="large">{{ t('price_incl_vat') }}</el-radio>
              </el-radio-group>
              <div>
              <el-form-item class="mb-24px" prop="price">
                <el-input v-model.number="item.price" type='number' :controls="false" class="w-full">
                  <template #prefix>
                    <span>{{ renderTariffData.currency}}</span>
                  </template>
                  <template #suffix>
                    <span v-if="item.type === 'Charging By Energy' || item.type === 'ENERGY'"> {{ '/' + t('kwh') }}</span>
                    <span v-else> {{ '/' + t('hr') }}</span>
                  </template>
                </el-input>
              </el-form-item>

                <div class="flex justify-between">
                  <el-form-item class="mb-24px" :label="t('unit')" prop="unit">
                    <el-input v-model.number="item.step_size" type="number" class="w-220px" :controls="false" >
                      <template #suffix>
                        <span v-if="item.type === 'Charging By Energy' || item.type === 'ENERGY'"> {{ '/' + t('wh') }} </span>
                        <span v-else> {{ '/' + t('min') }} </span>
                      </template>
                    </el-input>
                  </el-form-item>
                  <el-form-item class="mb-24px" :label="t('vat')">
                    <el-input v-model.number="item.vat" type="number" class="w-220px" :controls="false" >
                      <template #suffix>
                        <span>%</span>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>
              </div>
            </el-form-item>
            <div class="v-line1 mt-12px mb-12px"></div>
          </div>
          <el-button round class="mt-2px w-48% bg-btn-100 text-white max-w-140px mb-2px" @click="add_price_component"> {{ ('Add Component') }}</el-button>
          <div class="v-line1 mt-12px mb-12px"></div>
          <el-button v-if="!displayRestrictions" round class="mt-10 w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="displayRestrictions=true"> {{ ('Display Restrictions') }}</el-button>
          <el-button v-else round class="mt-2 w-48% bg-btn-100 text-white max-w-140px mb-2px" @click="deleteRestrictions"> {{ ('Delete Restrictions') }}</el-button>
          <div v-if="displayRestrictions">
            <el-form-item class="time-select mb-24px" :label="t('time')">
              <div class="flex justify-between flex-items-center w-full">
                <el-time-select v-model="renderElementDetail.restrictions.start_time" :max-time="renderElementDetail.restrictions.end_time" placeholder="Start time" class="w-220px"
              start="00:00" step="00:01" end="23:30" />
                <div class="time-line"></div>
                <el-time-select v-model="renderElementDetail.restrictions.end_time" :min-time="renderElementDetail.restrictions.start_time" placeholder="End time" class="w-220px"
                start="00:01" step="00:01" end="24:00" />
              </div>
            </el-form-item>
            <el-form-item class="time-select mb-24px" :label="t('applied_day_of_week')">
              <el-checkbox-group v-model="renderElementDetail.restrictions.day_of_week" size="large" class="w-full flex justify-between" fill="#414c58">
                <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value" class="week-btn"> {{ week.label }}
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <!-- <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('active_minute')">
                <el-input v-model.number="renderElementDetail.restrictions.min_duration" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('deactivate_minute')">
                <el-input v-model.number="renderElementDetail.restrictions.max_duration" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div> -->
            <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('min_current')">
                <el-input v-model.number="renderElementDetail.restrictions.min_current" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ 'A' }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('max_current')">
                <el-input v-model.number="renderElementDetail.restrictions.max_current" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ 'A' }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div>
            <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('min_parking_duration')">
                <el-input v-model.number="renderElementDetail.restrictions.min_parking_duration" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('max_parking_duration')">
                <el-input v-model.number="renderElementDetail.restrictions.max_parking_duration" type="number" class="w-220px" :controls="false" >
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </div>
        </el-form>

        <template #footer>
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="element_detail_visible1 = false"> {{ t('cancel') }}</el-button>
          <template v-if="add_element">
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px mb-44px" @click="createElement(ruleFormRef1)"> {{ t('create') }}</el-button>
          </template>
          <template v-else>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="deleteElement"> {{ t('delete') }}</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px mb-44px" @click="modifyElement">{{ t('modify') }}</el-button>
          </template>
        </template>
      </el-dialog>

      <el-dialog v-model="element_restrictions_visible" class="max-w-600px flex-col" :show-close="true" width="90%" destroy-on-close center draggable>
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4 :id="titleId" :class="titleClass" class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px">
              {{ t('restrictions') }}
            </h4>
          </div>
        </template>
            <el-form-item class="time-select mb-24px" :label="t('time')">
              <div class="flex justify-between flex-items-center w-full">
                <el-time-select v-model="renderElementDetail.restrictions.start_time" :max-time="renderElementDetail.restrictions.end_time" placeholder="Start time" class="w-220px"
              start="00:00" step="00:01" end="23:30" disabled/>
                <div class="time-line"></div>
                <el-time-select v-model="renderElementDetail.restrictions.end_time" :min-time="renderElementDetail.restrictions.start_time" placeholder="End time" class="w-220px"
                start="00:01" step="00:01" end="24:00" disabled/>
              </div>
            </el-form-item>
            <el-form-item class="time-select mb-24px" :label="t('applied_day_of_week')">
              <el-checkbox-group v-model="renderElementDetail.restrictions.day_of_week" size="large" class="w-full flex justify-between" fill="#414c58">
                <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value" class="week-btn" disabled> {{ week.label }}
                </el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
            <!-- <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('active_minute')" disabled>
                <el-input v-model.number="renderElementDetail.restrictions.min_duration" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('deactivate_minute')" disabled>
                <el-input v-model.number="renderElementDetail.restrictions.max_duration" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div> -->
            <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('min_current')">
                <el-input v-model.number="renderElementDetail.restrictions.min_current" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ 'A' }}</span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('max_current')">
                <el-input v-model.number="renderElementDetail.restrictions.max_current" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ 'A' }}</span>
                  </template>
                </el-input>
              </el-form-item>

            </div>
            <div class="flex justify-between">
              <el-form-item class="mb-24px" :label="t('min_parking_duration')">
                <el-input v-model.number="renderElementDetail.restrictions.min_parking_duration" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('max_parking_duration')">
                <el-input v-model.number="renderElementDetail.restrictions.max_parking_duration" type="number" class="w-220px" :controls="false" disabled>
                  <template #suffix>
                    <span> {{ t('min') }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          <template #footer>
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px mb-44px" @click="element_restrictions_visible = false" > {{ t('ok') }}</el-button>
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