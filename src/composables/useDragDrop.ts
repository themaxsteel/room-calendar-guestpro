import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Room, Reservation, BlockLayout, DragState, CalendarConfig } from '../types'

interface DragDropEmit {
  (event: 'reservation-clicked', payload: { reservation: Reservation; room: Room }): void
  (event: 'reservation-moved', payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string }): void
}

interface PendingMove {
  id:             string
  room_id:        string
  arrival_date:   string
  departure_date: string
  company_id:     string
  from_room_id:   string
  snapshot:       Reservation
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

    let hasMoved = false
    const startX   = event.clientX
    const startY   = event.clientY
    const elRect   = el.getBoundingClientRect()

    // Ghost element that visually follows the cursor — created on first movement so
    // a quick click never shows it. Appended to the shadow root so component styles apply.
    let ghost: HTMLElement | null = null

    function createGhost() {
      ghost = el.cloneNode(true) as HTMLElement
      // position: fixed at top/left 0; transform moves it to the correct screen coords.
      // This avoids any offset calculation from scroll or containing blocks.
      ghost.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: ${elRect.width}px;
        height: ${elRect.height}px;
        transform: translate(${elRect.left}px, ${elRect.top}px);
        pointer-events: none;
        z-index: 9999;
        opacity: 0.92;
        box-shadow: 0 8px 28px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
        cursor: grabbing;
        margin: 0;
        border-radius: 4px;
        will-change: transform;
      `
      const root = el.getRootNode()
      root instanceof ShadowRoot ? root.appendChild(ghost) : document.body.appendChild(ghost)

      // Dim the original block so it reads as a "source" placeholder
      el.style.opacity = '0.3'
    }

    function onPointermove(e: PointerEvent) {
      if (!dragState.value) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      if (!hasMoved) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        hasMoved = true
        createGhost()
      }

      // Translate the ghost directly — no Vue reactivity, stays at 60 fps.
      if (ghost) {
        ghost.style.transform = `translate(${elRect.left + dx}px, ${elRect.top + dy}px)`
      }

      // Detect which room row the cursor is over.
      // The ghost already has pointer-events:none; temporarily hide el too so
      // elementFromPoint returns the underlying table row, not the block itself.
      el.style.pointerEvents = 'none'
      const root = el.getRootNode() as ShadowRoot | Document
      const hit  = root.elementFromPoint(e.clientX, e.clientY)
      el.style.pointerEvents = ''

      const row = hit?.closest?.('[data-room-id]') as HTMLElement | null
      if (row?.dataset.roomId && row.dataset.roomId !== dragState.value.targetRoomId) {
        // Only mutate when crossing a row boundary to minimise reactive re-renders.
        dragState.value.targetRoomId = row.dataset.roomId
      }
    }

    function cleanup() {
      ghost?.remove()
      ghost = null
      el.style.opacity       = ''
      el.style.pointerEvents = ''
      el.removeEventListener('pointermove',   onPointermove)
      el.removeEventListener('pointerup',     onPointerup)
      el.removeEventListener('pointercancel', onPointercancel)
      onDragEnd?.()
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
        // Short tap / click with no meaningful movement
        const payload = { reservation: { ...block }, room }
        emit('reservation-clicked', payload)
        postFlutterMessage('reservation-clicked', payload)
        return
      }

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
