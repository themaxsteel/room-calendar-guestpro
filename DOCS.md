# Room Calendar — Developer Guide

A Vue 3 Web Component that renders a Gantt-style reservation calendar for GuestPro PMS. It ships as a single custom element `<room-calendar>` and integrates with the GuestPro backend API.

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

### Register the custom element

```js
import { register } from 'room-calendar-guestpro'

register() // registers <room-calendar>
```

Or in a Flutter WebView, load the built JS bundle — the element self-registers on import.

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
| `dayColWidth` | `number` | No | `100` | Width of each day column in pixels |
| `roomColWidth` | `number` | No | `170` | Width of the room label column in pixels |

```js
cal.config = {
  startDate: '2026-06-01',
  visibleDays: 30,
  companyId: 'gp-001',
  dayColWidth: 90,
  roomColWidth: 200,
  agentLogoBaseUrl: 'https://cdn.guestpro.id/agents/',
}
```

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
cal.setAvailability({
  data: [
    {
      room_type_id: 'deluxe',
      total: 10,
      availability: [
        { date: '2026-06-01', available: 3 },
        { date: '2026-06-02', available: 5 },
      ],
    },
  ],
})
```

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
| `reservation-moved` | `{ id, room_id, arrival_date, departure_date, company_id, from_room_id }` | User drops a block to a new room/date |
| `date-range-changed` | `{ startDate, endDate }` | Calendar navigates to a new date range |
| `new-reservation` | `{ roomId, checkIn, checkOut, type }` | User drags on an empty cell to create a reservation |
| `filter-search` | `{ startDate, openAvailability }` | User submits the filter/search panel |
| `calendar-config-saved` | Full config snapshot (`object`) | User saves visual settings from the config panel |
| `infinite-scroll-load` | `{ startDate, endDate }` | User scrolls near the edge — load more data |

### Example: handling `reservation-moved`

```js
cal.addEventListener('reservation-moved', async (e) => {
  const { id, room_id, arrival_date, departure_date, company_id, from_room_id } = e.detail
  try {
    await api.moveReservation({ id, room_id, arrival_date, departure_date, company_id })
  } catch {
    cal.revertLastMove() // roll back the drag on failure
  }
})
```

### Example: handling `infinite-scroll-load`

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
  calender_room_type_column: 170,       // (reserved)

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
