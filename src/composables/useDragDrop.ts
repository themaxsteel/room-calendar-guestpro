import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Room, Reservation, BlockLayout, DragState, CalendarConfig } from '../types'
import { addDays } from './useDateHelpers'

const REVERT_MS = 220

interface DragDropEmit {
  (event: 'reservation-clicked', payload: { reservation: Reservation; room: Room }): void
  (event: 'reservation-moved', payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string }): void
}

interface PendingMove {
  id:          string
  room_id:     string
  arrival_date: string
  departure_date: string
  company_id:  string
  from_room_id: string
  /** snapshot to restore if user cancels */
  snapshot: Reservation
}

export function useDragDrop(
  localReservations: Ref<Reservation[]>,
  DAY_COL_W: Ref<number>,
  emit: DragDropEmit,
  config: Ref<CalendarConfig>,
) {
  const dragState    = ref<DragState | null>(null)
  const isReverting  = ref(false)
  const pendingMove  = ref<PendingMove | null>(null)

  function onRoomRowMouseenter(roomId: string) {
    if (dragState.value) {
      dragState.value.targetRoomId = roomId
    }
  }

  function confirmMove() {
    if (!pendingMove.value) return
    const p = pendingMove.value
    pendingMove.value = null
    emit('reservation-moved', {
      id:             p.id,
      room_id:        p.room_id,
      arrival_date:   p.arrival_date,
      departure_date: p.departure_date,
      company_id:     p.company_id,
      from_room_id:   p.from_room_id,
    })
  }

  function cancelMove() {
    if (!pendingMove.value) return
    const snap = pendingMove.value.snapshot
    pendingMove.value = null
    const idx = localReservations.value.findIndex(r => r.id === snap.id)
    if (idx !== -1) localReservations.value[idx] = snap
  }

  function onBlockMousedown(event: MouseEvent, block: BlockLayout, room: Room) {
    event.preventDefault()

    const ds: DragState = {
      blockId:      block.id,
      roomId:       block.roomId,
      targetRoomId: block.roomId,
      startX:       event.clientX,
      deltaDays:    0,
    }
    dragState.value = ds

    const origCheckIn  = block.checkIn
    const origCheckOut = block.checkOut

    function onMousemove(e: MouseEvent) {
      const snapped = Math.round((e.clientX - ds.startX) / DAY_COL_W.value)
      if (dragState.value) dragState.value.deltaDays = snapped
    }

    function onMouseup() {
      document.removeEventListener('mousemove', onMousemove)
      document.removeEventListener('mouseup',   onMouseup)

      const finalDelta = dragState.value?.deltaDays    ?? 0
      const newRoomId  = dragState.value?.targetRoomId ?? block.roomId
      dragState.value  = null

      if (newRoomId !== block.roomId || finalDelta !== 0) {
        const newCheckIn  = addDays(origCheckIn,  finalDelta)
        const newCheckOut = addDays(origCheckOut, finalDelta)

        const hasConflict = localReservations.value.some(r => {
          if (r.id === block.id) return false
          if (r.roomId !== newRoomId) return false
          return newCheckIn < r.checkOut && newCheckOut > r.checkIn
        })

        if (hasConflict) {
          const ds = dragState.value!
          ds.targetRoomId = ds.roomId
          isReverting.value = true
          requestAnimationFrame(() => {
            if (dragState.value) dragState.value.deltaDays = 0
            setTimeout(() => {
              dragState.value   = null
              isReverting.value = false
            }, REVERT_MS)
          })
          return
        }

        // snapshot original state for possible cancel
        const snapshot = { ...localReservations.value.find(r => r.id === block.id)! }

        const idx = localReservations.value.findIndex(r => r.id === block.id)
        if (idx !== -1) {
          localReservations.value[idx] = {
            ...localReservations.value[idx],
            roomId:   newRoomId,
            checkIn:  newCheckIn,
            checkOut: newCheckOut,
          }
        }

        pendingMove.value = {
          id:             block.id,
          room_id:        newRoomId,
          arrival_date:   newCheckIn,
          departure_date: newCheckOut,
          company_id:     config.value.companyId ?? '',
          from_room_id:   block.roomId,
          snapshot,
        }
      } else {
        emit('reservation-clicked', {
          reservation: { ...block, checkIn: origCheckIn, checkOut: origCheckOut },
          room,
        })
      }
    }

    document.addEventListener('mousemove', onMousemove)
    document.addEventListener('mouseup',   onMouseup)
  }

  return { dragState, isReverting, pendingMove, confirmMove, cancelMove, onRoomRowMouseenter, onBlockMousedown }
}
