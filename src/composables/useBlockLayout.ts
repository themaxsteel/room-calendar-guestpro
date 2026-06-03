import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Reservation, CalendarConfig, BlockLayout } from '../types'

const MS_PER_DAY = 86_400_000

export function useBlockLayout(
  localReservations: Ref<Reservation[]>,
  config: Ref<CalendarConfig>,
  DAY_COL_W: Ref<number>,
) {
  const wrapRef = ref<HTMLElement | null>(null)

  const startMs = computed(() => new Date(config.value.startDate).getTime())

  const blocksByRoom = computed(() => {
    const map = new Map<string, BlockLayout[]>()

    for (const r of localReservations.value) {
      const ciMs = new Date(r.checkIn).getTime()
      const coMs = new Date(r.checkOut).getTime()
      const offsetDays = (ciMs - startMs.value) / MS_PER_DAY
      const spanDays   = (coMs - ciMs) / MS_PER_DAY

      if (offsetDays >= config.value.visibleDays || offsetDays + spanDays <= 0) continue

      const block: BlockLayout = {
        ...r,
        left:  offsetDays * DAY_COL_W.value + DAY_COL_W.value / 2,
        width: spanDays   * DAY_COL_W.value - 2,
      }

      const list = map.get(r.roomId) ?? []
      list.push(block)
      map.set(r.roomId, list)
    }
    return map
  })

  function roomBlocks(roomId: string): BlockLayout[] {
    return blocksByRoom.value.get(roomId) ?? []
  }

  return { roomBlocks, wrapRef }
}
