<template>
  <div class="cal-wrap" ref="wrapRef" @scroll="onScroll">
    <table class="cal-table">
      <thead>
        <!-- Week header row -->
        <tr>
          <th class="col-room">ROOM</th>
          <th
            v-for="week in weekHeaders"
            :key="week.label"
            class="week-header"
            :colspan="week.span"
          >{{ week.label }}</th>
        </tr>
        <!-- Day header row -->
        <tr>
          <th class="col-room"></th>
          <th
            v-for="day in visibleDays"
            :key="day.iso"
            class="col-day"
            :class="{ 'today-th': day.isToday }"
          >{{ day.label }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="section in sections" :key="section.id">
          <!-- Section header -->
          <tr>
            <td class="section-first">
              <span class="section-dot" :style="{ background: section.color }"></span>
              {{ section.label }} ({{ section.rooms.length }})
            </td>
            <td v-for="day in visibleDays" :key="day.iso" class="section-rest"></td>
          </tr>
          <!-- Room rows -->
          <tr v-for="room in section.rooms" :key="room.id">
            <td class="room-cell col-room">
              <div class="room-row-info">
                <span class="room-avatar" :class="`av-${room.status.toLowerCase()}`">
                  {{ room.status }}
                </span>
                <div>
                  <div class="room-name">{{ room.name }}</div>
                  <div class="room-type">{{ room.type }}</div>
                </div>
              </div>
            </td>
            <!-- Day cells — first day cell is anchor for booking blocks -->
            <td
              v-for="(day, idx) in visibleDays"
              :key="day.iso"
              :style="idx === 0 ? 'overflow:visible; position:relative; z-index:5;' : ''"
            >
              <!-- Render booking blocks anchored to their start-day cell -->
              <template v-if="idx === 0">
                <div
                  v-for="block in roomBlocks(room.id)"
                  :key="block.id"
                  class="booking-block"
                  :style="{
                    left: block.left + 'px',
                    width: block.width + 'px',
                  }"
                  @click="onBlockClick(block, room)"
                >
                  <div
                    class="booking-inner"
                    :style="{ left: stickyOffset(block) + 'px' }"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      :stroke="block.paidPercent === 100 ? '#fff' : '#fbbf24'"
                      stroke-width="2.5">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    <div class="b-texts">
                      <span class="b-name">{{ block.guestName }}</span>
                      <span class="b-folio">Folio #{{ block.folioNumber }}</span>
                      <span class="b-paid" :class="{ full: block.paidPercent === 100 }">
                        Paid {{ block.paidPercent }}%
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Room, RoomSection, Reservation, CalendarConfig } from '../types'

// ── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  sections: RoomSection[]
  reservations: Reservation[]
  config: CalendarConfig
}>(), {
  sections: () => [],
  reservations: () => [],
  config: () => ({
    startDate: new Date().toISOString().slice(0, 10),
    visibleDays: 14,
  }),
})

// ── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'reservation-clicked': [payload: { reservation: Reservation; room: Room }]
  'date-range-changed': [payload: { startDate: string; endDate: string }]
}>()

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_COL_W = computed(() => props.config.dayColWidth ?? 80)
const ROOM_COL_W = computed(() => props.config.roomColWidth ?? 170)
const MS_PER_DAY = 86_400_000

// ── Date helpers ─────────────────────────────────────────────────────────────

function addDays(iso: string, n: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function isoToLabel(iso: string): string {
  const d = new Date(iso)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]}, ${d.getDate()}`
}

function weekLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()} ${d.toLocaleString('en', { month: 'long' })} ${d.getDate()}`
}

const todayIso = new Date().toISOString().slice(0, 10)

// ── Visible days array ────────────────────────────────────────────────────────

const visibleDays = computed(() => {
  const days = []
  for (let i = 0; i < props.config.visibleDays; i++) {
    const iso = addDays(props.config.startDate, i)
    days.push({ iso, label: isoToLabel(iso), isToday: iso === todayIso })
  }
  return days
})

// ── Week header spans ─────────────────────────────────────────────────────────

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

// ── Booking block layout ──────────────────────────────────────────────────────

const startMs = computed(() => new Date(props.config.startDate).getTime())

interface BlockLayout extends Reservation {
  left: number
  width: number
}

const blocksByRoom = computed(() => {
  const map = new Map<string, BlockLayout[]>()
  for (const r of props.reservations) {
    const ciMs = new Date(r.checkIn).getTime()
    const coMs = new Date(r.checkOut).getTime()
    const offsetDays = (ciMs - startMs.value) / MS_PER_DAY
    const spanDays = (coMs - ciMs) / MS_PER_DAY

    if (offsetDays >= props.config.visibleDays || offsetDays + spanDays <= 0) continue

    const block: BlockLayout = {
      ...r,
      left: offsetDays * DAY_COL_W.value,
      width: spanDays * DAY_COL_W.value - 2,
    }
    const list = map.get(r.roomId) ?? []
    list.push(block)
    map.set(r.roomId, list)
  }
  return map
})

function roomBlocks(roomId: string): BlockLayout[] {
  return blocksByRoom.value.get(roomId) ?? []
}

// ── Sticky inner offset ───────────────────────────────────────────────────────

const scrollLeft = ref(0)
const wrapRef = ref<HTMLElement | null>(null)

function onScroll() {
  scrollLeft.value = wrapRef.value?.scrollLeft ?? 0
}

function stickyOffset(block: BlockLayout): number {
  const stickyEdge = ROOM_COL_W.value + 8
  const blockScreenLeft = block.left - scrollLeft.value + ROOM_COL_W.value
  let offset = 0
  if (blockScreenLeft < stickyEdge) {
    offset = stickyEdge - blockScreenLeft
  }
  const maxOffset = Math.max(0, block.width - 130 - 8)
  return Math.min(offset, maxOffset)
}

// ── Event handlers ────────────────────────────────────────────────────────────

function onBlockClick(block: BlockLayout, room: Room) {
  emit('reservation-clicked', { reservation: block, room })
}

// ── Public API ────────────────────────────────────────────────────────────────

defineExpose({
  goToDate(iso: string) {
    // Caller updates config.startDate — exposed for convenience
    emit('date-range-changed', {
      startDate: iso,
      endDate: addDays(iso, props.config.visibleDays - 1),
    })
  },
  goToToday() {
    emit('date-range-changed', {
      startDate: todayIso,
      endDate: addDays(todayIso, props.config.visibleDays - 1),
    })
  },
})
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

:host {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e0e0e0;
}

.cal-wrap {
  overflow-x: auto;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid #333;
}

.cal-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1100px;
  width: 100%;
}

.col-room { width: 170px; min-width: 170px; }
.col-day  { width: 80px;  min-width: 80px; }

/* Sticky first column */
.cal-table th:first-child,
.cal-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 10;
  box-shadow: 2px 0 6px -1px rgba(0,0,0,0.4);
}
.cal-table thead th      { position: sticky; top: 0; z-index: 11; }
.cal-table thead th:first-child { z-index: 21; }

.cal-table th {
  background: #2a2a2a;
  border-right: 0.5px solid #3a3a3a;
  border-bottom: 0.5px solid #3a3a3a;
  padding: 5px 6px;
  text-align: center;
  font-weight: 500;
  color: #888;
  font-size: 11px;
  white-space: nowrap;
  user-select: none;
}
.cal-table th:first-child {
  text-align: left;
  padding: 6px 12px;
  border-right: 1.5px solid #444;
  color: #aaa;
  font-size: 11px;
}
.week-header { text-align: center !important; color: #777 !important; }
.today-th {
  background: rgba(29,158,117,0.15) !important;
  color: #4ade80 !important;
  font-weight: 600 !important;
}

.cal-table td {
  border-right: 0.5px solid #2e2e2e;
  border-bottom: 0.5px solid #2e2e2e;
  height: 48px;
  position: relative;
  vertical-align: top;
  padding: 0;
  background: #1e1e1e;
  overflow: hidden;
}
.cal-table td:first-child {
  background: #242424;
  border-right: 1.5px solid #444 !important;
  overflow: visible;
}

/* Room cell */
.room-cell {
  padding: 6px 10px;
  vertical-align: middle !important;
  display: table-cell;
}
.room-row-info { display: flex; align-items: center; }
.room-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600; margin-right: 8px; flex-shrink: 0;
  text-transform: uppercase;
}
.av-oc { background: #1D9E75; color: #fff; }
.av-vc { background: #1a8cd8; color: #fff; }
.av-od { background: #d97706; color: #fff; }
.av-ul { background: #555;    color: #ccc; }
.room-name { font-weight: 500; font-size: 12px; color: #ddd; }
.room-type { font-size: 10px; color: #666; margin-top: 1px; }

/* Section header */
.section-first {
  padding: 4px 12px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  color: #777 !important;
  background: #222 !important;
  border-right: 1.5px solid #444 !important;
  overflow: hidden !important;
}
.section-rest { background: #222 !important; }
.section-dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; margin-right: 7px;
  vertical-align: middle;
}

/* Booking block */
.booking-block {
  position: absolute;
  top: 5px; bottom: 5px;
  border-radius: 4px;
  background: #166534;
  border-left: 3px solid #15803d;
  z-index: 4;
  cursor: pointer;
  transition: filter 0.15s;
}
.booking-block:hover { filter: brightness(1.15); }

.booking-inner {
  position: absolute;
  top: 0; bottom: 0;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  white-space: nowrap;
  pointer-events: none;
}
.b-texts { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
.b-name  { font-size: 10px; font-weight: 600; color: #fff; }
.b-folio { font-size: 9px;  color: rgba(255,255,255,0.65); }
.b-paid  { font-size: 9px;  color: #fbbf24; }
.b-paid.full { color: #86efac; }

/* Scrollbar */
.cal-wrap::-webkit-scrollbar { height: 6px; }
.cal-wrap::-webkit-scrollbar-track { background: #1a1a1a; }
.cal-wrap::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
.cal-wrap::-webkit-scrollbar-thumb:hover { background: #555; }
</style>
