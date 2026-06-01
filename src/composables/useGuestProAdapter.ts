import type { Room, RoomSection, Reservation, RoomStatus, ReservationStatus } from '../types'

const SECTION_PALETTE = [
  '#1a8cd8',
  '#16a34a',
  '#7c3aed',
  '#b45309',
  '#dc2626',
  '#0891b2',
  '#d97706',
  '#be185d',
  '#4f46e5',
  '#047857',
  '#9333ea',
]

export interface GuestProChartingRoom {
  id: string
  name: string
  room_status: string
  room_type_name: string
  room_status_name: string
  color: string
  background_color: string
  position_calender: number
  room_type_position_order: number
  bed_type_name: string | null
}

export interface GuestProReservationItem {
  id: string
  reservation_id: string
  arrival_date: string
  departure_date: string
  status: string
  resv_status: string
  room_id: string
  folio_no: number | string
  guest_profile_name: string
  guest_profile?: string
  total: number | string
  total_paid: number | string
  is_cancelled: number
  [key: string]: unknown
}

export interface GuestProReservationResponse {
  data: GuestProReservationItem[]
  [key: string]: unknown
}

export function transformRoomCharting(rooms: GuestProChartingRoom[]): RoomSection[] {
  const typeMap = new Map<string, { order: number; roomsRaw: GuestProChartingRoom[] }>()

  for (const r of rooms) {
    if (!typeMap.has(r.room_type_name)) {
      typeMap.set(r.room_type_name, { order: r.room_type_position_order, roomsRaw: [] })
    }
    typeMap.get(r.room_type_name)!.roomsRaw.push(r)
  }

  const sorted = Array.from(typeMap.entries()).sort(([, a], [, b]) => a.order - b.order)

  return sorted.map(([typeName, { roomsRaw }], idx) => ({
    id: typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: typeName.toUpperCase(),
    color: SECTION_PALETTE[idx % SECTION_PALETTE.length],
    rooms: roomsRaw
      .sort((a, b) => a.position_calender - b.position_calender)
      .map((r): Room => ({
        id: r.id,
        name: r.name,
        type: r.bed_type_name ?? '',
        status: normalizeRoomStatus(r.room_status),
      })),
  }))
}

export function transformReservations(
  input: GuestProReservationItem[] | GuestProReservationResponse,
): Reservation[] {
  const items: GuestProReservationItem[] = Array.isArray(input) ? input : input.data

  const result: Reservation[] = []
  for (const item of items) {
    if (item.is_cancelled || item.status === 'CANCELLED') continue

    const total = Number(item.total) || 0
    const totalPaid = Number(item.total_paid) || 0
    const paidPercent = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0

    result.push({
      id: item.id,
      roomId: item.room_id,
      guestName: (item.guest_profile_name || item.guest_profile || '').trim(),
      folioNumber: String(item.folio_no),
      checkIn: item.arrival_date,
      checkOut: item.departure_date,
      paidPercent,
      status: normalizeReservationStatus(item.status),
    })
  }
  return result
}

function normalizeRoomStatus(status: string): RoomStatus {
  switch (status.toUpperCase()) {
    case 'OC':  return 'OC'
    case 'OD':  return 'OD'
    case 'VC':  return 'VC'
    case 'VCI': return 'VCI'
    case 'VD':  return 'VD'
    case 'UL':  return 'UL'
    default:    return 'VC'
  }
}

function normalizeReservationStatus(status: string): ReservationStatus {
  switch (status) {
    case 'CHECK_IN':  return 'CHECK-IN'
    case 'CHECK_OUT': return 'CHECK-OUT'
    case 'BOOKED':    return 'BOOKED'
    default:          return 'DEFINITE'
  }
}
