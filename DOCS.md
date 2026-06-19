# Room Calendar — Developer Guide

A self-contained Web Component that renders a Gantt-style reservation calendar for GuestPro PMS. It ships as a single custom element `<room-calendar>` and works with **any framework or no framework** — Vue 2, Vue 3, React, Angular, Flutter WebView, or plain HTML.

> **Framework compatibility note**
> The library bundles its own Vue 3 runtime internally. The host application does **not** need to install or use Vue. Communication happens entirely through native DOM properties and `CustomEvent`s.

---

## Table of Contents

1. [Setup](#1-setup)
2. [Basic Usage](#2-basic-usage)
3. [Config Prop](#3-config-prop)
4. [Loading Data](#4-loading-data)
5. [Public API Methods](#5-public-api-methods)
6. [Events](#6-events)
7. [Calendar Configuration (Visual Settings)](#7-calendar-configuration-visual-settings)
8. [Filter & Display Options](#8-filter--display-options)
9. [Room Status Reference](#9-room-status-reference)
10. [Reservation Status Reference](#10-reservation-status-reference)

---

## 1. Setup

### Install

```bash
npm install room-calendar-guestpro
```

### Option A — ES module import (bundler / Vite / Webpack)

```js
import { register } from 'room-calendar-guestpro'

register() // registers <room-calendar> with the browser
```

This works in any app regardless of its own framework (Vue 2, Vue 3, React, etc.).

### Option B — Plain `<script>` tag (no bundler / Flutter WebView)

```html
<script src="room-calendar.umd.cjs"></script>
<script>
  RoomCalendar.register()
</script>
```

The UMD bundle is fully self-contained — Vue 3 is already bundled inside.

### Using in Vue 2

```js
// main.js
import { register } from 'room-calendar-guestpro'
register()

new Vue({
  el: '#app',
  // Tell Vue 2 to leave <room-calendar> alone (it is a native custom element)
  ignoredElements: ['room-calendar'],
})
```

Then use it in templates as a plain HTML element:

```html
<room-calendar ref="cal"></room-calendar>
```

Access the public API via `this.$refs.cal` (the underlying DOM element, not a Vue component).

### Using in Vue 3

```js
// main.js
import { register } from 'room-calendar-guestpro'
register()

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (tag) => tag === 'room-calendar'
app.mount('#app')
```

---

## 2. Basic Usage

```html
<room-calendar id="cal"></room-calendar>

<script>
  const cal = document.getElementById('cal')

  // Required: set config before loading data
  cal.config = {
    startDate: '2026-06-01',
    visibleDays: 14,
    companyId: 'YOUR_COMPANY_ID',
  }

  // Load rooms and reservations from the GuestPro API
  cal.setData(chartingRoomsApiResponse)
  cal.loadReservation(reservationsApiResponse)
</script>
```

---

## 3. Config Prop

Passed as a JS object (not a JSON string) to the `config` property.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDate` | `string` | Yes | — | First visible date (`YYYY-MM-DD`) |
| `visibleDays` | `number` | Yes | — | Number of day columns to show |
| `companyId` | `string` | No | — | Forwarded in `reservation-moved` event payloads |
| `appDate` | `string` | No | — | Hotel business/audit date (`YYYY-MM-DD`). Dates **before** this are locked: a reservation whose check-in is before `appDate` cannot be moved (drag rolled back + toast), and drag-to-create can't select locked dates. The `appDate` itself is allowed. Omit to disable the restriction. |
| `dayColWidth` | `number` | No | `100` | Width of each day column in pixels |
| `roomColWidth` | `number` | No | `170` | Width of the room label column in pixels |
| `key_start_date_timeline_item_calendar` | `string` | No | `"startDate"` | Raw reservation field used to position a block's **start** on the timeline. The backend may clamp this to the visible window, so it is display-only — the real check-in for the move API comes from `arrival_date`. |
| `key_end_date_timeline_item_calendar` | `string` | No | `"endDate"` | Raw reservation field used to position a block's **end** on the timeline (display-only, see above). |

```js
cal.config = {
  startDate: '2026-06-01',
  visibleDays: 30,
  companyId: 'gp-001',
  appDate: '2026-06-01',
  dayColWidth: 90,
  roomColWidth: 200,
  // Defaults shown — only override if your payload uses different field names
  key_start_date_timeline_item_calendar: 'startDate',
  key_end_date_timeline_item_calendar: 'endDate',
}
```

> **Timeline dates vs. real dates.** Each block is positioned on the timeline using `startDate`/`endDate` (or the configured keys above), which the backend may clamp to the visible window. The reservation's **real** dates (`arrival_date`/`departure_date`) and the full raw item are preserved and sent with the `reservation-moved` event — see [Example: handling `reservation-moved`](#example-handling-reservation-moved).

---

## 4. Loading Data

All data methods accept GuestPro API response shapes directly — no manual transformation needed.

### `setData(chartingRooms)`

Replaces the full room list. Call this once after fetching `charting_rooms`.

```js
// Response from GET /charting_rooms
cal.setData(apiResponse.data)
```

### `loadReservation(data)`

Replaces all reservations. Use this for the initial load.

```js
// Response from GET /calendar_reservation_data_list
cal.loadReservation(apiResponse)
```

### `appendReservation(data)`

Adds new reservations without removing existing ones. Use this for infinite scroll loading.

```js
cal.appendReservation(newPageApiResponse)
```

### `updateReservations(data)`

Upserts: updates matching reservations by ID and inserts new ones. Use this after a reservation is created or modified.

```js
cal.updateReservations(updatedReservationApiResponse)
```

### `setAvailability(data)`

Sets the availability badge count shown on room-type section header rows.

```js
// Pass the API response directly — no transformation needed.
// Shape matches the v2/calendar_room_type_availability response.
cal.setAvailability({
  data: [
    {
      room_type_id: 'cd417c00-1c6b-11ee-950c-91867f928fa6',
      availability: [
        { date: '2026-06-01', available: 3 },
        { date: '2026-06-02', available: 5 },
      ],
    },
  ],
})
```

### `appendAvailability(data)`

Same payload shape as `setAvailability`, but **merges** the incoming day counts into the existing availability instead of replacing it. Use this for infinite scroll / Load More so previously loaded dates keep their badges.

```js
cal.appendAvailability(nextRangeAvailabilityResponse)
```

### Reservation fields used by the block & tooltip

These fields from the `calendar_reservation_data_list` response are read automatically — no extra calls needed:

| API field | Effect |
|---|---|
| `icon_code` | Font Awesome class (e.g. `"b-fa b-fa-user"`) → solid icon shown on the left of the block. Unknown codes fall back to a single-user icon. Supported: user, users, ship/boat, bed, motorcycle, plane-arrival, plane-departure, heart, trash, cake, ban, star, clock, lock. |
| `agent_color` | Hex color used to tint the block icon (e.g. `"#e6e600"`). |
| `total` | Shown as **Total Bill** in the hover tooltip (formatted `Rp …`). |
| `total_paid` | Drives the paid % bar; **Outstanding** = `total − total_paid` (shown red when > 0). |

---

## 5. Public API Methods

Get a reference to the element first:

```js
const cal = document.getElementById('cal')
// or in Flutter WebView:
// const cal = document.querySelector('room-calendar')
```

### Navigation

| Method | Description |
|---|---|
| `cal.goToDate('2026-07-01')` | Jump to a specific date and fire `date-range-changed` |
| `cal.goToToday()` | Jump to today and fire `date-range-changed` |

> After either call, your app should update `config.startDate` to match the new date.

### Search

| Method | Description |
|---|---|
| `cal.search('John')` | Highlight matching reservations; pass `''` to clear |

### Drag & Drop

| Method | Description |
|---|---|
| `cal.revertLastMove()` | Undo the last drag-move (call this if the `reservation-moved` API call fails) |

### Loading Lock

Block all calendar interaction (drag, click, scroll, buttons) while you update data. The calendar stays visible under a light veil with a small spinner.

| Method | Description |
|---|---|
| `cal.showLoading(text?)` | Show the loading veil and disable all interaction. Pass an optional message to vary the text per action; omit it to use the default `"Loading..."`. |
| `cal.hideLoading()` | Hide the veil and re-enable interaction |

```js
cal.showLoading('Saving reservation...')   // custom text
try {
  const data = await api.getReservations(...)
  cal.loadReservation(data)
} finally {
  cal.hideLoading()
}

cal.showLoading()   // no argument → shows the default "Loading..."
```

---

## 6. Events

All events are standard `CustomEvent`s. Listen with `addEventListener`. The payload is always in `event.detail`.

```js
cal.addEventListener('reservation-clicked', (e) => {
  console.log(e.detail.reservation, e.detail.room)
})
```

| Event | Payload (`event.detail`) | When fired |
|---|---|---|
| `reservation-clicked` | `{ reservation, room }` | User clicks a booking block |
| `reservation-moved` | `{ id, room_id, arrival_date, departure_date, company_id, from_room_id, original }` | User drops a block to a new room. `arrival_date`/`departure_date` are the reservation's **real** dates (not the clamped timeline dates); `original` is the full raw reservation item. |
| `date-range-changed` | `{ startDate, endDate }` | Calendar navigates to a new date range |
| `new-reservation` | `{ roomId, checkIn, checkOut, type }` | User drags on an empty cell to create a reservation |
| `filter-search` | `{ startDate, openAvailability }` | User submits the filter/search panel |
| `calendar-config-saved` | Full config snapshot (`object`) | User saves visual settings from the config panel (immediate mode only — see [Deferred Save](#deferred-save-configuration)) |
| `infinite-scroll-load` | `{ startDate, endDate }` | User clicks the **Load More** button after scrolling to the right edge |

### Example: handling `reservation-moved`

`arrival_date` / `departure_date` are the reservation's **real** dates (taken from the raw item's `arrival_date`/`departure_date`), so they match what the move API expects — they are **not** the timeline `startDate`/`endDate`, which the backend may clamp to the visible window. The full raw item is also provided as `original` if you need other fields.

```js
cal.addEventListener('reservation-moved', async (e) => {
  const { id, room_id, arrival_date, departure_date, company_id, from_room_id, original } = e.detail
  try {
    await api.moveReservation({ id, room_id, arrival_date, departure_date, company_id })
  } catch {
    cal.revertLastMove() // roll back the drag on failure
  }
})
```

### Example: handling `infinite-scroll-load`

A **Load More** button appears in the toolbar once the user scrolls to the right edge of the grid. Clicking it fires this event and appends 30 more days.

```js
cal.addEventListener('infinite-scroll-load', async (e) => {
  const { startDate, endDate } = e.detail
  const data = await api.getReservations({ startDate, endDate })
  cal.appendReservation(data)
})
```

### Example: handling `new-reservation`

```js
cal.addEventListener('new-reservation', (e) => {
  const { roomId, checkIn, checkOut, type } = e.detail
  // Open your booking form with these pre-filled values
  openNewReservationForm({ roomId, checkIn, checkOut, type })
})
```

---

## 7. Calendar Configuration (Visual Settings)

### Deferred Save Configuration

By default, clicking **Save Configuration** in the config panel applies the changes to the UI immediately and fires the `calendar-config-saved` event.

If you need to persist the config to your backend **first** and only update the UI on success, register a deferred handler with `setSaveConfigurationHandler`. Your handler receives `(config, event)`; the UI changes **only** when you call `event.commit()`. If you never call it, the calendar keeps its previous settings.

```js
cal.setSaveConfigurationHandler(async (config, event) => {
  console.log(config) // current draft config from the panel

  const ok = await api.saveCalendarConfig(config) // persist to your backend
  if (ok) {
    event.commit()    // now apply the changes to the calendar UI
  }
  // if you don't commit, the UI stays unchanged
})
```

- When a handler is registered, the `calendar-config-saved` event is **not** fired (your handler already has the config).
- Pass `null` to remove the handler and restore the immediate-update behaviour: `cal.setSaveConfigurationHandler(null)`.
- Other modules that don't register a handler keep the existing immediate-update model.

---

### `setCalendarConfiguration`

`setCalendarConfiguration` applies visual settings using GuestPro backend field names. Call this once after fetching the user's saved calendar config.

```js
cal.setCalendarConfiguration({
  calender_label: 'guest_name',         // 'guest_name' | 'folio' | 'guest_name,folio'
  calender_type: 'BY_ROOM_TYPE',        // 'BY_ROOM_TYPE' | 'NORMAL'
  calender_use_unallocated: 1,          // 1 = show rooms with no bookings
  calender_total_balance: 0,            // 1 = show balance on block
  show_bed_type_after_room_name: 1,     // 1 = show bed name in room column
  calender_show_hover_tooltips: 1,      // 1 = show detail tooltip on hover
  calender_block_start_midnight: 0,     // 1 = block rendering starts at midnight
  calender_room_column: 170,            // room column width in px
  calender_room_type_column: 170,       // accepted & stored for backend round-trip, but has no visual effect (room types render as section header rows, not a column) — no config-popup input

  // Status block colors
  background_color_reservation: '#d97706',
  background_color_tentative: '#475569',
  background_color_inhouse: '#16a34a',
  background_color_checkout: '#dc2626',
  background_color_room_maintenance: '#475569',

  // Status text colors
  foreground_color_reservation: '#ffffff',
  foreground_color_tentative: '#ffffff',
  foreground_color_inhouse: '#ffffff',
  foreground_color_checkout: '#ffffff',
  foreground_color_room_maintenance: '#ffffff',
})
```

---

## 8. Filter & Display Options

`setFilter` applies display overrides at runtime without touching the backend config. All fields are optional.

```js
cal.setFilter({
  calendarType: 'by-room-type',   // 'by-room-type' | 'normal'
  calendarLabel: 'guest-name',    // 'guest-name' | 'folio'
  roomColWidth: 200,              // room column width in px
  showRoomStatus: true,           // show OC/VC badge in room column
  showUnallocated: true,          // show rooms with no reservations
  showTotalBalance: false,        // show balance amount on block
  showBedName: true,              // show bed type after room name
  showReservationDetail: true,    // show hover tooltip
  allowVerticalDrag: true,        // allow drag to change room
  roomOrder: ['room-1', 'room-2', 'room-3'], // explicit room order (calendarType: 'normal' only)

  // Also navigate to a new date range
  startDate: '2026-07-01',
  endDate: '2026-07-30',
})
```

---

## 9. Room Status Reference

| Code | Meaning |
|---|---|
| `OC` | Occupied Clean |
| `OD` | Occupied Dirty |
| `VC` | Vacant Clean |
| `VCI` | Vacant Clean Inspected |
| `VD` | Vacant Dirty |
| `UL` | Out of Order |

---

## 10. Reservation Status Reference

| Value | Block color (default) | Meaning |
|---|---|---|
| `DEFINITE` | Amber | Confirmed reservation |
| `CHECK-IN` | Green | Currently checked in |
| `CHECK-OUT` | Red | Checked out today |
| `BOOKED` | Slate | Tentative / on-hold |
| `ROOM_MAINTENANCE` | Slate | Room blocked for maintenance |
