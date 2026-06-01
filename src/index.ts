import { defineCustomElement } from 'vue'
import RoomCalendarCE from './components/RoomCalendar.ce.vue'

export const RoomCalendarElement = defineCustomElement(RoomCalendarCE)

export function register(tagName = 'room-calendar') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, RoomCalendarElement)
  }
}

export type {
  Room,
  RoomSection,
  Reservation,
  CalendarConfig,
  ReservationClickedPayload,
  RoomDroppedPayload,
  ReservationMovedPayload,
  DateRangeChangedPayload,
} from './types'

export type {
  GuestProChartingRoom,
  GuestProReservationItem,
  GuestProReservationResponse,
} from './composables/useGuestProAdapter'
