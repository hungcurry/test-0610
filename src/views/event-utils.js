
let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export const INITIAL_EVENTS = [
  {
    groupId: 'blueEvents', // recurrent events in this group move together
    daysOfWeek: [ '1', '4' ],
    startTime: '10:45:00',
    endTime: '12:45:00'
  }
]

export function createEventId() {
  return String(eventGuid++)
}
