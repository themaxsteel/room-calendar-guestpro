# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

- **Do not start the preview server or take screenshots after editing code.** The user will verify changes manually in the browser.

## Commands

All commands run from `room-calendar/`:

```bash
npm run dev          # Vite dev server on port 5175
npm run build        # Build library → dist/ (ESM + UMD + .d.ts)
npm run type-check   # vue-tsc type check (no emit)
```

There is no test suite. Manual testing is done via `npm run dev` and opening the Vite dev server in a browser.

## Architecture

### What this is
A Vue 3 Web Component library that exports a single custom element `<room-calendar>`. The component renders a Gantt-style hotel PMS calendar — sticky room column on the left, scrollable day grid on the right, booking blocks overlaid as absolutely-positioned `div`s.

### Key files
| File | Role |
|------|------|
| `src/components/RoomCalendar.ce.vue` | The entire component — template, script, scoped styles |
| `src/types/index.ts` | All shared TypeScript types |
| `src/index.ts` | `defineCustomElement` wrapper + `register()` export |
| `src/composables/useBlockLayout.ts` | Computes `left`/`width`/`row`/`totalRows` for every booking block |
| `src/composables/useDragDrop.ts` | Drag-and-drop state machine for moving reservations |
| `src/composables/useCalendarDays.ts` | Derives the visible day column array from `CalendarConfig` |
| `src/composables/useSections.ts` | Manages reactive room sections state |
| `src/composables/useDateHelpers.ts` | Pure date utilities (`addDays`, `isoToLabel`, `weekLabel`, etc.) |
| `src/composables/useTooltip.ts` | Tooltip visibility and positioning state |
| `src/composables/useGuestProAdapter.ts` | Transforms GuestPro API payloads → `RoomSection[]` / `Reservation[]` |
| `src/composables/useBookingBlocks.ts` | Legacy utility composable (unused by the main component) |
| `vite.config.ts` | Library build config |

### Web Component / Shadow DOM constraints
- The file **must** use the `.ce.vue` extension — this tells `@vitejs/plugin-vue` to collect `<style>` blocks for shadow DOM injection.
- `@vitejs/plugin-vue` is configured with `customElement: true`.
- `cssCodeSplit: false` ensures all CSS is inlined into the JS bundle so shadow DOM receives styles.
- **Never use `@/` path aliases** inside `.ce.vue` files — `vite-plugin-dts` cannot resolve them during type generation. Use relative imports only (e.g. `../types`).

### Props → `sections`, `reservations`, `config`
- `sections?: RoomSection[]` — room type groups, each containing an array of `Room` objects. Optional; the GuestPro integration populates this via `setData()` instead.
- `reservations?: Reservation[]` — each reservation references a `roomId` and has ISO `checkIn` / `checkOut` dates (check-out is exclusive). Optional; `loadReservation()` / `appendReservation()` are the preferred API.
- `config: CalendarConfig` — `startDate` (ISO), `visibleDays`, optional `dayColWidth` (default **100 px**), `roomColWidth` (default 170 px), optional `companyId` (forwarded in `reservation-moved` events).

When used as a plain HTML custom element, array/object props arrive as JSON strings — any consumer code must call `JSON.parse` before passing them in.

### Booking block layout
Blocks are anchored to the **first visible day column** (`idx === 0`) of each room row using `position: absolute`. `left` and `width` are computed from `(checkIn - startDate) / MS_PER_DAY * DAY_COL_W`. The `booking-inner` div shifts rightward (`stickyOffset`) when the block scrolls behind the sticky room column so the guest name stays visible.

### Emits (native `CustomEvent`, payload in `event.detail`)
Every emit is also forwarded via `postFlutterMessage` for Flutter WebView integration.

| Event | Payload |
|-------|---------|
| `reservation-clicked` | `{ reservation: Reservation, room: Room }` |
| `reservation-moved` | `{ id, room_id, arrival_date, departure_date, company_id, from_room_id }` |
| `date-range-changed` | `{ startDate: string, endDate: string }` |
| `new-reservation` | `{ roomId, checkIn, checkOut, type: 'room-plan' \| 'single' \| 'group' }` |
| `calendar-config-saved` | `Record<string, unknown>` (full cal-config snapshot) |
| `filter-search` | `{ startDate: string, openAvailability: boolean }` |
| `infinite-scroll-load` | `{ startDate: string, endDate: string }` (fired when scrolling near the edge) |

### Public API (`defineExpose`)

**Navigation**
- `goToDate(iso)` — jumps to a date and fires `date-range-changed`.
- `goToToday()` — jumps to today and fires `date-range-changed`.
- The caller is responsible for updating `config.startDate` in response.

**GuestPro data ingestion** (preferred over props for live integration)
- `setData(chartingRooms: GuestProChartingRoom[])` — replaces all room sections.
- `loadReservation(data)` — replaces all reservations from a GuestPro payload.
- `appendReservation(data)` — appends new reservations without clearing existing ones.
- `updateReservations(data)` — upserts: updates matching reservations, inserts new ones.

**Drag-drop**
- `revertLastMove()` — undoes the last drag-move (restores the previous room/date).

**Search & filter**
- `search(query: string)` — client-side text filter over reservation blocks.
- `setFilter(filter: CalendarFilter)` — applies display options (room order, column widths, label style, etc.) and optionally jumps to a new date range.

**Calendar configuration**
- `setCalendarConfiguration(cfg)` — sets visual settings (colors, column widths, block label type, unallocated row visibility, etc.) using GuestPro backend field names (`calender_label`, `background_color_reservation`, etc.).

## Language Rules

- **All content in this project must be in English** — no exceptions.
- This applies to: source code, comments, variable names, commit messages, UI text (labels, tooltips, placeholders, error messages), documentation, and this file.
- If a user message or requirement is written in another language, interpret it and implement the solution in English.

## Design Engineering

When working on UI/CSS/animations in this project, apply Emil Kowalski's design engineering philosophy:

### Animation decision framework
1. **Should it animate?** Keyboard-triggered actions never animate. High-frequency UI (dozens/day) gets minimal or no animation. Occasional UI (modals, drawers) gets standard animation.
2. **Duration**: buttons 100–160ms, tooltips 125–200ms, dropdowns 150–250ms, modals 200–500ms. Stay under 300ms for UI elements.
3. **Easing**: use `ease-out` for entering elements, `ease-in-out` for on-screen movement. Never `ease-in` for UI. Prefer strong custom curves:
   ```css
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
   ```
4. **Only animate `transform` and `opacity`** — they skip layout/paint and run on the GPU.

### Component rules
- Buttons get `transform: scale(0.97)` on `:active` (100–160ms ease-out).
- Never animate from `scale(0)` — start from `scale(0.95)` + `opacity: 0`.
- Gate hover animations behind `@media (hover: hover) and (pointer: fine)`.
- Popovers use `transform-origin` tied to their trigger; modals stay centered.
- Asymmetric timing: slow deliberate press, fast system response on release.
- Stagger list entries 30–80ms apart.
- Use CSS transitions (not keyframes) for rapidly-triggered or interruptible elements.

### Review checklist
| Issue | Fix |
|---|---|
| `transition: all` | Specify exact properties |
| `scale(0)` entry | Start from `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI | Switch to `ease-out` or custom curve |
| Duration > 300ms | Reduce to 150–250ms |
| Hover without media query | Add `@media (hover: hover) and (pointer: fine)` |
| Keyframes on dynamic element | Use CSS transitions |
| Same enter/exit speed | Exit faster than enter |
