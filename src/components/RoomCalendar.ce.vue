<template>
  <div class="rc-root" :style="calConfigStyle">
  <!-- Search toolbar -->
  <div class="rc-search-bar">
    <div class="rc-search-field" :class="{ 'is-active': searchActive }">
      <svg class="rc-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
      </svg>
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        class="rc-search-input"
        placeholder="Search guest name or folio..."
        @focus="searchActive = true"
        @blur="searchActive = searchQuery.length > 0"
        @keydown.esc="clearSearch"
      >
      <Transition name="search-clear-fade">
        <button v-if="searchQuery" class="rc-search-clear" @mousedown.prevent="clearSearch" title="Clear">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </Transition>
    </div>
    <Transition name="search-badge-fade">
      <span v-if="searchQuery" class="rc-search-badge">
        {{ matchingRoomIds.size }} room{{ matchingRoomIds.size !== 1 ? 's' : '' }} found
      </span>
    </Transition>
    <button class="rc-config-btn" @click="openCalConfig" title="Calendar Configuration">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      Calendar Configuration
    </button>
  </div>

  <div class="cal-wrap" ref="wrapRef" @scroll="onScroll">
    <div class="cal-table-positioner">
      <div
        class="room-col-resize-bar"
        :class="{ 'is-resizing': isResizingRoomCol }"
        :style="{ left: (ROOM_COL_W - 3 + scrollLeft) + 'px' }"
        @mousedown.stop.prevent="onRoomColResizeStart"
      ></div>
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
        <template v-for="section in displaySections" :key="section.id">
          <!-- Section header -->
          <tr v-if="filterCalendarType === 'by-room-type'" class="section-row" @click="toggleSection(section.id)">
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
            v-for="(room, roomIdx) in section.rooms"
            v-show="filterCalendarType === 'normal' || expandedSections[section.id]"
            :key="room.id"
            :class="{
              'drop-target':     dragState !== null && dragState.targetRoomId === room.id && dragState.roomId !== room.id,
              'row-is-dragged':  rowDragState?.roomId === room.id,
              'row-drop-above':  rowDragState !== null && rowDragState.toIdx === roomIdx && rowDragState.fromIdx !== roomIdx,
              'row-search-dim':  searchQuery && !matchingRoomIds.has(room.id),
              'row-search-match': searchQuery && matchingRoomIds.has(room.id),
              'row--with-balance': filterShowTotalBalance,
            }"
            @mouseenter="onRoomRowMouseenter(room.id)"
          >
            <td
              class="room-cell col-room"
              :class="{ 'room-cell--draggable': filterCalendarType === 'normal' && filterAllowVerticalDrag }"
              @mousedown.left.stop="onRoomCellMousedown($event, room.id, roomIdx)"
            >
              <div class="room-row-info">
                <span v-if="filterCalendarType === 'normal' && filterAllowVerticalDrag" class="room-drag-handle" aria-hidden="true">
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                    <circle cx="3" cy="3" r="1.2" fill="currentColor"/><circle cx="7" cy="3" r="1.2" fill="currentColor"/>
                    <circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                    <circle cx="3" cy="11" r="1.2" fill="currentColor"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/>
                  </svg>
                </span>
                <span v-if="filterShowRoomStatus" class="room-avatar" :class="`av-${room.status.toLowerCase()}`">
                  {{ room.status }}
                </span>
                <div>
                  <div class="room-name">
                    {{ room.name }}<span v-if="filterShowBedName && room.bedName" class="room-bed-name"> · {{ room.bedName }}</span>
                  </div>
                  <div class="room-type">{{ room.type }}</div>
                </div>
              </div>
            </td>
            <!-- Day cells — first day cell is anchor for booking blocks -->
            <td
              v-for="(day, idx) in visibleDays"
              :key="day.iso"
              :class="{ 'cell-droppable': !dragState }"
              :style="idx === 0 ? 'overflow:visible; position:relative; z-index:5;' : ''"
              @mousedown.left="onCellMousedown($event, room, idx)"
            >
              <!-- Render booking blocks anchored to their start-day cell -->
              <template v-if="idx === 0">
                <div
                  v-for="block in roomBlocks(room.id)"
                  :key="block.id"
                  class="booking-block"
                  :class="[`status-${block.status.toLowerCase().replace('_', '-')}`, { 'is-dragged': dragState?.blockId === block.id, 'is-reverting': isReverting && dragState?.blockId === block.id, 'is-search-match': searchQuery && isSearchMatch(block), 'is-search-dim': searchQuery && !isSearchMatch(block) }]"
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
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">Room Maintenance</span>
                      </div>
                    </template>
                    <!-- Booked -->
                    <template v-else-if="block.status === 'BOOKED'">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">Booked</span>
                      </div>
                    </template>
                    <!-- Regular reservation -->
                    <template v-else>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      <div class="b-texts">
                        <span class="b-name">{{ filterCalendarLabel === 'folio' ? 'Folio #' + block.folioNumber : block.guestName }}</span>
                        <span v-if="filterCalendarLabel === 'guest-name'" class="b-folio">Folio #{{ block.folioNumber }}</span>
                        <span v-if="filterShowTotalBalance && block.totalBalance != null" class="b-balance">{{ formatBalance(block.totalBalance) }}</span>
                        <span v-else-if="filterShowTotalBalance" class="b-paid">Paid {{ block.paidPercent }}%</span>
                      </div>
                    </template>
                  </div>
                </div>
                <!-- New reservation preview block (active drag OR popover open) -->
                <div
                  v-if="((newResPreview && newResDrag?.isActive) || frozenPreview) && (newResPreview?.roomId === room.id || frozenPreview?.roomId === room.id)"
                  class="new-res-preview"
                  :class="{ 'is-frozen': frozenPreview && !newResPreview }"
                  :style="{
                    left:  ((newResPreview?.roomId === room.id ? newResPreview : frozenPreview)!.left) + 'px',
                    width: ((newResPreview?.roomId === room.id ? newResPreview : frozenPreview)!.width) + 'px',
                  }"
                >
                  <div class="new-res-inner">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>New</span>
                  </div>
                </div>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    </div><!-- /.cal-table-positioner -->
  </div>

  <!-- New reservation drag tooltip (white) -->
  <div v-if="newResPreview && newResDrag?.isActive" class="rc-newres-tooltip" :style="newResTooltipStyle">
    <div class="nrt-room">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#76b51b" stroke-width="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {{ newResPreview.roomName }}
    </div>
    <div class="nrt-divider"></div>
    <div class="nrt-dates">
      <span>{{ formatDateLong(newResPreview.checkIn) }}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
      <span>{{ formatDateLong(newResPreview.checkOut) }}</span>
    </div>
    <div class="nrt-nights">{{ nightsBetween(newResPreview.checkIn, newResPreview.checkOut) }} nights</div>
  </div>

  <!-- Create reservation popover -->
  <div v-if="newResPopover" class="rc-create-popover" :style="popoverStyle">
    <div class="crp-header">
      <div class="crp-title">Buat Reservasi Baru</div>
      <div class="crp-dates">
        {{ formatDateLong(newResPopover.checkIn) }}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        {{ formatDateLong(newResPopover.checkOut) }}
        &nbsp;·&nbsp;{{ nightsBetween(newResPopover.checkIn, newResPopover.checkOut) }} nights
      </div>
    </div>
    <div class="crp-divider"></div>

    <!-- Create Room Plan -->
    <button class="crp-item" @click="selectType('room-plan')">
      <span class="crp-icon crp-icon--plan">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </span>
      <div class="crp-item-text">
        <span class="crp-item-label">Create Room Plan</span>
      </div>
      <svg class="crp-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>

    <!-- Create Reservation (expandable) -->
    <button class="crp-item" :class="{ 'is-expanded': newResPopover.showResSub }" @click="newResPopover.showResSub = !newResPopover.showResSub">
      <span class="crp-icon crp-icon--res">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </span>
      <div class="crp-item-text">
        <span class="crp-item-label">Create Reservation</span>
      </div>
      <svg class="crp-chevron" width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" :class="{ open: newResPopover.showResSub }">
        <path d="M2 3.5 L5 6.5 L8 3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Sub-options -->
    <div class="crp-sub" :class="{ 'is-visible': newResPopover.showResSub }">
      <button class="crp-sub-item" @click="selectType('single')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        Single Reservation
      </button>
      <button class="crp-sub-item" @click="selectType('group')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3" opacity="0.6"/>
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
          <path d="M17 14c2.5.4 5 2.4 5 6" opacity="0.6"/>
        </svg>
        Group Reservation
      </button>
    </div>
  </div>

  <!-- Move confirmation dialog -->
  <Transition name="confirm-dialog">
    <div v-if="pendingMove" class="rc-confirm-overlay" @mousedown.self="cancelMove">
      <div class="rc-confirm-dialog">
        <!-- Header -->
        <button class="rcd-close" @click="cancelMove" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="rcd-header">
          <div class="rcd-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </div>
          <div>
            <p class="rcd-title">Move Reservation?</p>
            <p class="rcd-subtitle">Are you sure you want to move this reservation?</p>
          </div>
        </div>

        <!-- Guest row -->
        <div v-if="pendingMove" class="rcd-guest-card">
          <div class="rcd-guest-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <span class="rcd-guest-name">{{ pendingMove.snapshot.guestName }}</span>
          <span class="rcd-folio">Folio #{{ pendingMove.snapshot.folioNumber }}</span>
        </div>

        <!-- From / To card -->
        <div v-if="pendingMove" class="rcd-move-card">
          <div class="rcd-move-col">
            <span class="rcd-move-label">FROM</span>
            <div class="rcd-move-room-row">
              <span class="rcd-move-room">{{ roomById.get(pendingMove.from_room_id)?.name ?? pendingMove.from_room_id }}</span>
            </div>
            <div class="rcd-move-date-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span class="rcd-move-dates">{{ formatDateRange(pendingMove.snapshot.checkIn, pendingMove.snapshot.checkOut) }}</span>
            </div>
          </div>

          <div class="rcd-arrow-circle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>

          <div class="rcd-move-col">
            <span class="rcd-move-label">TO</span>
            <div class="rcd-move-room-row">
              <span class="rcd-move-room rcd-move-room--new">{{ roomById.get(pendingMove.room_id)?.name ?? pendingMove.room_id }}</span>
            </div>
            <div class="rcd-move-date-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span class="rcd-move-dates">{{ formatDateRange(pendingMove.arrival_date, pendingMove.departure_date) }}</span>
            </div>
          </div>
        </div>

        <!-- Nights + paid -->
        <div v-if="pendingMove" class="rcd-meta-card">
          <div class="rcd-meta-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <span class="rcd-nights">{{ nightsBetween(pendingMove.arrival_date, pendingMove.departure_date) }} nights</span>
          </div>
          <div class="rcd-paid" :class="{ 'rcd-paid--full': pendingMove.snapshot.paidPercent === 100 }">
            <svg v-if="pendingMove.snapshot.paidPercent === 100" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
            </svg>
            Paid {{ pendingMove.snapshot.paidPercent }}%
          </div>
        </div>

        <div class="rcd-actions">
          <button class="rcd-btn rcd-btn--cancel" @click="cancelMove">Cancel</button>
          <button class="rcd-btn rcd-btn--confirm" @click="confirmMove">Move</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Tooltip -->
  <div v-if="tooltipTarget && !dragState && filterShowReservationDetail" class="rc-tooltip" :style="tooltipStyle">
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
  <!-- Calendar Configuration Modal -->
  <Transition name="cfg-modal">
    <div v-if="calConfigOpen" class="rc-cfg-overlay" @mousedown.self="calConfigOpen = false">
      <div class="rc-cfg-dialog">
        <!-- Header -->
        <div class="rc-cfg-header">
          <div class="rc-cfg-header-left">
            <div class="rc-cfg-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.13-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
            </div>
            <div>
              <div class="rc-cfg-title">Calendar Configuration</div>
              <div class="rc-cfg-subtitle">Customize calendar display and color settings</div>
            </div>
          </div>
          <button class="rc-cfg-close" @click="calConfigOpen = false" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="rc-cfg-body">

          <!-- Display Settings -->
          <div class="rc-cfg-section">
            <div class="rc-cfg-section-title">
              <span class="rc-cfg-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </span>
              Display Settings
            </div>

            <div class="rc-cfg-row">
              <label class="rc-cfg-label">Block Label</label>
              <div class="rc-cfg-radio-group">
                <label class="rc-cfg-radio">
                  <input type="checkbox"
                    :checked="calConfig.calender_label !== 'folio'"
                    @change="toggleLabel('guest_name', $event)">
                  <span>Guest Name</span>
                </label>
                <label class="rc-cfg-radio">
                  <input type="checkbox"
                    :checked="calConfig.calender_label !== 'guest_name'"
                    @change="toggleLabel('folio', $event)">
                  <span>Folio</span>
                </label>
              </div>
            </div>

            <div class="rc-cfg-row">
              <label class="rc-cfg-label">Calendar Type</label>
              <div class="rc-cfg-radio-group">
                <label class="rc-cfg-radio">
                  <input type="radio" v-model="calConfig.calender_type" value="GROUP">
                  <span>By Room Type</span>
                </label>
                <label class="rc-cfg-radio">
                  <input type="radio" v-model="calConfig.calender_type" value="NORMAL">
                  <span>Flat List</span>
                </label>
              </div>
            </div>

            <div class="rc-cfg-row">
              <label class="rc-cfg-label">Calendar Height (px)</label>
              <input type="number" class="rc-cfg-number" v-model.number="calConfig.calender_hight" min="300" max="2000" step="50">
            </div>

            <div class="rc-cfg-inner-divider"></div>

            <div class="rc-cfg-row rc-cfg-row--toggle">
              <label class="rc-cfg-label">Show Unallocated Rooms</label>
              <button class="rc-cfg-toggle" :class="{ 'is-on': calConfig.calender_use_unallocated === 1 }" @click="calConfig.calender_use_unallocated = calConfig.calender_use_unallocated === 1 ? 0 : 1">
                <span class="rc-cfg-toggle-thumb"></span>
              </button>
            </div>

            <div class="rc-cfg-row rc-cfg-row--toggle">
              <label class="rc-cfg-label">Show Total Balance</label>
              <button class="rc-cfg-toggle" :class="{ 'is-on': calConfig.calender_total_balance === 1 }" @click="calConfig.calender_total_balance = calConfig.calender_total_balance === 1 ? 0 : 1">
                <span class="rc-cfg-toggle-thumb"></span>
              </button>
            </div>

            <div class="rc-cfg-row rc-cfg-row--toggle">
              <label class="rc-cfg-label">Show Bed Type After Room Name</label>
              <button class="rc-cfg-toggle" :class="{ 'is-on': calConfig.show_bed_type_after_room_name === 1 }" @click="calConfig.show_bed_type_after_room_name = calConfig.show_bed_type_after_room_name === 1 ? 0 : 1">
                <span class="rc-cfg-toggle-thumb"></span>
              </button>
            </div>

            <div class="rc-cfg-row rc-cfg-row--toggle">
              <label class="rc-cfg-label">Show Hover Tooltips</label>
              <button class="rc-cfg-toggle" :class="{ 'is-on': calConfig.calender_show_hover_tooltips === 1 }" @click="calConfig.calender_show_hover_tooltips = calConfig.calender_show_hover_tooltips === 1 ? 0 : 1">
                <span class="rc-cfg-toggle-thumb"></span>
              </button>
            </div>
          </div>

          <!-- Dimensions -->
          <div class="rc-cfg-section">
            <div class="rc-cfg-section-title">
              <span class="rc-cfg-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z"/>
                </svg>
              </span>
              Dimensions
            </div>

            <div class="rc-cfg-row">
              <label class="rc-cfg-label">Room Column Width (px)</label>
              <input type="number" class="rc-cfg-number" v-model.number="calConfig.calender_room_column" min="100" max="400" step="10">
            </div>

            <div class="rc-cfg-row">
              <label class="rc-cfg-label">Room Type Column Width (px)</label>
              <input type="number" class="rc-cfg-number" v-model.number="calConfig.calender_room_type_column" min="40" max="200" step="10">
            </div>
          </div>

          <!-- Status Colors -->
          <div class="rc-cfg-section">
            <div class="rc-cfg-section-title">
              <span class="rc-cfg-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </span>
              Status Colors
            </div>

            <div class="rc-cfg-colors-header">
              <span></span>
              <span class="rc-cfg-color-col-label">Background</span>
              <span class="rc-cfg-color-col-label">Text</span>
            </div>

            <div class="rc-cfg-color-row">
              <span class="rc-cfg-status-label">
                <span class="rc-cfg-status-dot" :style="{ background: calConfig.background_color_reservation }"></span>
                Reservation
              </span>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.background_color_reservation">
                <span :style="{ background: calConfig.background_color_reservation }"></span>
              </label>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.foreground_color_reservation">
                <span class="rc-cfg-color-swatch-fg" :style="{ background: calConfig.foreground_color_reservation }"></span>
              </label>
            </div>

            <div class="rc-cfg-color-row">
              <span class="rc-cfg-status-label">
                <span class="rc-cfg-status-dot" :style="{ background: calConfig.background_color_tentative }"></span>
                Tentative
              </span>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.background_color_tentative">
                <span :style="{ background: calConfig.background_color_tentative }"></span>
              </label>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.foreground_color_tentative">
                <span class="rc-cfg-color-swatch-fg" :style="{ background: calConfig.foreground_color_tentative }"></span>
              </label>
            </div>

            <div class="rc-cfg-color-row">
              <span class="rc-cfg-status-label">
                <span class="rc-cfg-status-dot" :style="{ background: calConfig.background_color_inhouse }"></span>
                In-House
              </span>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.background_color_inhouse">
                <span :style="{ background: calConfig.background_color_inhouse }"></span>
              </label>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.foreground_color_inhouse">
                <span class="rc-cfg-color-swatch-fg" :style="{ background: calConfig.foreground_color_inhouse }"></span>
              </label>
            </div>

            <div class="rc-cfg-color-row">
              <span class="rc-cfg-status-label">
                <span class="rc-cfg-status-dot" :style="{ background: calConfig.background_color_checkout }"></span>
                Check-Out
              </span>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.background_color_checkout">
                <span :style="{ background: calConfig.background_color_checkout }"></span>
              </label>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.foreground_color_checkout">
                <span class="rc-cfg-color-swatch-fg" :style="{ background: calConfig.foreground_color_checkout }"></span>
              </label>
            </div>

            <div class="rc-cfg-color-row">
              <span class="rc-cfg-status-label">
                <span class="rc-cfg-status-dot" :style="{ background: calConfig.background_color_room_maintenance }"></span>
                Maintenance
              </span>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.background_color_room_maintenance">
                <span :style="{ background: calConfig.background_color_room_maintenance }"></span>
              </label>
              <label class="rc-cfg-color-swatch">
                <input type="color" v-model="calConfig.foreground_color_room_maintenance">
                <span class="rc-cfg-color-swatch-fg" :style="{ background: calConfig.foreground_color_room_maintenance }"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="rc-cfg-footer">
          <button class="rc-cfg-btn rc-cfg-btn--cancel" @click="calConfigOpen = false">Cancel</button>
          <button class="rc-cfg-btn rc-cfg-btn--save" @click="saveCalConfig">Save Configuration</button>
        </div>
      </div>
    </div>
  </Transition>

  </div><!-- /rc-root -->
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef, reactive } from 'vue'
import type { Room, RoomSection, Reservation, CalendarConfig, CalendarFilter, NewResDragState, NewResPopover } from '../types'
import { useSections } from '../composables/useSections'
import { useCalendarDays } from '../composables/useCalendarDays'
import { useBlockLayout } from '../composables/useBlockLayout'
import { useDragDrop } from '../composables/useDragDrop'
import { addDays, todayIso, formatDateLong, formatDateRange, nightsBetween } from '../composables/useDateHelpers'
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
  'reservation-moved':  [payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string }]
  'date-range-changed': [payload: { startDate: string; endDate: string }]
  'new-reservation':    [payload: { roomId: string; checkIn: string; checkOut: string; type: 'room-plan' | 'single' | 'group' }]
  'calendar-config-saved': [payload: Record<string, unknown>]
}>()

const DAY_COL_W = computed(() => props.config.dayColWidth ?? 80)

// Filter overrides (set via setFilter())
const filterRoomColW            = ref<number | null>(null)
const filterShowRoomStatus      = ref(true)
const filterCalendarType        = ref<'by-room-type' | 'normal'>('by-room-type')
const filterRoomOrder           = ref<string[] | null>(null)
const filterShowUnallocated     = ref(true)
const filterShowTotalBalance    = ref(false)
const filterShowBedName         = ref(false)
const filterShowReservationDetail = ref(true)
const filterCalendarLabel       = ref<'guest-name' | 'folio'>('guest-name')
const filterAllowHorizontalDrag = ref(true)
const filterAllowVerticalDrag   = ref(true)

// ── Calendar Configuration ───────────────────────────────────────────────────
const calConfigOpen = ref(false)
const calConfig = reactive({
  calender_label:                  'guest_name' as 'guest_name' | 'folio' | 'guest_name,folio',
  calender_hight:                  700,
  calender_type:                   'GROUP' as 'GROUP' | 'NORMAL',
  calender_use_unallocated:        1 as 0 | 1,
  background_color_reservation:    '#d97706',
  background_color_tentative:      '#475569',
  background_color_inhouse:        '#16a34a',
  background_color_checkout:       '#dc2626',
  background_color_room_maintenance: '#475569',
  foreground_color_inhouse:        '#ffffff',
  foreground_color_checkout:       '#ffffff',
  foreground_color_room_maintenance: '#ffffff',
  foreground_color_reservation:    '#ffffff',
  foreground_color_tentative:      '#ffffff',
  calender_room_column:            170,
  calender_room_type_column:       80,
  calender_total_balance:          0 as 0 | 1,
  show_bed_type_after_room_name:   0 as 0 | 1,
  calender_show_hover_tooltips:    1 as 0 | 1,
})

const calConfigStyle = computed(() => ({
  '--rc-room-col-w': ROOM_COL_W.value + 'px',
  '--rc-bg-reservation': calConfig.background_color_reservation,
  '--rc-bg-tentative':   calConfig.background_color_tentative,
  '--rc-bg-inhouse':     calConfig.background_color_inhouse,
  '--rc-bg-checkout':    calConfig.background_color_checkout,
  '--rc-bg-maintenance': calConfig.background_color_room_maintenance,
  '--rc-fg-reservation': calConfig.foreground_color_reservation,
  '--rc-fg-tentative':   calConfig.foreground_color_tentative,
  '--rc-fg-inhouse':     calConfig.foreground_color_inhouse,
  '--rc-fg-checkout':    calConfig.foreground_color_checkout,
  '--rc-fg-maintenance': calConfig.foreground_color_room_maintenance,
}))

function toggleLabel(part: 'guest_name' | 'folio', event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  const hasGuest = calConfig.calender_label !== 'folio'
  const hasFolio = calConfig.calender_label !== 'guest_name'
  if (part === 'guest_name') {
    if (!checked && !hasFolio) { (event.target as HTMLInputElement).checked = true; return }
    calConfig.calender_label = checked ? (hasFolio ? 'guest_name,folio' : 'guest_name') : 'folio'
  } else {
    if (!checked && !hasGuest) { (event.target as HTMLInputElement).checked = true; return }
    calConfig.calender_label = checked ? (hasGuest ? 'guest_name,folio' : 'folio') : 'guest_name'
  }
}

function openCalConfig() {
  calConfig.calender_label               = filterCalendarLabel.value === 'folio' ? 'folio' : 'guest_name'
  calConfig.calender_type                = filterCalendarType.value === 'normal' ? 'NORMAL' : 'GROUP'
  calConfig.calender_use_unallocated     = filterShowUnallocated.value ? 1 : 0
  calConfig.calender_total_balance       = filterShowTotalBalance.value ? 1 : 0
  calConfig.show_bed_type_after_room_name = filterShowBedName.value ? 1 : 0
  calConfig.calender_show_hover_tooltips = filterShowReservationDetail.value ? 1 : 0
  calConfig.calender_room_column         = ROOM_COL_W.value
  calConfigOpen.value = true
}

function saveCalConfig() {
  filterCalendarLabel.value        = calConfig.calender_label === 'folio' ? 'folio' : 'guest-name'
  filterCalendarType.value         = calConfig.calender_type === 'NORMAL' ? 'normal' : 'by-room-type'
  filterShowUnallocated.value      = calConfig.calender_use_unallocated === 1
  filterShowTotalBalance.value     = calConfig.calender_total_balance === 1
  filterShowBedName.value          = calConfig.show_bed_type_after_room_name === 1
  filterShowReservationDetail.value = calConfig.calender_show_hover_tooltips === 1
  filterRoomColW.value             = calConfig.calender_room_column
  emit('calendar-config-saved', { ...calConfig })
  calConfigOpen.value = false
}

const resizedRoomColW   = ref<number | null>(null)
const isResizingRoomCol = ref(false)
const ROOM_COL_W = computed(() => resizedRoomColW.value ?? filterRoomColW.value ?? props.config.roomColWidth ?? 170)

function onRoomColResizeStart(e: MouseEvent) {
  const startX = e.clientX
  const startW = ROOM_COL_W.value
  const MIN_W  = 100
  const MAX_W  = 400
  isResizingRoomCol.value = true

  function onMove(ev: MouseEvent) {
    resizedRoomColW.value = Math.min(MAX_W, Math.max(MIN_W, startW + ev.clientX - startX))
  }
  function onUp() {
    isResizingRoomCol.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── Search ────────────────────────────────────────────────────────────────────
const searchQuery    = ref('')
const searchActive   = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

function isSearchMatch(block: { guestName: string; folioNumber: string }): boolean {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return true
  return block.guestName.toLowerCase().includes(q) || block.folioNumber.toLowerCase().includes(q)
}

function clearSearch() {
  searchQuery.value  = ''
  searchActive.value = false
}

const localSections = ref<RoomSection[]>([...props.sections])

watch(() => props.sections, (val) => { localSections.value = [...val] }, { deep: true })

// ── Display sections (respects calendarType, roomOrder, showUnallocated) ──────
const allRoomsFlat = computed(() => {
  const rooms: Room[] = []
  for (const s of localSections.value) rooms.push(...s.rooms)
  return rooms
})

const orderedRooms = computed(() => {
  const order = filterRoomOrder.value
  const all = allRoomsFlat.value
  if (!order) return all
  const map = new Map(all.map(r => [r.id, r]))
  const result: Room[] = []
  for (const id of order) { const r = map.get(id); if (r) result.push(r) }
  const inOrder = new Set(order)
  for (const r of all) if (!inOrder.has(r.id)) result.push(r)
  return result
})

const matchingRoomIds = computed((): Set<string> => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return new Set()
  const ids = new Set<string>()
  for (const r of localReservations.value) {
    if (r.guestName.toLowerCase().includes(q) || r.folioNumber.toLowerCase().includes(q))
      ids.add(r.roomId)
  }
  return ids
})

function sortBySearch(rooms: Room[]): Room[] {
  if (!searchQuery.value.trim()) return rooms
  const matched = rooms.filter(r => matchingRoomIds.value.has(r.id))
  const rest    = rooms.filter(r => !matchingRoomIds.value.has(r.id))
  return [...matched, ...rest]
}

const displaySections = computed((): RoomSection[] => {
  const reservedRooms = filterShowUnallocated.value
    ? null
    : new Set(localReservations.value.map(r => r.roomId))

  if (filterCalendarType.value === 'normal') {
    const rooms = reservedRooms
      ? orderedRooms.value.filter(r => reservedRooms.has(r.id))
      : orderedRooms.value
    return [{ id: '__all__', label: 'All Rooms', color: '#76b51b', rooms: sortBySearch(rooms) }]
  }

  const sections = localSections.value.map(s => ({
    ...s,
    rooms: sortBySearch(reservedRooms ? s.rooms.filter(r => reservedRooms.has(r.id)) : s.rooms),
  })).filter(s => s.rooms.length > 0)

  if (searchQuery.value.trim()) {
    const hasMatch = (s: RoomSection) => s.rooms.some(r => matchingRoomIds.value.has(r.id))
    sections.sort((a, b) => (hasMatch(a) ? 0 : 1) - (hasMatch(b) ? 0 : 1))
  }

  return sections
})

// ── Row drag-to-reorder (normal mode only) ────────────────────────────────────
const rowDragState = ref<{ roomId: string; fromIdx: number; toIdx: number } | null>(null)

function onRoomCellMousedown(event: MouseEvent, roomId: string, roomIdx: number) {
  if (filterCalendarType.value !== 'normal') return
  if (!filterAllowVerticalDrag.value) return
  if (dragState.value) return
  event.stopPropagation()
  event.preventDefault()

  const startY = event.clientY
  const snapshotIds = displaySections.value[0]?.rooms.map(r => r.id) ?? []
  const totalRooms = snapshotIds.length
  rowDragState.value = { roomId, fromIdx: roomIdx, toIdx: roomIdx }

  function onMousemove(e: MouseEvent) {
    if (!rowDragState.value) return
    const delta = e.clientY - startY
    const newIdx = Math.max(0, Math.min(totalRooms - 1, roomIdx + Math.round(delta / 48)))
    rowDragState.value = { ...rowDragState.value, toIdx: newIdx }
  }

  function onMouseup() {
    document.removeEventListener('mousemove', onMousemove)
    document.removeEventListener('mouseup', onMouseup)
    const state = rowDragState.value
    rowDragState.value = null
    if (!state || state.fromIdx === state.toIdx) return
    const ids = [...snapshotIds]
    const [moved] = ids.splice(state.fromIdx, 1)
    ids.splice(state.toIdx, 0, moved)
    filterRoomOrder.value = ids
  }

  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
}

function formatBalance(amount: number): string {
  if (amount === 0) return '0'
  return (amount > 0 ? '+' : '') + amount.toLocaleString('en-US')
}

const localReservations = ref<Reservation[]>([...props.reservations])
watch(() => props.reservations, (val) => { localReservations.value = [...val] }, { deep: true })

const roomById = computed(() => {
  const map = new Map<string, Room>()
  for (const s of localSections.value)
    for (const r of s.rooms) map.set(r.id, r)
  return map
})

const { expandedSections, toggleSection } = useSections(localSections)
const { visibleDays, weekHeaders }         = useCalendarDays(toRef(props, 'config'))
const { dragState, isReverting, pendingMove, confirmMove, cancelMove, onRoomRowMouseenter, onBlockMousedown } = useDragDrop(localReservations, DAY_COL_W, emit, toRef(props, 'config'), filterAllowHorizontalDrag, filterAllowVerticalDrag)
const { roomBlocks, wrapRef, onScroll: _onScroll, stickyOffset } = useBlockLayout(
  localReservations, dragState, toRef(props, 'config'), DAY_COL_W, ROOM_COL_W,
)
const scrollLeft = ref(0)
function onScroll(e: Event) {
  scrollLeft.value = (e.target as HTMLElement).scrollLeft
  _onScroll(e)
}
const { tooltipTarget, tooltipStyle, showTooltip, moveTooltip, hideTooltip } = useTooltip()

// ── New reservation drag-to-create ──────────────────────────────────────────
const newResDrag    = ref<NewResDragState | null>(null)
const newResPopover = ref<NewResPopover | null>(null)

const newResPreview = computed(() => {
  const d = newResDrag.value
  if (!d) return null
  const days = visibleDays.value
  const minIdx = Math.max(0, Math.min(d.startDayIdx, d.currentDayIdx))
  const maxIdx = Math.min(days.length - 1, Math.max(d.startDayIdx, d.currentDayIdx))
  return {
    roomId:   d.roomId,
    roomName: d.roomName,
    left:     minIdx * DAY_COL_W.value + DAY_COL_W.value / 2,
    width:    (maxIdx - minIdx + 1) * DAY_COL_W.value,
    checkIn:  days[minIdx].iso,
    checkOut: addDays(days[maxIdx].iso, 1),
  }
})

// Frozen preview kept alive while popover is open
const frozenPreview = ref<{ roomId: string; roomName: string; left: number; width: number; checkIn: string; checkOut: string } | null>(null)

function blockCenterX(preview: { left: number; width: number }) {
  const wrap = wrapRef.value
  if (!wrap) return 0
  const rect = wrap.getBoundingClientRect()
  return rect.left + ROOM_COL_W.value + preview.left + preview.width / 2 - wrap.scrollLeft
}

const newResTooltipStyle = computed(() => {
  const d = newResDrag.value
  const preview = newResPreview.value
  if (!d || !preview) return {}
  return {
    top:       (d.mouseY - 12) + 'px',
    left:      blockCenterX(preview) + 'px',
    transform: 'translate(-50%, -100%)',
  }
})

const popoverStyle = computed(() => {
  const p = newResPopover.value
  const preview = frozenPreview.value
  if (!p || !preview) return {}
  return {
    top:       (p.y - 8) + 'px',
    left:      blockCenterX(preview) + 'px',
    transform: 'translate(-50%, -100%)',
  }
})

function onCellMousedown(event: MouseEvent, room: Room, dayIdx: number) {
  if (dragState.value) return
  closePopover()
  event.preventDefault()

  const startClientX = event.clientX
  newResDrag.value = {
    roomId: room.id, roomName: room.name,
    startDayIdx: dayIdx, currentDayIdx: dayIdx,
    startClientX,
    mouseX: event.clientX, mouseY: event.clientY,
    isActive: false,
  }

  let hasDragged = false

  function onMousemove(e: MouseEvent) {
    if (!newResDrag.value) return
    const totalDeltaPx = e.clientX - startClientX
    if (!hasDragged && Math.abs(totalDeltaPx) < 6) return
    hasDragged = true
    if (newResDrag.value) newResDrag.value.isActive = true
    const deltaIdx = Math.round(totalDeltaPx / DAY_COL_W.value)
    newResDrag.value.currentDayIdx = Math.max(0, Math.min(visibleDays.value.length - 1, dayIdx + deltaIdx))
  }

  function onMouseup() {
    document.removeEventListener('mousemove', onMousemove)
    document.removeEventListener('mouseup',   onMouseup)
    if (!hasDragged) {
      newResDrag.value = null
      return
    }
    const preview = newResPreview.value
    if (preview) {
      frozenPreview.value = { ...preview }
      newResPopover.value = {
        x: 0,
        y: event.clientY,
        roomId:   preview.roomId,
        roomName: preview.roomName,
        checkIn:  preview.checkIn,
        checkOut: preview.checkOut,
        showResSub: false,
      }
      // close on next outside click
      requestAnimationFrame(() => {
        document.addEventListener('mousedown', onOutsideClick)
      })
    }
    newResDrag.value = null
  }

  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup',   onMouseup)
}

function onOutsideClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest?.('.rc-create-popover')
  if (!el) closePopover()
}

function closePopover() {
  newResPopover.value  = null
  frozenPreview.value  = null
  document.removeEventListener('mousedown', onOutsideClick)
}

function selectType(type: 'room-plan' | 'single' | 'group') {
  const p = newResPopover.value
  if (!p) return
  emit('new-reservation', { roomId: p.roomId, checkIn: p.checkIn, checkOut: p.checkOut, type })
  closePopover()
}

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
  search(query: string) {
    searchQuery.value = query
    searchActive.value = query.length > 0
  },
  setFilter(filter: CalendarFilter) {
    if (filter.roomColWidth          !== undefined) filterRoomColW.value             = filter.roomColWidth
    if (filter.showRoomStatus        !== undefined) filterShowRoomStatus.value       = filter.showRoomStatus
    if (filter.calendarType          !== undefined) filterCalendarType.value         = filter.calendarType
    if (filter.roomOrder             !== undefined) filterRoomOrder.value            = filter.roomOrder
    if (filter.showUnallocated       !== undefined) filterShowUnallocated.value      = filter.showUnallocated
    if (filter.showTotalBalance      !== undefined) filterShowTotalBalance.value     = filter.showTotalBalance
    if (filter.showBedName           !== undefined) filterShowBedName.value          = filter.showBedName
    if (filter.showReservationDetail !== undefined) filterShowReservationDetail.value = filter.showReservationDetail
    if (filter.calendarLabel         !== undefined) filterCalendarLabel.value        = filter.calendarLabel
    if (filter.allowHorizontalDrag   !== undefined) filterAllowHorizontalDrag.value  = filter.allowHorizontalDrag
    if (filter.allowVerticalDrag     !== undefined) filterAllowVerticalDrag.value    = filter.allowVerticalDrag
    if (filter.startDate !== undefined) {
      const end = filter.endDate ?? addDays(filter.startDate, props.config.visibleDays - 1)
      emit('date-range-changed', { startDate: filter.startDate, endDate: end })
    }
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
  height: 100%;
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

.col-room { width: var(--rc-room-col-w, 170px); min-width: var(--rc-room-col-w, 170px); }
.col-day  { width: 80px;  min-width: 80px; }

.cal-table-positioner {
  position: relative;
  display: inline-block;
  min-width: 100%;
}

.room-col-resize-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 25;
  border-radius: 3px;
  transition: background 120ms ease-out;
}
@media (hover: hover) and (pointer: fine) {
  .room-col-resize-bar:hover { background: rgba(99, 102, 241, 0.2); }
}
.room-col-resize-bar.is-resizing { background: rgba(99, 102, 241, 0.35); }

/* Sticky first column */
.cal-table th:first-child,
.cal-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 10;
  box-shadow: 1px 0 0 #e5e7eb, 4px 0 8px -2px rgba(0,0,0,0.06);
}
.cal-table thead tr:first-child th { position: sticky; top: 0; z-index: 11; }
.cal-table thead tr:last-child  th { position: sticky; top: 28px; z-index: 11; }
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
.row--with-balance td { height: 72px; }
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
/* Status colors — use CSS custom properties so config popup can override them live */
.booking-block.status-definite {
  background: var(--rc-bg-reservation, #d97706);
  border-left-color: var(--rc-bg-reservation, #b45309);
  --block-fg: var(--rc-fg-reservation, #ffffff);
}
.booking-block.status-check-in {
  background: var(--rc-bg-inhouse, #16a34a);
  border-left-color: var(--rc-bg-inhouse, #15803d);
  --block-fg: var(--rc-fg-inhouse, #ffffff);
}
.booking-block.status-check-out {
  background: var(--rc-bg-checkout, #dc2626);
  border-left-color: var(--rc-bg-checkout, #b91c1c);
  --block-fg: var(--rc-fg-checkout, #ffffff);
}
.booking-block.status-booked {
  background: var(--rc-bg-tentative, #475569);
  border-left-color: var(--rc-bg-tentative, #334155);
  --block-fg: var(--rc-fg-tentative, #ffffff);
}
.booking-block.status-room-maintenance {
  background: var(--rc-bg-maintenance, #475569);
  border-left-color: var(--rc-bg-maintenance, #334155);
  --block-fg: var(--rc-fg-maintenance, #ffffff);
}
@media (hover: hover) and (pointer: fine) {
  .booking-block:hover { filter: brightness(1.08); }
}
.booking-block.is-dragged {
  cursor: grabbing;
  opacity: 0.88;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.08);
  z-index: 20;
}
.booking-block.is-reverting {
  transition: left 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 0.15s;
  cursor: default;
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
  color: var(--block-fg, #fff);
}
.booking-inner > svg { opacity: 0.75; }
.b-texts { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
.b-name  { font-size: 12px; font-weight: 600; color: var(--block-fg, #fff); }
.b-folio { font-size: 11px;  color: #ffffff; opacity: 1; }
.b-paid  { font-size: 11px;  color: #ffffff; opacity: 1; }

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


/* New reservation preview block */
.new-res-preview {
  position: absolute;
  top: 5px; bottom: 5px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.12);
  border: 1.5px dashed #76b51b;
  z-index: 3;
  pointer-events: none;
  animation: newres-fade-in 0.08s cubic-bezier(0.23, 1, 0.32, 1);
}
.new-res-preview.is-frozen {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.4);
}
.new-res-inner {
  position: absolute;
  top: 0; bottom: 0; left: 8px;
  display: flex; align-items: center; gap: 5px;
  color: #76b51b; font-size: 10px; font-weight: 600;
  white-space: nowrap;
}
@keyframes newres-fade-in {
  from { opacity: 0; transform: scaleY(0.88); }
  to   { opacity: 1; transform: scaleY(1); }
}

/* New reservation drag tooltip (white) */
.rc-newres-tooltip {
  position: fixed;
  z-index: 9999;
  min-width: 190px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  padding: 10px 13px;
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  font-size: 11px;
  color: #555;
  animation: tt-fade 0.12s ease-out;
}
@keyframes tt-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.nrt-room {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #1a1a1a;
  letter-spacing: 0.01em;
}
.nrt-divider { height: 1px; background: #ebebeb; margin: 7px 0; }
.nrt-dates {
  display: flex; align-items: center; gap: 5px;
  color: #374151; font-size: 11px;
}
.nrt-nights { margin-top: 3px; color: #9ca3af; font-size: 10px; }

/* Create reservation popover */
.rc-create-popover {
  position: fixed;
  z-index: 9999;
  width: 220px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
  animation: pop-fade 0.15s ease-out;
}
@keyframes pop-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.crp-header { padding: 8px 10px 6px; }
.crp-title {
  font-size: 12px; font-weight: 700; color: #111827;
  letter-spacing: 0.01em;
}
.crp-dates {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: #9ca3af; margin-top: 2px;
  flex-wrap: wrap;
}
.crp-divider { height: 1px; background: #f3f4f6; margin: 2px 0; }
.crp-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 8px 10px;
  background: none; border: none; border-radius: 8px;
  cursor: pointer; text-align: left;
  transition: background 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .crp-item:hover { background: #f9fafb; }
}
.crp-item:active { background: #f3f4f6; transform: scale(0.98); }
.crp-icon {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.crp-icon--plan { background: #f0f9ff; color: #0284c7; }
.crp-icon--res  { background: #f0fdf4; color: #16a34a; }
.crp-item-text { flex: 1; }
.crp-item-label { font-size: 12px; font-weight: 600; color: #111827; }
.crp-arrow { color: #d1d5db; flex-shrink: 0; }
.crp-chevron {
  color: #9ca3af; flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}
.crp-chevron.open { transform: rotate(180deg); }

/* Sub-options (expand animation) */
.crp-sub {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.22s cubic-bezier(0.23, 1, 0.32, 1),
              opacity    0.18s cubic-bezier(0.23, 1, 0.32, 1);
  opacity: 0;
}
.crp-sub.is-visible { max-height: 120px; opacity: 1; }
.crp-sub-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 10px 7px 20px;
  background: none; border: none; border-radius: 7px;
  cursor: pointer; text-align: left;
  font-size: 11px; font-weight: 500; color: #374151;
  transition: background 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .crp-sub-item:hover { background: #f9fafb; }
}
.crp-sub-item:active { background: #f3f4f6; transform: scale(0.98); }
.crp-sub-item svg { color: #9ca3af; flex-shrink: 0; }

/* Scrollbar */
.cal-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
.cal-wrap::-webkit-scrollbar-track { background: #f9fafb; }
.cal-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
.cal-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

/* Move confirmation dialog */
.rc-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(3px);
}
.rc-confirm-dialog {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 24px 22px 20px;
  width: 360px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* X close button */
.rcd-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 28px; height: 28px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.12s ease-out, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}
@media (hover: hover) and (pointer: fine) {
  .rcd-close:hover { background: #e5e7eb; color: #374151; }
}
.rcd-close:active { transform: scale(0.93); }

.rcd-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding-right: 28px;
}
.rcd-icon {
  width: 46px; height: 46px; flex-shrink: 0;
  border-radius: 50%;
  background: #fef3c7;
  display: flex; align-items: center; justify-content: center;
}
.rcd-title {
  font-size: 15px; font-weight: 700; color: #111827;
  letter-spacing: 0.01em; margin-bottom: 3px;
}
.rcd-subtitle { font-size: 12px; color: #6b7280; line-height: 1.45; }

/* Guest card */
.rcd-guest-card {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 11px 13px;
}
.rcd-guest-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
}
.rcd-guest-name { font-size: 14px; font-weight: 700; color: #111827; flex: 1; }
.rcd-folio { font-size: 11.5px; color: #9ca3af; white-space: nowrap; }

/* From / To card */
.rcd-move-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 13px;
}
.rcd-move-col {
  flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0;
}
.rcd-move-label {
  font-size: 9.5px; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.rcd-move-room-row {
  display: flex; align-items: center; gap: 5px;
}
.rcd-move-room {
  font-size: 14px; font-weight: 700; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rcd-move-room--new { color: #d97706; }
.rcd-move-date-row {
  display: flex; align-items: center; gap: 5px;
}
.rcd-move-dates { font-size: 11px; color: #6b7280; white-space: nowrap; }
.rcd-arrow-circle {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
}

/* Nights + paid */
.rcd-meta-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 13px;
}
.rcd-meta-left { display: flex; align-items: center; gap: 6px; }
.rcd-nights { font-size: 12px; font-weight: 500; color: #374151; }
.rcd-paid {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  color: #f59e0b;
  border: 1.5px solid currentColor;
  border-radius: 20px;
  padding: 3px 10px;
}
.rcd-paid--full { color: #16a34a; }

.rcd-actions {
  display: flex; gap: 9px;
  margin-top: 4px;
}
.rcd-btn {
  flex: 1;
  padding: 11px 20px;
  border-radius: 10px;
  font-size: 13.5px; font-weight: 600;
  border: none; cursor: pointer;
  transition: background 0.12s ease-out, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}
.rcd-btn:active { transform: scale(0.97); }
.rcd-btn--cancel { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
@media (hover: hover) and (pointer: fine) {
  .rcd-btn--cancel:hover { background: #e5e7eb; }
}
.rcd-btn--confirm { background: #d97706; color: #ffffff; }
@media (hover: hover) and (pointer: fine) {
  .rcd-btn--confirm:hover { background: #b45309; }
}

/* Room cell drag handle (normal mode) */
.room-drag-handle {
  display: inline-flex; align-items: center; justify-content: center;
  margin-right: 6px; color: #d1d5db; flex-shrink: 0;
  transition: color 0.12s;
}
.room-cell--draggable { cursor: grab; }
.room-cell--draggable:active { cursor: grabbing; }
@media (hover: hover) and (pointer: fine) {
  .room-cell--draggable:hover .room-drag-handle { color: #9ca3af; }
}

/* Row drag states */
.row-is-dragged td { opacity: 0.4; }
.row-drop-above td { box-shadow: inset 0 2px 0 #76b51b !important; }

/* Bed name */
.room-bed-name { font-weight: 400; color: #bbb; }

/* Balance line on booking block */
.b-balance { font-size: 9px; color: #ffffff; opacity: 0.8; }

/* Root wrapper */
.rc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Search toolbar */
.rc-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #ffffff;
  flex-shrink: 0;
}

.rc-search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 360px;
  background: #f3f4f6;
  border: 1.5px solid transparent;
  border-radius: 9px;
  padding: 8px 12px;
  transition: border-color 0.15s cubic-bezier(0.23, 1, 0.32, 1),
              background  0.15s cubic-bezier(0.23, 1, 0.32, 1);
}
.rc-search-field.is-active,
.rc-search-field:focus-within {
  border-color: #76b51b;
  background: #ffffff;
}
.rc-search-icon {
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.15s;
}
.rc-search-field.is-active .rc-search-icon,
.rc-search-field:focus-within .rc-search-icon { color: #76b51b; }

.rc-search-input {
  flex: 1; min-width: 0;
  background: none; border: none; outline: none;
  font-size: 13px; color: #111827;
  font-family: inherit;
}
.rc-search-input::placeholder { color: #c4c9d4; }

.rc-search-clear {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px;
  background: #e5e7eb; border: none; cursor: pointer;
  color: #6b7280; padding: 0; flex-shrink: 0;
  transition: background 0.1s, color 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .rc-search-clear:hover { background: #d1d5db; color: #374151; }
}

.rc-search-badge {
  font-size: 11px;
  color: #76b51b;
  font-weight: 500;
  white-space: nowrap;
}

/* Clear button transition */
.search-clear-fade-enter-active { transition: opacity 0.12s ease-out, transform 0.12s ease-out; }
.search-clear-fade-leave-active { transition: opacity 0.08s ease-in, transform 0.08s ease-in; }
.search-clear-fade-enter-from  { opacity: 0; transform: scale(0.7); }
.search-clear-fade-leave-to    { opacity: 0; transform: scale(0.7); }

/* Badge transition */
.search-badge-fade-enter-active { transition: opacity 0.15s ease-out; }
.search-badge-fade-leave-active { transition: opacity 0.1s ease-in; }
.search-badge-fade-enter-from,
.search-badge-fade-leave-to     { opacity: 0; }

/* cal-wrap fills remaining height */
.cal-wrap { flex: 1; min-height: 0; }

/* Row search states */
.row-search-dim td   { opacity: 0.35; transition: opacity 0.2s; }
.row-search-match td { transition: opacity 0.2s; }

/* Block search states */
.booking-block.is-search-dim {
  opacity: 0.2;
  transition: opacity 0.2s;
}
.booking-block.is-search-match {
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(99, 102, 241, 0.75);
  z-index: 5;
}

/* Calendar Configuration button */
.rc-config-btn {
  display: flex; align-items: center; gap: 7px;
  margin-left: auto;
  padding: 8px 14px;
  background: #76b51b;
  border: 1.5px solid #76b51b;
  border-radius: 9px;
  font-size: 13px; font-weight: 600; color: #ffffff;
  cursor: pointer; flex-shrink: 0; font-family: inherit;
  transition: background 0.12s, border-color 0.12s,
              transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
  white-space: nowrap;
}
@media (hover: hover) and (pointer: fine) {
  .rc-config-btn:hover { background: #5e9016; border-color: #5e9016; }
}
.rc-config-btn:active { transform: scale(0.97); }

/* Config modal overlay */
.rc-cfg-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(2px);
}
.rc-cfg-dialog {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
}

/* Modal header */
.rc-cfg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.rc-cfg-header-left { display: flex; align-items: center; gap: 12px; }
.rc-cfg-header-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #76b51b;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rc-cfg-title { font-size: 15px; font-weight: 700; color: #111827; letter-spacing: 0.01em; }
.rc-cfg-subtitle { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.rc-cfg-close {
  width: 28px; height: 28px; border-radius: 7px;
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af; flex-shrink: 0;
  transition: background 0.1s, color 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .rc-cfg-close:hover { background: #f3f4f6; color: #374151; }
}

/* Modal body */
.rc-cfg-body { flex: 1; overflow-y: auto; padding: 4px 0; }
.rc-cfg-body::-webkit-scrollbar { width: 4px; }
.rc-cfg-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

/* Section */
.rc-cfg-section {
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.rc-cfg-section:last-child { border-bottom: none; }
.rc-cfg-section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: #111827;
  letter-spacing: -0.01em; margin-bottom: 14px;
}
.rc-cfg-section-icon {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: #111827;
}
.rc-cfg-inner-divider {
  height: 1px; background: #d1d5db;
  margin: 10px 0 14px;
}

/* Setting rows */
.rc-cfg-row {
  display: flex; align-items: center; justify-content: space-between;
  min-height: 34px; gap: 12px; margin-bottom: 8px;
}
.rc-cfg-row:last-child { margin-bottom: 0; }
.rc-cfg-label { font-size: 12.5px; color: #374151; font-weight: 500; flex: 1; min-width: 0; }

/* Radio pills — Calendar Type */
.rc-cfg-radio-group { display: flex; gap: 6px; flex-wrap: wrap; }
.rc-cfg-radio {
  display: flex; align-items: center;
  font-size: 12px; color: #374151; cursor: pointer;
  padding: 4px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
  user-select: none;
}
.rc-cfg-radio input[type="radio"],
.rc-cfg-radio input[type="checkbox"] { display: none; }
.rc-cfg-radio:has(input:checked) {
  border-color: #76b51b; background: #f3fae8;
  color: #76b51b; font-weight: 600;
}

/* Checkbox group for block label */
.rc-cfg-check-group { display: flex; gap: 10px; flex-wrap: wrap; }
.rc-cfg-check {
  display: flex; align-items: center; gap: 7px;
  font-size: 12.5px; color: #374151; cursor: pointer; user-select: none;
}
.rc-cfg-check input[type="checkbox"] { display: none; }
.rc-cfg-check-box {
  width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
  border: 1.5px solid #d1d5db;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  transition: background 0.12s, border-color 0.12s;
}
.rc-cfg-check:has(input:checked) .rc-cfg-check-box {
  background: #76b51b; border-color: #76b51b;
}
.rc-cfg-check:has(input:checked) { color: #111827; font-weight: 600; }

/* Number input */
.rc-cfg-number {
  width: 90px; padding: 5px 9px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  font-size: 12.5px; color: #374151; font-family: inherit;
  outline: none; flex-shrink: 0;
  transition: border-color 0.12s;
}
.rc-cfg-number:focus { border-color: #76b51b; }

/* Toggle switch */
.rc-cfg-toggle {
  width: 40px; height: 22px; border-radius: 11px;
  background: #e5e7eb; border: none; cursor: pointer;
  position: relative; flex-shrink: 0; padding: 0;
  transition: background 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}
.rc-cfg-toggle.is-on { background: #76b51b; }
.rc-cfg-toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}
.rc-cfg-toggle.is-on .rc-cfg-toggle-thumb { transform: translateX(18px); }

/* Color grid */
.rc-cfg-colors-header {
  display: grid; grid-template-columns: 1fr 72px 72px;
  gap: 8px; margin-bottom: 8px; align-items: center;
}
.rc-cfg-color-col-label {
  font-size: 10px; font-weight: 600; color: #bbb;
  text-transform: uppercase; letter-spacing: 0.05em; text-align: center;
}
.rc-cfg-color-row {
  display: grid; grid-template-columns: 1fr 72px 72px;
  gap: 8px; align-items: center; margin-bottom: 10px;
}
.rc-cfg-color-row:last-child { margin-bottom: 0; }
.rc-cfg-status-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 500; color: #374151;
}
.rc-cfg-status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

/* Color swatch */
.rc-cfg-color-swatch {
  display: flex; justify-content: center; cursor: pointer; position: relative;
}
.rc-cfg-color-swatch input[type="color"] {
  position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none;
}
.rc-cfg-color-swatch span {
  width: 40px; height: 28px; border-radius: 7px;
  border: 1.5px solid rgba(0,0,0,0.1); display: block;
  transition: transform 0.1s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.1s;
  cursor: pointer;
}
.rc-cfg-color-swatch-fg {
  background-image: repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) !important;
  background-size: 8px 8px !important;
  position: relative;
}
.rc-cfg-color-swatch-fg::after {
  content: '';
  position: absolute; inset: 0; border-radius: 5px;
  background: inherit;
  background-image: none !important;
}
@media (hover: hover) and (pointer: fine) {
  .rc-cfg-color-swatch:hover span {
    transform: scale(1.08);
    box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  }
}

/* Modal footer */
.rc-cfg-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa; flex-shrink: 0;
}
.rc-cfg-btn {
  padding: 9px 18px; border-radius: 9px;
  font-size: 13px; font-weight: 600;
  border: none; cursor: pointer; font-family: inherit;
  transition: background 0.1s, transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}
.rc-cfg-btn:active { transform: scale(0.97); }
.rc-cfg-btn--cancel { background: #f3f4f6; color: #374151; }
@media (hover: hover) and (pointer: fine) {
  .rc-cfg-btn--cancel:hover { background: #e5e7eb; }
}
.rc-cfg-btn--save { background: #76b51b; color: #ffffff; }
@media (hover: hover) and (pointer: fine) {
  .rc-cfg-btn--save:hover { background: #5e9016; }
}

/* Modal transition */
.cfg-modal-enter-active { transition: opacity 0.18s ease-out; }
.cfg-modal-leave-active { transition: opacity 0.14s ease-in; }
.cfg-modal-enter-from, .cfg-modal-leave-to { opacity: 0; }
.cfg-modal-enter-active .rc-cfg-dialog {
  transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.18s ease-out;
}
.cfg-modal-leave-active .rc-cfg-dialog {
  transition: transform 0.14s ease-in, opacity 0.14s ease-in;
}
.cfg-modal-enter-from .rc-cfg-dialog { transform: scale(0.95) translateY(8px); opacity: 0; }
.cfg-modal-leave-to .rc-cfg-dialog { transform: scale(0.97); opacity: 0; }

/* Dialog enter/leave transitions */
.confirm-dialog-enter-active {
  transition: opacity 0.18s ease-out;
}
.confirm-dialog-leave-active {
  transition: opacity 0.14s ease-in;
}
.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}
.confirm-dialog-enter-active .rc-confirm-dialog {
  transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.18s ease-out;
}
.confirm-dialog-leave-active .rc-confirm-dialog {
  transition: transform 0.14s ease-in, opacity 0.14s ease-in;
}
.confirm-dialog-enter-from .rc-confirm-dialog {
  transform: scale(0.95) translateY(6px);
  opacity: 0;
}
.confirm-dialog-leave-to .rc-confirm-dialog {
  transform: scale(0.97);
  opacity: 0;
}
</style>
