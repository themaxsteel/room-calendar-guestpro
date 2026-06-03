export type RoomStatus = 'OC' | 'VC' | 'OD' | 'UL' | 'VCI' | 'VD'

export type ReservationStatus = 'CHECK-IN' | 'CHECK-OUT' | 'DEFINITE' | 'BOOKED' | 'ROOM_MAINTENANCE'

export interface Room {
  id: string
  name: string
  type: string
  status: RoomStatus
  bedName?: string
}

export interface RoomSection {
  id: string
  label: string
  color: string
  rooms: Room[]
}

export interface Reservation {
  id: string
  roomId: string
  guestName: string
  folioNumber: string
  /** ISO date string YYYY-MM-DD — inclusive check-in */
  checkIn: string
  /** ISO date string YYYY-MM-DD — exclusive check-out (day guest leaves) */
  checkOut: string
  /** 0–100 */
  paidPercent: number
  status: ReservationStatus
  totalBalance?: number
}

export interface CalendarConfig {
  /** ISO date string — first visible date */
  startDate: string
  /** Number of days to display */
  visibleDays: number
  /** Pixel width of room column (default 170) */
  roomColWidth?: number
  /** Pixel width of each day column (default 100) */
  dayColWidth?: number
  /** Included in the reservation-moved event payload for move_reservation-v2 API */
  companyId?: string
}

export interface BlockLayout extends Reservation {
  left: number
  width: number
  /** 0-based row index within the room row (0 when no overlap) */
  row: number
  /** total stacked rows needed for this room at this time period (1 = no overlap) */
  totalRows: number
}

export interface DragState {
  blockId: string
  roomId: string
  targetRoomId: string
}

export interface ReservationClickedPayload {
  reservation: Reservation
  room: Room
}

export interface RoomDroppedPayload {
  reservationId: string
  fromRoomId: string
  toRoomId: string
  newCheckIn: string
}

export interface ReservationMovedPayload {
  /** move_reservation-v2 API body */
  id: string
  room_id: string
  arrival_date: string
  departure_date: string
  company_id: string
  /** original room before the move */
  from_room_id: string
}

export interface DateRangeChangedPayload {
  startDate: string
  endDate: string
}

export interface CalendarFilter {
  /** Override room column width in pixels */
  roomColWidth?: number
  /** Jump to a new visible date range (ISO YYYY-MM-DD) */
  startDate?: string
  endDate?: string
  /** Show or hide the room status badge (OC / VC / etc.) */
  showRoomStatus?: boolean
  /** 'by-room-type' groups rooms by section; 'normal' shows a flat reorderable list */
  calendarType?: 'by-room-type' | 'normal'
  /** Explicit room order (array of room IDs) — only used when calendarType is 'normal' */
  roomOrder?: string[]
  /** Show rooms that have no reservations in the visible range (default true) */
  showUnallocated?: boolean
  /** Show total balance on the booking block */
  showTotalBalance?: boolean
  /** Show bed name after room name in the room column */
  showBedName?: boolean
  /** Show reservation detail tooltip on hover (default true) */
  showReservationDetail?: boolean
  /** Primary label shown on the booking block */
  calendarLabel?: 'guest-name' | 'folio'
  /** Allow dragging reservation blocks vertically (room change) and row reorder. Default true. */
  allowVerticalDrag?: boolean
}

export interface NewReservationPayload {
  roomId: string
  /** ISO YYYY-MM-DD — inclusive check-in */
  checkIn: string
  /** ISO YYYY-MM-DD — exclusive check-out */
  checkOut: string
  type: 'room-plan' | 'single' | 'group'
}

export interface NewResDragState {
  roomId: string
  roomName: string
  startDayIdx: number
  currentDayIdx: number
  startClientX: number
  mouseX: number
  mouseY: number
  isActive: boolean
}

export interface NewResPopover {
  x: number
  y: number
  roomId: string
  roomName: string
  checkIn: string
  checkOut: string
  showResSub: boolean
}
