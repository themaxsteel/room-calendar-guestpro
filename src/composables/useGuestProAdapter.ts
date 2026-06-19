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
  room_status_name: string
  room_type_name: string
  room_type_id: string
  room_type_position_order: number
  bed_type_name: string | null
  /** New API field names */
  room_position_order?: number
  room_status_color?: string
  room_status_background_color?: string
  /** Legacy field names (fallback) */
  position_calender?: number
  color?: string
  background_color?: string
}

export interface GuestProReservationItem {
  id: string
  // calendar_reservation_data_list fields
  name?: string
  resourceId?: string
  startDate?: string   // "YYYY-MM-DD HH:mm:ss"
  endDate?: string     // "YYYY-MM-DD HH:mm:ss"
  calender_status?: string
  // search_reservation fields (legacy)
  reservation_id?: string
  arrival_date?: string
  departure_date?: string
  room_id?: string
  folio_no?: number | string | null
  guest_profile_name?: string
  guest_profile?: string
  // shared
  status: string
  resv_status?: string
  total?: number | string
  total_paid?: number | string
  is_cancelled?: number
  agent_name?: string | null
  icon_code?: string | null
  agent_color?: string | null
  [key: string]: unknown
}

export interface GuestProReservationResponse {
  data: GuestProReservationItem[]
  [key: string]: unknown
}

export function transformRoomCharting(rooms: GuestProChartingRoom[]): RoomSection[] {
  const typeMap = new Map<string, { id: string; label: string; order: number; roomsRaw: GuestProChartingRoom[] }>()

  for (const r of rooms) {
    if (!typeMap.has(r.room_type_id)) {
      typeMap.set(r.room_type_id, { id: r.room_type_id, label: r.room_type_name, order: r.room_type_position_order, roomsRaw: [] })
    }
    typeMap.get(r.room_type_id)!.roomsRaw.push(r)
  }

  const sorted = Array.from(typeMap.values()).sort((a, b) => a.order - b.order)

  return sorted.map(({ id, label, roomsRaw }, idx) => ({
    id,
    label: label.toUpperCase(),
    color: SECTION_PALETTE[idx % SECTION_PALETTE.length],
    rooms: roomsRaw
      .sort((a, b) => (a.room_position_order ?? a.position_calender ?? 0) - (b.room_position_order ?? b.position_calender ?? 0))
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
  opts?: { startKey?: string; endKey?: string },
): Reservation[] {
  const items: GuestProReservationItem[] = Array.isArray(input) ? input : input.data
  // Which raw fields drive the block's timeline position. Configurable via
  // CalendarConfig; defaults preserve the calendar_reservation_data_list shape.
  const startKey = opts?.startKey || 'startDate'
  const endKey   = opts?.endKey   || 'endDate'

  const result: Reservation[] = []
  for (const item of items) {
    // Skip virtual room shadows and cancelled entries
    const s = (item.calender_status || item.status || '').toUpperCase()
    if (s === 'VIRTUALROOM' || s === 'CANCELLED') continue
    if (item.is_cancelled) continue

    // Support both calendar_reservation_data_list (new) and search_reservation (legacy)
    const roomId    = (item.resourceId || item.room_id || '').trim()
    const guestName = (item.name || item.guest_profile_name || item.guest_profile || '').trim()
    // Timeline position uses the configured key (default startDate/endDate); these
    // may be clamped to the visible window by the backend, so they are display-only
    // — the real arrival_date/departure_date live on `raw`. Values may include time
    // ("2026-05-06 00:00:00"), so strip to date only.
    const startRaw  = item[startKey]
    const endRaw    = item[endKey]
    const checkIn   = ((typeof startRaw === 'string' && startRaw) || item.arrival_date   || '').slice(0, 10)
    const checkOut  = ((typeof endRaw   === 'string' && endRaw)   || item.departure_date || '').slice(0, 10)

    if (!roomId || !checkIn || !checkOut) continue

    const total     = Number(item.total)      || 0
    const totalPaid = Number(item.total_paid) || 0
    const paidPercent = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0
    const outstanding = Math.max(0, total - totalPaid)

    result.push({
      id: item.id,
      roomId,
      guestName,
      folioNumber: item.folio_no != null ? String(item.folio_no) : '',
      checkIn,
      checkOut,
      paidPercent,
      totalBill: total,
      outstanding,
      status: normalizeReservationStatus(s),
      agentName: item.agent_name ?? undefined,
      iconCode: typeof item.icon_code === 'string' ? item.icon_code : undefined,
      agentColor: typeof item.agent_color === 'string' ? item.agent_color : undefined,
      // Keep the raw item so the move event can send the real arrival_date /
      // departure_date instead of the (possibly clamped) timeline dates.
      raw: item,
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
    case 'CHECK_IN':     return 'CHECK-IN'
    case 'CHECK_OUT':    return 'CHECK-OUT'
    case 'BOOKED':       return 'BOOKED'
    case 'MAINTENANCE':  return 'ROOM_MAINTENANCE'
    default:             return 'DEFINITE'
  }
}
