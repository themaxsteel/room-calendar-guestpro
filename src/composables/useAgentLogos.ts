/**
 * Maps GuestPro agent_name values to logo filenames in public/agents/.
 * To add a new agent: add an entry below and drop the file into public/agents/.
 */
const AGENT_FILE_MAP: Record<string, string> = {
  // OTA international
  'booking.com':      'booking-com-logo.png',
  'airbnb':           'airbnb-logo.jpeg',
  'expedia':          'expedia-logo.png',
  'agoda':            'agoda-logo.png',
  'trip.com':         'trip-logo.webp',
  'tripadvisor':      'tripadvisor-logo.png',

  // OTA Indonesia
  'traveloka':        'traveloka-logo.webp',
  'tiket.com':        'tiket-logo.webp',
  'pegipegi':         'pegipegi-logo.jpg',
}

export function getAgentLogoUrl(agentName: string, baseUrl: string): string | null {
  if (!agentName) return null
  const file = AGENT_FILE_MAP[agentName.toLowerCase().trim()]
  if (!file) return null
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  return `${base}${file}`
}

/** Short display label for text fallback chip */
export function getAgentShortLabel(agentName: string): string {
  if (!agentName) return ''
  const lower = agentName.toLowerCase().trim()
  const labels: Record<string, string> = {
    'booking.com':      'BKG',
    'airbnb':           'AIR',
    'expedia':          'EXP',
    'agoda':            'AGO',
    'hotels.com':       'HTL',
    'trip.com':         'TRP',
    'tripadvisor':      'TRP',
    'traveloka':        'TLK',
    'tiket.com':        'TKT',
    'pegipegi':         'PGP',
    'nusatrip':         'NUS',
    'mister aladin':    'MRA',
    'direct':           'DIR',
    'website':          'WEB',
    'walk_in':          'WLK',
    'walk in':          'WLK',
    'phone':            'PHN',
    'email':            'EML',
    'whatsapp':         'WA',
    'corporate':        'CRP',
    'travel agent':     'TA',
  }
  return labels[lower] ?? agentName.slice(0, 3).toUpperCase()
}
