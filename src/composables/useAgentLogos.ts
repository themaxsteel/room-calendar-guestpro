/**
 * Maps GuestPro agent_name values to logo filename slugs.
 * Logo files should be placed in public/agents/<slug>.png
 *
 * To add a new agent: add an entry below and drop the PNG into public/agents/.
 */
const AGENT_SLUG_MAP: Record<string, string> = {
  // OTA international
  'booking.com':      'booking',
  'airbnb':           'airbnb',
  'expedia':          'expedia',
  'agoda':            'agoda',
  'hotels.com':       'hotels',
  'trip.com':         'trip',
  'tripadvisor':      'tripadvisor',

  // OTA Indonesia
  'traveloka':        'traveloka',
  'tiket.com':        'tiket',
  'pegipegi':         'pegipegi',
  'nusatrip':         'nusatrip',
  'airy':             'airy',
  'mister aladin':    'misteraladin',

  // Direct channels
  'direct':           'direct',
  'website':          'website',
  'walk_in':          'walk-in',
  'walk in':          'walk-in',
  'phone':            'phone',
  'email':            'email',
  'whatsapp':         'whatsapp',

  // Corporate / other
  'corporate':        'corporate',
  'travel agent':     'travel-agent',
  'ota':              'ota',
}

export function getAgentLogoSlug(agentName: string): string | null {
  if (!agentName) return null
  return AGENT_SLUG_MAP[agentName.toLowerCase().trim()] ?? null
}

export function getAgentLogoUrl(agentName: string, baseUrl: string): string | null {
  const slug = getAgentLogoSlug(agentName)
  if (!slug) return null
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  return `${base}${slug}.png`
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
