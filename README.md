# Room Calendar (GuestPro)

A self-contained **Web Component** (`<room-calendar>`) that renders a Gantt-style hotel PMS calendar — sticky room column on the left, scrollable day grid on the right, booking blocks overlaid on the grid.

Works in **any** host: Vue 2, Vue 3, React, vanilla JS, or Flutter WebView. The Vue 3 runtime is bundled inside, so the host app doesn't need Vue.

## Features

- Sticky room column + horizontally scrollable day grid
- Booking blocks with status colors, guest/folio labels, and agent icons (`icon_code` tinted by `agent_color`)
- Drag-to-move reservations (with confirmation dialog) and drag-to-create new ones
- App-date guard: dates before the hotel business date are locked for move/create
- Load More button for fetching the next date range
- Room-type availability badges and a hover tooltip (Total Bill / Outstanding)
- Loading lock, deferred Save Configuration, search, filter, and visual configuration

## Install

```bash
npm install room-calendar-guestpro
```

```js
// ES module (Vite / webpack / any framework)
import { register } from 'room-calendar-guestpro'
register() // defines <room-calendar>
```

```html
<!-- Plain script (no bundler / Flutter WebView) — Vue 3 is bundled in -->
<script src="room-calendar.umd.cjs"></script>
<script>RoomCalendar.register()</script>
```

## Quick Start

```html
<room-calendar id="cal"></room-calendar>
<script>
  const cal = document.getElementById('cal')
  cal.config = { startDate: '2026-06-01', visibleDays: 30, companyId: 'YOUR_COMPANY_ID' }
  cal.setData(chartingRoomsApiResponse)     // rooms
  cal.loadReservation(reservationsApiResponse) // reservations
</script>
```

See **[DOCS.md](DOCS.md)** for the full API (config, methods, events) and integration examples.

## Build Outputs

| File | For | Vue runtime |
|---|---|---|
| `dist/room-calendar.js` / `.umd.cjs` | Vue 2, React, vanilla, Flutter | Bundled in |
| `dist/room-calendar.vue3.js` / `.vue3.umd.cjs` (`import … from 'room-calendar-guestpro/vue3'`) | Vue 3 hosts | External (uses host's Vue) |

## Development

All commands run from `room-calendar/`:

```bash
npm run dev         # Vite dev server on port 5175 (open demo-guestpro.html)
npm run build       # Build the library → dist/ (both bundles + .d.ts)
npm run type-check  # vue-tsc type check (no emit)
```

There is no test suite — manual testing is done via the dev server.

## Documentation

- **[DOCS.md](DOCS.md)** — developer guide: props, public API, events, configuration
- **[CLAUDE.md](CLAUDE.md)** — architecture and contribution notes

All content in this project is in English.
