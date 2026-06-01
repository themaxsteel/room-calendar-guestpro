<template>
  <div class="cal-wrap" ref="wrapRef" @scroll="onScroll">
    <table class="cal-table" :class="{ 'is-dragging': dragState !== null }">
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
        <template v-for="section in localSections" :key="section.id">
          <!-- Section header -->
          <tr class="section-row" @click="toggleSection(section.id)">
            <td class="section-first" :style="{ boxShadow: 'inset 3px 0 0 ' + section.color }">
              <span class="section-chevron" :class="{ 'is-open': expandedSections[section.id] }">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="section-dot" :style="{ background: section.color }"></span>
              {{ section.label }} ({{ section.rooms.length }})
            </td>
            <td v-for="day in visibleDays" :key="day.iso" class="section-rest"></td>
          </tr>
          <!-- Room rows -->
          <tr
            v-for="room in section.rooms"
            v-show="expandedSections[section.id]"
            :key="room.id"
            :class="{ 'drop-target': dragState !== null && dragState.targetRoomId === room.id && dragState.roomId !== room.id }"
            @mouseenter="onRoomRowMouseenter(room.id)"
          >
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
                  :class="[`status-${block.status.toLowerCase().replace('_', '-')}`, { 'is-dragged': dragState?.blockId === block.id }]"
                  :style="{
                    left: block.left + 'px',
                    width: block.width + 'px',
                  }"
                  @mousedown.left.stop="onBlockMousedown($event, block, room)"
                  @mouseenter="showTooltip($event, block, room)"
                  @mousemove="moveTooltip"
                  @mouseleave="hideTooltip"
                >
                  <div
                    class="booking-inner"
                    :style="{ left: stickyOffset(block) + 'px' }"
                  >
                    <!-- Room Maintenance -->
                    <template v-if="block.status === 'ROOM_MAINTENANCE'">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.5">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">Room Maintenance</span>
                      </div>
                    </template>
                    <!-- Booked -->
                    <template v-else-if="block.status === 'BOOKED'">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">Booked</span>
                      </div>
                    </template>
                    <!-- Regular reservation -->
                    <template v-else>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.7)"
                        stroke-width="2.5">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">{{ block.guestName }}</span>
                        <span class="b-folio">Folio #{{ block.folioNumber }}</span>
                        <span class="b-paid">Paid {{ block.paidPercent }}%</span>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <!-- Tooltip -->
  <div v-if="tooltipTarget && !dragState" class="rc-tooltip" :style="tooltipStyle">
    <div class="tt-guest">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
      {{ tooltipTarget.block.guestName }}
    </div>
    <div class="tt-divider"></div>
    <div class="tt-row">
      <span class="tt-label">Room</span>
      <span class="tt-val">{{ tooltipTarget.room.name }}</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Type</span>
      <span class="tt-val">{{ tooltipTarget.room.type }}</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Folio</span>
      <span class="tt-val">#{{ tooltipTarget.block.folioNumber }}</span>
    </div>
    <div class="tt-divider"></div>
    <div class="tt-dates">
      <span>{{ formatDateLong(tooltipTarget.block.checkIn) }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
      <span>{{ formatDateLong(tooltipTarget.block.checkOut) }}</span>
    </div>
    <div class="tt-nights">{{ nightsBetween(tooltipTarget.block.checkIn, tooltipTarget.block.checkOut) }} nights</div>
    <div class="tt-divider"></div>
    <div class="tt-payment">
      <div class="tt-bar-track">
        <div
          class="tt-bar-fill"
          :class="{ full: tooltipTarget.block.paidPercent === 100 }"
          :style="{ width: tooltipTarget.block.paidPercent + '%' }"
        ></div>
      </div>
      <span class="tt-paid-txt" :class="{ full: tooltipTarget.block.paidPercent === 100 }">
        Paid {{ tooltipTarget.block.paidPercent }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import type { Room, RoomSection, Reservation, CalendarConfig } from '../types'
import { useSections } from '../composables/useSections'
import { useCalendarDays } from '../composables/useCalendarDays'
import { useBlockLayout } from '../composables/useBlockLayout'
import { useDragDrop } from '../composables/useDragDrop'
import { addDays, todayIso, formatDateLong, nightsBetween } from '../composables/useDateHelpers'
import { useTooltip } from '../composables/useTooltip'
import { transformRoomCharting, transformReservations } from '../composables/useGuestProAdapter'
import type { GuestProChartingRoom, GuestProReservationItem, GuestProReservationResponse } from '../composables/useGuestProAdapter'

const props = withDefaults(defineProps<{
  sections?: RoomSection[]
  reservations?: Reservation[]
  config: CalendarConfig
}>(), {
  sections: () => [],
  reservations: () => [],
  config: () => ({
    startDate: new Date().toISOString().slice(0, 10),
    visibleDays: 14,
  }),
})

const emit = defineEmits<{
  'reservation-clicked': [payload: { reservation: Reservation; room: Room }]
  'reservation-moved':  [payload: { reservationId: string; fromRoomId: string; newRoomId: string; newCheckIn: string; newCheckOut: string }]
  'date-range-changed': [payload: { startDate: string; endDate: string }]
}>()

const DAY_COL_W = computed(() => props.config.dayColWidth ?? 80)
const ROOM_COL_W = computed(() => props.config.roomColWidth ?? 170)

const localSections = ref<RoomSection[]>([...props.sections])
watch(() => props.sections, (val) => { localSections.value = [...val] }, { deep: true })

const localReservations = ref<Reservation[]>([...props.reservations])
watch(() => props.reservations, (val) => { localReservations.value = [...val] }, { deep: true })

const { expandedSections, toggleSection } = useSections(localSections)
const { visibleDays, weekHeaders }         = useCalendarDays(toRef(props, 'config'))
const { dragState, onRoomRowMouseenter, onBlockMousedown } = useDragDrop(localReservations, DAY_COL_W, emit)
const { roomBlocks, wrapRef, onScroll, stickyOffset }     = useBlockLayout(
  localReservations, dragState, toRef(props, 'config'), DAY_COL_W, ROOM_COL_W,
)
const { tooltipTarget, tooltipStyle, showTooltip, moveTooltip, hideTooltip } = useTooltip()

defineExpose({
  goToDate(iso: string) {
    emit('date-range-changed', { startDate: iso, endDate: addDays(iso, props.config.visibleDays - 1) })
  },
  goToToday() {
    emit('date-range-changed', { startDate: todayIso, endDate: addDays(todayIso, props.config.visibleDays - 1) })
  },
  setData(chartingRooms: GuestProChartingRoom[]) {
    localSections.value = transformRoomCharting(chartingRooms)
  },
  loadReservation(data: GuestProReservationItem[] | GuestProReservationResponse) {
    localReservations.value = transformReservations(data)
  },
})
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

:host {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1a1a;
  background: #ffffff;
}

.cal-wrap {
  overflow: auto;
  height: 90vh;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
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
  box-shadow: 1px 0 0 #e5e7eb, 4px 0 8px -2px rgba(0,0,0,0.06);
}
.cal-table thead th      { position: sticky; top: 0; z-index: 11; }
.cal-table thead th:first-child { z-index: 21; }

.cal-table th {
  background: #f9fafb;
  border-right: 0.5px solid #e5e7eb;
  border-bottom: 0.5px solid #e5e7eb;
  padding: 5px 6px;
  text-align: center;
  font-weight: 500;
  color: #6b7280;
  font-size: 11px;
  white-space: nowrap;
  user-select: none;
}
.cal-table th:first-child {
  text-align: left;
  padding: 6px 12px;
  border-right: 1.5px solid #e5e7eb;
  color: #374151;
  font-size: 11px;
  letter-spacing: 0.04em;
}
.week-header { text-align: center !important; color: #9ca3af !important; font-weight: 400 !important; }
.today-th {
  background: #f0fdf4 !important;
  color: #16a34a !important;
  font-weight: 600 !important;
}

.cal-table td {
  border-right: 2px solid #f3f4f6;
  border-bottom: 2px solid #f3f4f6;
  height: 48px;
  position: relative;
  vertical-align: top;
  padding: 0;
  background: #ffffff;
  overflow: hidden;
}
.cal-table td:first-child {
  background: #ffffff;
  border-right: 1px solid #e5e7eb !important;
  overflow: visible;
}

/* Room cell */
.room-cell {
  padding: 16px 10px!important;
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
.av-oc  { background: #1D9E75; color: #fff; }
.av-vc  { background: #1a8cd8; color: #fff; }
.av-od  { background: #d97706; color: #fff; }
.av-ul  { background: #e5e7eb; color: #6b7280; }
.av-vci { background: #2a5a9e; color: #fff; }
.av-vd  { background: #dc2626; color: #fff; }
.room-name { font-weight: 500; font-size: 12px; color: #222; }
.room-type { font-size: 10px; color: #999; margin-top: 1px; }

/* Section header */
.section-row { cursor: pointer; user-select: none; }
.section-row td { height: 34px !important; }
.section-row:hover .section-first { color: #374151 !important; }
.section-row:hover .section-rest  { background: rgba(0,0,0,0.06) !important; }
.section-first {
  padding: 0 12px 0 14px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
  color: #6b7280 !important;
  background: rgba(0,0,0,0.04) !important;
  border-right: 1px solid #e5e7eb !important;
  vertical-align: middle !important;
  overflow: hidden !important;
}
.section-rest {
  background: rgba(0,0,0,0.04) !important;
  border-right: none !important;
}
.section-dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; margin-right: 7px;
  vertical-align: middle; flex-shrink: 0;
}
.section-chevron {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; margin-right: 5px;
  color: #d1d5db; vertical-align: middle;
  transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
  transform: rotate(-90deg);
}
.section-chevron.is-open { transform: rotate(0deg); }

/* Booking block */
.booking-block {
  position: absolute;
  top: 5px; bottom: 5px;
  border-radius: 4px;
  background: #16a34a;
  border-left: 3px solid #15803d;
  z-index: 4;
  cursor: grab;
  transition: filter 0.15s, box-shadow 0.15s, opacity 0.15s;
  user-select: none;
}
/* Status colors */
.booking-block.status-definite      { background: #d97706; border-left-color: #b45309; }
.booking-block.status-check-in      { background: #16a34a; border-left-color: #15803d; }
.booking-block.status-check-out     { background: #dc2626; border-left-color: #b91c1c; }
.booking-block.status-booked        { background: #475569; border-left-color: #334155; }
.booking-block.status-room-maintenance { background: #475569; border-left-color: #334155; }
@media (hover: hover) and (pointer: fine) {
  .booking-block:hover { filter: brightness(1.08); }
}
.booking-block.is-dragged {
  cursor: grabbing;
  opacity: 0.88;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.08);
  z-index: 20;
}

/* Suppress hover on non-dragged blocks while a drag is active */
.cal-table.is-dragging .booking-block:not(.is-dragged) {
  pointer-events: none;
}
.cal-table.is-dragging { cursor: grabbing; }

/* Drop target row highlight */
.drop-target td {
  background: #f0fdf4 !important;
}
.drop-target td:first-child {
  background: #dcfce7 !important;
  box-shadow: inset 3px 0 0 #16a34a;
}

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
.b-folio { font-size: 9px;  color: rgba(255,255,255,0.7); }
.b-paid  { font-size: 9px;  color: rgba(255,255,255,0.65); }

/* Tooltip */
.rc-tooltip {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  max-width: 224px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  padding: 11px 13px;
  pointer-events: none;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
  font-size: 11px;
  color: #555;
  line-height: 1.45;
}
.tt-guest {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700; color: #1a1a1a;
  letter-spacing: 0.01em;
}
.tt-divider { height: 1px; background: #ebebeb; margin: 8px 0; }
.tt-row { display: flex; justify-content: space-between; align-items: center; margin: 3px 0; }
.tt-label {
  font-size: 9px; font-weight: 600; color: #bbb;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.tt-val { color: #333; font-size: 11px; }
.tt-dates {
  display: flex; align-items: center; gap: 5px;
  color: #333; font-size: 11px; margin: 3px 0 1px;
}
.tt-nights { color: #bbb; font-size: 10px; margin-bottom: 1px; }
.tt-payment { display: flex; align-items: center; gap: 8px; }
.tt-bar-track {
  flex: 1; height: 4px; background: #e5e7eb;
  border-radius: 2px; overflow: hidden;
}
.tt-bar-fill { height: 100%; background: #f59e0b; border-radius: 2px; }
.tt-bar-fill.full { background: #16a34a; }
.tt-paid-txt { font-size: 10px; color: #f59e0b; white-space: nowrap; }
.tt-paid-txt.full { color: #16a34a; }

/* Scrollbar */
.cal-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
.cal-wrap::-webkit-scrollbar-track { background: #f9fafb; }
.cal-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
.cal-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
