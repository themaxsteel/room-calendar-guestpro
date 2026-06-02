export const todayIso = new Date().toISOString().slice(0, 10)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Smart date range: same month+year → "22–25 May 2026"
 * Different month, same year  → "22 May – 1 Jun 2026"
 * Different year              → "30 Dec 2025 – 2 Jan 2026"
 */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const sameYear  = a.getFullYear() === b.getFullYear()
  const sameMonth = sameYear && a.getMonth() === b.getMonth()

  if (sameMonth) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  }
  if (sameYear) {
    return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function isoToLabel(iso: string): string {
  const d = new Date(iso)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]}, ${d.getDate()}`
}

export function weekLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()} ${d.toLocaleString('en', { month: 'long' })} ${d.getDate()}`
}
