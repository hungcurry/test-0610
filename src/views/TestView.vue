<template>
  <div class='demo-app'>
    <div class='demo-app-main'>
      <FullCalendar class='demo-app-calendar fc-event1' :options='calendarOptions' ref="calendarRef">
      </FullCalendar>
      <br>
      <FullCalendar class='demo-app-calendar fc-event2' :options='calendarOptions1' ref="calendarRef1">
      </FullCalendar>

    </div>
    <div class="tariff-item">
      <p class="tariff-title">Rate Profile</p>
      <el-select class="el-select" v-model="select_profile" placeholder="Select" size="large" @change="selectTariff">
        <el-option v-for="item in tariff_profile" :key="item.value" :label="item.profile_name" :value="item.id" />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import ApiFunc from '@/components/ApiFunc'
import { onMounted, reactive, ref } from 'vue'
const MsiApi = ApiFunc()
const calendarRef = ref()
const calendarRef1 = ref()

const tariff_profile = reactive([])
const selectTariffObj = {}

const selectTariff = async (select_id) => {
  selectTariffObj.length = 0
  for (let i = 0; i < tariff_profile.length; i++) {
    if (select_id === tariff_profile[i].id) {
      Object.assign(selectTariffObj, tariff_profile[i])
    }
  }
  calendarRef.value.getApi().removeAllEvents()
  calendarRef1.value.getApi().removeAllEvents()

  calendarOptions.events = []
  calendarOptions1.events = []

  let startTime = ''
  let endTime = ''
  let title = ''
  for (let i = 0; i < selectTariffObj.elements.length; i++) {
    for (let j = 0; j < selectTariffObj.elements[i].restrictions.day_of_week.length; j++) {
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'MONDAY') daysOfWeek.push('1')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'TUESDAY') daysOfWeek.push('2')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'WEDNESDAY') daysOfWeek.push('3')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'THURSDAY') daysOfWeek.push('4')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'FRIDAY') daysOfWeek.push('5')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'SATURDAY') daysOfWeek.push('6')
      if (selectTariffObj.elements[i].restrictions.day_of_week[j] === 'SUNDAY') daysOfWeek.push('0')
      startTime = selectTariffObj.elements[i].restrictions.start_time
      endTime = selectTariffObj.elements[i].restrictions.end_time
      if (endTime === '00:00')
        endTime = '23:59'
    }
    let bgColor = ''

    if (selectTariffObj.elements[i].price_components[0].type === 'ENERGY') {
      title = 'Charging By Energy'
      let price_str = selectTariffObj.elements[i].price_components[0].price
      bgColor = '#63A5D7'
      calendarOptions.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, backgroundColor: bgColor, title: price_str,

        extendedProps: {
          title: title,
          price: selectTariffObj.elements[i].price_components[0].price + ' per kwh'
        }
      })
    }
    else if (selectTariffObj.elements[i].price_components[0].type === 'TIME') {

      title = 'Charging By Time'
      let price_str = selectTariffObj.elements[i].price_components[0].price
      bgColor = '#63A5FF'
      calendarOptions.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, backgroundColor: bgColor, title: price_str,

        extendedProps: {
          title: title,
          price: selectTariffObj.elements[i].price_components[0].step_size / 60 + ' Min '
            + (selectTariffObj.elements[i].price_components[0].price / (3600 / selectTariffObj.elements[i].price_components[0].step_size)).toFixed(2)
        }
      })
    }
    else if (selectTariffObj.elements[i].price_components[0].type === 'PARKING_TIME') {
      title = 'Parking By Time'
      let price_str = selectTariffObj.elements[i].price_components[0].price
      bgColor = '#80CFC2'
      calendarOptions1.events.push({
        daysOfWeek: daysOfWeek, startTime: startTime, endTime: endTime, backgroundColor: bgColor, title: price_str,

        extendedProps: {
          title: title,
          price: selectTariffObj.elements[i].price_components[0].step_size / 60 + ' Min '
            + (selectTariffObj.elements[i].price_components[0].price / (3600 / selectTariffObj.elements[i].price_components[0].step_size)).toFixed(2)
        }
      })
    }
    startTime = ''
    endTime = ''
    daysOfWeek = []
  }
}

const handleDateSelect = (selectInfo) => {
  let title = prompt('Please enter a new title for your event')
  let calendarApi = selectInfo.view.calendar

  calendarApi.unselect() // clear date selection

  if (title) {
    calendarApi.addEvent({
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay
    })
  }
}

const handleEventClick = (clickInfo) => {
  if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
    clickInfo.event.remove()
  }
}


let currentEvents = []

const handleEvents = (events) => {
  currentEvents = events
}

const calendarOptions = reactive({

  plugins: [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin // needed for dateClick
  ],
  dayHeaderContent: (arg) => {
    const date = arg.date;
    const weekday = date.toLocaleString('default', { weekday: 'short' });
    return weekday;
  },
  allDaySlot: false,
  headerToolbar: false,
  initialView: 'timeGridWeek',
  events: [],
  editable: false,
  droppable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventsSet: handleEvents,
  slotDuration: '02:00:00',
  slotLabelFormat: {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  },
  eventContent: function (arg) {
    return {
      html: `
                        ${arg.event.extendedProps.title}<br><br>
                        ${arg.timeText}<br><br>
                        ${arg.event.extendedProps.price}<br><br>
                      `
    }
  },
})

const calendarOptions1 = reactive({

  plugins: [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin // needed for dateClick
  ],
  dayHeaderContent: (arg) => {
    const date = arg.date;
    const weekday = date.toLocaleString('default', { weekday: 'short' });
    return weekday;
  },
  allDaySlot: false,
  headerToolbar: false,
  initialView: 'timeGridWeek',
  events: [],
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventsSet: handleEvents,
  slotDuration: '02:00:00',
  slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
  eventContent: function (arg) {
    return {
      html: `
        ${arg.event.extendedProps.title}<br><br>
        ${arg.timeText}<br><br>
        ${arg.event.extendedProps.price}<br><br>
        `
    }
  },
})


let daysOfWeek = []

onMounted(async () => {
  let queryData = { "database": "OCPI", "collection": "Tariff", "query": {} }
  let res = await MsiApi.mongoQuery(queryData)
  Object.assign(tariff_profile, res.data.all)

})

</script>

<style lang='css'>
h2 {
  margin: 0;
  font-size: 16px;
}

ul {
  margin: 0;
  padding: 0 0 0 1.5em;
}

li {
  margin: 1.5em 0;
  padding: 0;
}

b {
  /* used for event dates/times */
  margin-right: 3px;
}

.demo-app {
  display: flex;
  min-height: 100%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
  font-size: 14px;
}

.demo-app-sidebar {
  width: 300px;
  line-height: 1.5;
  background: #eaf9ff;
  border-right: 1px solid #d3e2e8;
}

.demo-app-sidebar-section {
  padding: 2em;
}

.demo-app-calendar {
  height: 300px;
}

.demo-app-main {
  flex-grow: 1;
  padding: 3em;
}

.fc {
  /* the calendar root */
  max-width: 1100px;
  margin: 0 auto;
}

/* .fc-event1 {
  border: 0;
  border-bottom: 10px solid #63A5D7;
  
}

.fc-event2 {
  border: 0;
  border-bottom: 10px solid #80CFC2;
} */</style>
