export const todayIso = new Date().toISOString().slice(0, 10)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
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
