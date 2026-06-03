import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Room, Reservation, BlockLayout, DragState, CalendarConfig } from '../types'

interface DragDropEmit {
  (event: 'reservation-clicked', payload: { reservation: Reservation; room: Room }): void
  (event: 'reservation-moved', payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string }): void
}

interface PendingMove {
  id:           string
  room_id:      string
  arrival_date: string
  departure_date: string
  company_id:   string
  from_room_id: string
  snapshot:     Reservation
}

function postFlutterMessage(type: string, payload: unknown) {
  if (typeof window !== 'undefined' && (window as any).Flutter) {
    (window as any).Flutter.postMessage(JSON.stringify({ type, payload }))
  }
}

export function useDragDrop(
  localReservations: Ref<Reservation[]>,
  emit: DragDropEmit,
  config: Ref<CalendarConfig>,
  allowVerticalDrag: Ref<boolean>,
) {
  const dragState   = ref<DragState | null>(null)
  const pendingMove = ref<PendingMove | null>(null)

  function confirmMove() {
    if (!pendingMove.value) return
    const p = pendingMove.value
    pendingMove.value = null
    const payload = {
      id:             p.id,
      room_id:        p.room_id,
      arrival_date:   p.arrival_date,
      departure_date: p.departure_date,
      company_id:     p.company_id,
      from_room_id:   p.from_room_id,
    }
    emit('reservation-moved', payload)
    postFlutterMessage('reservation-moved', payload)
  }

  function cancelMove() {
    if (!pendingMove.value) return
    const snap = pendingMove.value.snapshot
    pendingMove.value = null
    const idx = localReservations.value.findIndex(r => r.id === snap.id)
    if (idx !== -1) localReservations.value[idx] = snap
  }

  function onBlockPointerdown(event: PointerEvent, block: BlockLayout, room: Room) {
    if (event.button !== 0 && event.pointerType !== 'touch') return
    event.preventDefault()

    if (!allowVerticalDrag.value) {
      const payload = { reservation: block, room }
      emit('reservation-clicked', payload)
      postFlutterMessage('reservation-clicked', payload)
      return
    }

    const el = event.currentTarget as HTMLElement
    el.setPointerCapture(event.pointerId)

    dragState.value = {
      blockId:      block.id,
      roomId:       block.roomId,
      targetRoomId: block.roomId,
    }

    // Track whether the pointer moved far enough to count as a drag
    let hasMoved = false
    const startY = event.clientY

    function onPointermove(e: PointerEvent) {
      if (!dragState.value) return
      if (!hasMoved && Math.abs(e.clientY - startY) < 6) return
      hasMoved = true

      // Temporarily remove the dragged block from hit-testing so elementFromPoint
      // returns the underlying row and not the block itself (which sits at z-index: 20).
      // Pointer capture continues to deliver events to el regardless of this CSS flag.
      el.style.pointerEvents = 'none'
      const root = el.getRootNode() as ShadowRoot | Document
      const hit  = root.elementFromPoint(e.clientX, e.clientY)
      el.style.pointerEvents = ''

      const row = hit?.closest?.('[data-room-id]') as HTMLElement | null
      if (row?.dataset.roomId) dragState.value.targetRoomId = row.dataset.roomId
    }

    function cleanup() {
      el.removeEventListener('pointermove',   onPointermove)
      el.removeEventListener('pointerup',     onPointerup)
      el.removeEventListener('pointercancel', onPointercancel)
    }

    function onPointercancel() {
      cleanup()
      dragState.value = null
    }

    function onPointerup() {
      cleanup()

      const newRoomId = dragState.value?.targetRoomId ?? block.roomId
      dragState.value = null

      if (!hasMoved || newRoomId === block.roomId) {
        // Short press with no movement → treat as a click
        const payload = { reservation: { ...block }, room }
        emit('reservation-clicked', payload)
        postFlutterMessage('reservation-clicked', payload)
        return
      }

      const hasConflict = localReservations.value.some(r => {
        if (r.id === block.id)      return false
        if (r.roomId !== newRoomId) return false
        return block.checkIn < r.checkOut && block.checkOut > r.checkIn
      })

      if (hasConflict) return

      const snapshot = { ...localReservations.value.find(r => r.id === block.id)! }
      const idx = localReservations.value.findIndex(r => r.id === block.id)
      if (idx !== -1) {
        localReservations.value[idx] = { ...localReservations.value[idx], roomId: newRoomId }
      }

      pendingMove.value = {
        id:             block.id,
        room_id:        newRoomId,
        arrival_date:   block.checkIn,
        departure_date: block.checkOut,
        company_id:     config.value.companyId ?? '',
        from_room_id:   block.roomId,
        snapshot,
      }
    }

    el.addEventListener('pointermove',   onPointermove)
    el.addEventListener('pointerup',     onPointerup)
    el.addEventListener('pointercancel', onPointercancel)
  }

  return { dragState, pendingMove, confirmMove, cancelMove, onBlockPointerdown }
}
