import { computed } from 'vue'
import type { Ref } from 'vue'
import type { CalendarConfig } from '../types'
import { addDays, isoToLabel, weekLabel, todayIso } from './useDateHelpers'

export function useCalendarDays(config: Ref<CalendarConfig>) {
  const visibleDays = computed(() => {
    const days = []
    for (let i = 0; i < config.value.visibleDays; i++) {
      const iso = addDays(config.value.startDate, i)
      days.push({ iso, label: isoToLabel(iso), isToday: iso === todayIso })
    }
    return days
  })

  const weekHeaders = computed(() => {
    const headers: { label: string; span: number }[] = []
    let currentKey = ''
    let firstDayIso = ''
    let span = 0
    for (const day of visibleDays.value) {
      const d = new Date(day.iso)
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      if (key !== currentKey) {
        if (currentKey) headers.push({ label: weekLabel(firstDayIso), span })
        currentKey = key
        firstDayIso = day.iso
        span = 1
      } else {
        span++
      }
    }
    if (currentKey) headers.push({ label: weekLabel(firstDayIso), span })
    return headers
  })

  return { visibleDays, weekHeaders }
}
