import { computed } from 'vue'
import type { Reservation, CalendarConfig } from '../types'

export function useBookingBlocks(
  reservations: Reservation[],
  config: CalendarConfig,
  dayColWidth: number,
) {
  const startMs = new Date(config.startDate).getTime()
  const MS_PER_DAY = 86_400_000

  return computed(() =>
    reservations.map((r) => {
      const ciMs = new Date(r.checkIn).getTime()
      const coMs = new Date(r.checkOut).getTime()
      const offsetDays = (ciMs - startMs) / MS_PER_DAY
      const spanDays = (coMs - ciMs) / MS_PER_DAY

      return {
        ...r,
        left: offsetDays * dayColWidth,
        width: spanDays * dayColWidth - 2,
        visible: offsetDays < config.visibleDays && offsetDays + spanDays > 0,
      }
    }),
  )
}
