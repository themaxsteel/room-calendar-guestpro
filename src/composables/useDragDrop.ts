import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Room, Reservation, BlockLayout, DragState } from '../types'
import { addDays } from './useDateHelpers'

interface DragDropEmit {
  (event: 'reservation-clicked', payload: { reservation: Reservation; room: Room }): void
  (event: 'reservation-moved', payload: { reservationId: string; fromRoomId: string; newRoomId: string; newCheckIn: string; newCheckOut: string }): void
}

export function useDragDrop(
  localReservations: Ref<Reservation[]>,
  DAY_COL_W: Ref<number>,
  emit: DragDropEmit,
) {
  const dragState = ref<DragState | null>(null)

  function onRoomRowMouseenter(roomId: string) {
    if (dragState.value) {
      dragState.value.targetRoomId = roomId
    }
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

        const idx = localReservations.value.findIndex(r => r.id === block.id)
        if (idx !== -1) {
          localReservations.value[idx] = {
            ...localReservations.value[idx],
            roomId:   newRoomId,
            checkIn:  newCheckIn,
            checkOut: newCheckOut,
          }
        }

        emit('reservation-moved', {
          reservationId: block.id,
          fromRoomId:    block.roomId,
          newRoomId,
          newCheckIn,
          newCheckOut,
        })
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

  return { dragState, onRoomRowMouseenter, onBlockMousedown }
}
