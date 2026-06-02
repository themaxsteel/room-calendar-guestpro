import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Reservation, CalendarConfig, BlockLayout, DragState } from '../types'
import { addDays } from './useDateHelpers'

const MS_PER_DAY = 86_400_000

export function useBlockLayout(
  localReservations: Ref<Reservation[]>,
  dragState: Ref<DragState | null>,
  config: Ref<CalendarConfig>,
  DAY_COL_W: Ref<number>,
) {
  const wrapRef = ref<HTMLElement | null>(null)

  const startMs = computed(() => new Date(config.value.startDate).getTime())

  const blocksByRoom = computed(() => {
    const ds = dragState.value
    const map = new Map<string, BlockLayout[]>()

    for (const r of localReservations.value) {
      const checkIn  = (ds?.blockId === r.id && ds.deltaDays !== 0) ? addDays(r.checkIn,  ds.deltaDays) : r.checkIn
      const checkOut = (ds?.blockId === r.id && ds.deltaDays !== 0) ? addDays(r.checkOut, ds.deltaDays) : r.checkOut

      const ciMs = new Date(checkIn).getTime()
      const coMs = new Date(checkOut).getTime()
      const offsetDays = (ciMs - startMs.value) / MS_PER_DAY
      const spanDays   = (coMs - ciMs) / MS_PER_DAY

      if (offsetDays >= config.value.visibleDays || offsetDays + spanDays <= 0) continue

      const block: BlockLayout = {
        ...r,
        checkIn,
        checkOut,
        left:  offsetDays * DAY_COL_W.value + DAY_COL_W.value / 2,
        width: spanDays   * DAY_COL_W.value - 2,
      }
      const renderRoomId = (ds?.blockId === r.id && ds.targetRoomId) ? ds.targetRoomId : r.roomId
      const list = map.get(renderRoomId) ?? []
      list.push(block)
      map.set(renderRoomId, list)
    }
    return map
  })

  function roomBlocks(roomId: string): BlockLayout[] {
    return blocksByRoom.value.get(roomId) ?? []
  }

  return { roomBlocks, wrapRef }
}
