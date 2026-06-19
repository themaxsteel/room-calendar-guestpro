import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Room, Reservation, BlockLayout, DragState, CalendarConfig } from '../types'

interface DragDropEmit {
  (event: 'reservation-clicked', payload: { reservation: Reservation; room: Room }): void
  (event: 'reservation-moved', payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string; original?: Record<string, unknown> }): void
}

interface PendingMove {
  id:             string
  room_id:        string
  arrival_date:   string
  departure_date: string
  company_id:     string
  from_room_id:   string
  snapshot:       Reservation
  original?:      Record<string, unknown>
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
  onDragEnd?: () => void,
  onMoveBlocked?: (reservation: Reservation) => void,
) {
  // True when the first ISO date is strictly before the second.
  // Both are YYYY-MM-DD so lexicographic comparison is correct.
  function isBefore(first: string, second: string): boolean {
    return first < second
  }
  const dragState        = ref<DragState | null>(null)
  const pendingMove      = ref<PendingMove | null>(null)
  // Kept after confirmMove so the caller can revert on API error
  const lastMoveSnapshot = ref<Reservation | null>(null)

  function confirmMove() {
    if (!pendingMove.value) return
    const p = pendingMove.value
    lastMoveSnapshot.value = p.snapshot
    pendingMove.value = null
    const payload = {
      id:             p.id,
      room_id:        p.room_id,
      arrival_date:   p.arrival_date,
      departure_date: p.departure_date,
      company_id:     p.company_id,
      from_room_id:   p.from_room_id,
      original:       p.original,
    }
    emit('reservation-moved', payload)
    postFlutterMessage('reservation-moved', payload)
  }

  function revertLastMove() {
    const snap = lastMoveSnapshot.value
    if (!snap) return
    lastMoveSnapshot.value = null
    const idx = localReservations.value.findIndex(r => r.id === snap.id)
    if (idx !== -1) localReservations.value[idx] = snap
  }

  function cancelMove() {
    if (!pendingMove.value) return
    const snap = pendingMove.value.snapshot
    pendingMove.value = null
    lastMoveSnapshot.value = null
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

    // Capture shadow root before el is potentially detached by Vue re-render
    const shadowRoot = el.getRootNode() as ShadowRoot | Document
    const pointerId  = event.pointerId

    dragState.value = {
      blockId:      block.id,
      roomId:       block.roomId,
      targetRoomId: block.roomId,
    }

    // Snapshot original state at drag start
    const snapshot = { ...localReservations.value.find(r => r.id === block.id) ?? block }
    const blockIdx = localReservations.value.findIndex(r => r.id === block.id)

    let hasMoved  = false
    const startX  = event.clientX
    const startY  = event.clientY

    function onPointermove(e: PointerEvent) {
      if (e.pointerId !== pointerId || !dragState.value) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      if (!hasMoved) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        hasMoved = true
      }

      // el may be detached after a room change — use the captured shadow root directly
      const hit = shadowRoot.elementFromPoint(e.clientX, e.clientY)
      const row = hit?.closest?.('[data-room-id]') as HTMLElement | null
      const newTargetRoomId = row?.dataset.roomId
      if (newTargetRoomId && newTargetRoomId !== dragState.value.targetRoomId) {
        dragState.value.targetRoomId = newTargetRoomId
        // Move the dimmed block live into the target room row
        if (blockIdx !== -1) {
          localReservations.value[blockIdx] = {
            ...localReservations.value[blockIdx],
            roomId: newTargetRoomId,
          }
        }
      }
    }

    function cleanup() {
      document.removeEventListener('pointermove',   onPointermove)
      document.removeEventListener('pointerup',     onPointerup)
      document.removeEventListener('pointercancel', onPointercancel)
      onDragEnd?.()
    }

    function onPointercancel(e: PointerEvent) {
      if (e.pointerId !== pointerId) return
      cleanup()
      // Revert block to original room
      if (blockIdx !== -1) localReservations.value[blockIdx] = snapshot
      dragState.value = null
    }

    function onPointerup(e: PointerEvent) {
      if (e.pointerId !== pointerId) return
      cleanup()

      const newRoomId = dragState.value?.targetRoomId ?? block.roomId
      dragState.value = null

      if (!hasMoved || newRoomId === block.roomId) {
        // Revert any live room change from micro-drift
        if (blockIdx !== -1) localReservations.value[blockIdx] = snapshot
        const payload = { reservation: { ...block }, room }
        emit('reservation-clicked', payload)
        postFlutterMessage('reservation-clicked', payload)
        return
      }

      // Business rule: a reservation whose check-in is before the hotel
      // app/business date cannot be moved. Roll back and notify the host.
      const appDate = config.value.appDate
      if (appDate && isBefore(block.checkIn, appDate)) {
        if (blockIdx !== -1) localReservations.value[blockIdx] = snapshot
        onMoveBlocked?.(snapshot)
        return
      }

      // Use the reservation's REAL arrival/departure (from the raw item) for the
      // move payload. block.checkIn/checkOut come from the timeline fields, which
      // the backend may clamp to the visible window — sending those makes the move
      // API reject with "different date". Fall back to checkIn/checkOut when raw
      // dates are absent (e.g. reservations supplied via the plain props API).
      const raw = snapshot.raw
      const realArrival   = typeof raw?.arrival_date   === 'string' && raw.arrival_date
        ? raw.arrival_date.slice(0, 10)   : block.checkIn
      const realDeparture = typeof raw?.departure_date === 'string' && raw.departure_date
        ? raw.departure_date.slice(0, 10) : block.checkOut

      // Block is already at newRoomId (moved live during drag)
      pendingMove.value = {
        id:             block.id,
        room_id:        newRoomId,
        arrival_date:   realArrival,
        departure_date: realDeparture,
        company_id:     config.value.companyId ?? '',
        from_room_id:   block.roomId,
        snapshot,
        original:       raw,
      }
    }

    // Use document-level listeners so events keep firing even after el is
    // detached from the DOM (which happens when Vue moves the block to a new row).
    document.addEventListener('pointermove',   onPointermove)
    document.addEventListener('pointerup',     onPointerup)
    document.addEventListener('pointercancel', onPointercancel)
  }

  return { dragState, pendingMove, confirmMove, cancelMove, revertLastMove, onBlockPointerdown }
}
