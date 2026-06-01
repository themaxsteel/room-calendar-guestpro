export type RoomStatus = 'OC' | 'VC' | 'OD' | 'UL' | 'VCI' | 'VD'

export type ReservationStatus = 'CHECK-IN' | 'CHECK-OUT' | 'DEFINITE' | 'BOOKED' | 'ROOM_MAINTENANCE'

export interface Room {
  id: string
  name: string
  type: string
  status: RoomStatus
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
}

export interface CalendarConfig {
  /** ISO date string — first visible date */
  startDate: string
  /** Number of days to display */
  visibleDays: number
  /** Pixel width of room column (default 170) */
  roomColWidth?: number
  /** Pixel width of each day column (default 80) */
  dayColWidth?: number
  /** Included in the reservation-moved event payload for move_reservation-v2 API */
  companyId?: string
}

export interface BlockLayout extends Reservation {
  left: number
  width: number
}

export interface DragState {
  blockId: string
  roomId: string
  targetRoomId: string
  startX: number
  deltaDays: number
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
