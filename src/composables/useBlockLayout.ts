import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Reservation, CalendarConfig, BlockLayout } from '../types'

const MS_PER_DAY = 86_400_000

export function useBlockLayout(
  localReservations: Ref<Reservation[]>,
  config: Ref<CalendarConfig>,
  DAY_COL_W: Ref<number>,
  blockStartMidnight: Ref<boolean> = ref(false),
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

      const startOffset = blockStartMidnight.value ? 0 : DAY_COL_W.value / 2
      const block: BlockLayout = {
        ...r,
        left:      offsetDays * DAY_COL_W.value + startOffset,
        width:     spanDays   * DAY_COL_W.value - 2,
        row:       0,
        totalRows: 1,
      }

      const list = map.get(r.roomId) ?? []
      list.push(block)
      map.set(r.roomId, list)
    }

    // Detect overlapping blocks per room and assign stacked rows
    for (const blocks of map.values()) {
      // Sort by checkIn so we can greedily assign rows
      blocks.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

      // rowEnds[r] = latest checkOut date string assigned to row r
      const rowEnds: string[] = []

      for (const block of blocks) {
        let assigned = -1
        for (let r = 0; r < rowEnds.length; r++) {
          // Row is free when this block's checkIn >= that row's last checkOut (exclusive)
          if (block.checkIn >= rowEnds[r]) {
            assigned    = r
            rowEnds[r]  = block.checkOut
            break
          }
        }
        if (assigned === -1) {
          assigned = rowEnds.length
          rowEnds.push(block.checkOut)
        }
        block.row = assigned
      }

      const totalRows = rowEnds.length
      for (const block of blocks) block.totalRows = totalRows
    }

    return map
  })

  function roomBlocks(roomId: string): BlockLayout[] {
    return blocksByRoom.value.get(roomId) ?? []
  }

  function roomTotalRows(roomId: string): number {
    const blocks = blocksByRoom.value.get(roomId)
    if (!blocks || blocks.length === 0) return 1
    return blocks[0].totalRows
  }

  return { roomBlocks, roomTotalRows, wrapRef }
}
