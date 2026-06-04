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

/** SVG path data for agents that use an icon instead of a logo image */
export type AgentIconType = 'booking-engine' | 'walk-in' | 'direct'

const AGENT_ICON_MAP: Record<string, AgentIconType> = {
  'booking_engine': 'booking-engine',
  'walk_in':        'walk-in',
  'direct':         'direct',
}

export const AGENT_ICON_PATHS: Record<AgentIconType, string> = {
  // Globe / web
  'booking-engine': 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.5 2.5-4 6-4 10s1.5 7.5 4 10m0-20c2.5 2.5 4 6 4 10s-1.5 7.5-4 10M2 12h20',
  // Person walking
  'walk-in': 'M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1.5 3l-1 4 2.5 2-1 4m-1.5-10l-3 1.5 1 3',
  // Phone
  'direct': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
}

export function getAgentIcon(agentName: string): AgentIconType | null {
  if (!agentName) return null
  return AGENT_ICON_MAP[agentName.toLowerCase().trim()] ?? null
}
