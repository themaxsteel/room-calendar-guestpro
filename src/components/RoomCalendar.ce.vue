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
        @input="onSearchInput"
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
      <div v-if="searchQuery" class="rc-search-nav">
        <template v-if="searchResults.length > 0">
          <button class="rc-search-nav-btn" @mousedown.prevent="searchNavPrev" :disabled="searchResults.length <= 1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="rc-search-nav-label">{{ searchNavIndex + 1 }} / {{ searchResults.length }}</span>
          <button class="rc-search-nav-btn" @mousedown.prevent="searchNavNext" :disabled="searchResults.length <= 1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </template>
        <span v-else class="rc-search-nav-empty">No results</span>
      </div>
    </Transition>
    <Transition name="loadmore-fade">
      <button
        v-if="atScrollEnd"
        type="button"
        class="rc-loadmore-btn"
        :disabled="isInfiniteLoading"
        @click="loadMoreDays"
        title="Load more days"
      >
        <svg v-if="isInfiniteLoading" class="rc-loadmore-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
        </svg>
        <span class="rc-loadmore-text">{{ isInfiniteLoading ? 'Loading…' : 'Load More' }}</span>
      </button>
    </Transition>
    <button class="rc-filter-btn" :class="{ 'has-active': filterSearchActive }" @click="openFilterSearch" title="Filter">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span class="rc-filter-btn-text">Filter</span>
      <span v-if="filterSearchActive" class="rc-filter-dot"></span>
    </button>
    <button class="rc-config-btn" @click="openCalConfig" title="Calendar Configuration">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      <span class="rc-config-btn-text">Calendar Configuration</span>
    </button>
  </div>

  <div class="cal-wrap" ref="wrapRef" @scroll="onScroll">
    <div class="cal-table-positioner">
      <div
        class="room-col-resize-bar"
        :class="{ 'is-resizing': isResizingRoomCol }"
        :style="{ left: (ROOM_COL_W - 3 + scrollLeft) + 'px' }"
        @pointerdown.stop.prevent="onRoomColResizeStart"
      ></div>
      <table class="cal-table" :class="{ 'is-dragging': dragState !== null }">
      <thead>
        <!-- Week header row -->
        <tr>
          <th class="col-room col-room--header" rowspan="2">ROOMS</th>
          <th
            v-for="week in weekHeaders"
            :key="week.label"
            class="week-header"
            :colspan="week.span"
          >{{ week.label }}</th>
        </tr>
        <!-- Day header row -->
        <tr>
          <th
            v-for="day in visibleDays"
            :key="day.iso"
            class="col-day"
            :class="{ 'today-th': day.isToday, }"
          >{{ day.label }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="section in displaySections" :key="section.id">
          <!-- Section header -->
          <tr v-if="filterCalendarType === 'by-room-type'" class="section-row" @click="toggleSection(section.id)">
            <td class="section-first" style="box-shadow: inset 3px 0 0 #9ca3af">
              <div class="section-first-inner">
                {{ section.label }} ({{ section.rooms.length }})
                <span class="section-chevron" :class="{ 'is-open': expandedSections[section.id] }">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>
            </td>
            <td v-for="day in visibleDays" :key="day.iso" class="section-rest">
              <span
                v-if="sectionAvailability.get(section.id)?.get(day.iso) !== undefined"
                class="avail-badge"
                :class="availClass(sectionAvailability.get(section.id)!.get(day.iso)!, 0)"
              >{{ sectionAvailability.get(section.id)!.get(day.iso) }}</span>
            </td>
          </tr>
          <!-- Room rows -->
          <tr
            v-for="(room, roomIdx) in section.rooms"
            v-show="filterCalendarType === 'normal' || expandedSections[section.id]"
            :key="room.id"
            :data-room-id="room.id"
            :class="{
              'drop-target':     dragState !== null && dragState.targetRoomId === room.id && dragState.roomId !== room.id,
              'row-is-dragged':  rowDragState?.roomId === room.id,
              'row-drop-above':  rowDragState !== null && rowDragState.toIdx === roomIdx && rowDragState.fromIdx !== roomIdx,
              'row-search-dim':  searchQuery && !matchingRoomIds.has(room.id),
              'row-search-match': searchQuery && matchingRoomIds.has(room.id),
              'row--with-balance': filterShowTotalBalance,
            }"
            :style="{ '--row-h': baseRowHeight * roomTotalRows(room.id) + 'px' }"
          >
            <td
              class="room-cell col-room"
              :class="{ 'room-cell--draggable': filterCalendarType === 'normal' && filterAllowVerticalDrag }"
              @pointerdown.stop="onRoomCellPointerdown($event, room.id, roomIdx)"
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
              @pointerdown="onCellPointerdown($event, room, idx)"
            >
              <!-- Render booking blocks anchored to their start-day cell -->
              <template v-if="idx === 0">
                <div
                  v-for="block in roomBlocks(room.id)"
                  :key="block.id"
                  class="booking-block"
                  :class="[`status-${block.status.toLowerCase().replace('_', '-')}`, { 'is-dragged': dragState?.blockId === block.id, 'is-search-match': searchQuery && isSearchMatch(block), 'is-search-dim': searchQuery && !isSearchMatch(block), 'is-search-active': searchQuery && block.id === searchResults[searchNavIndex]?.id }]"
                  :style="{
                    left:   block.left + 'px',
                    width:  block.width + 'px',
                    top:    block.totalRows > 1 ? `calc(${block.row / block.totalRows * 100}% + 2px)`                         : '0',
                    bottom: block.totalRows > 1 ? `calc(${(block.totalRows - block.row - 1) / block.totalRows * 100}% + 2px)` : '0',
                  }"
                  @pointerdown.stop.prevent="block.status !== 'ROOM_MAINTENANCE' && onBlockPointerdown($event, block, room)"
                  @mouseenter="block.status !== 'ROOM_MAINTENANCE' && showTooltip($event, block, room)"
                  @mousemove="block.status !== 'ROOM_MAINTENANCE' && moveTooltip($event)"
                  @mouseleave="block.status !== 'ROOM_MAINTENANCE' && hideTooltip()"
                >
                  <div class="booking-inner">
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
                      <div class="b-left-col" :style="block.agentColor ? { color: block.agentColor } : undefined">
                        <svg width="13" height="13" :viewBox="agentIcon(block.iconCode).vb" fill="currentColor">
                          <path :d="agentIcon(block.iconCode).d"/>
                        </svg>
                      </div>
                      <div class="b-texts">
                        <span class="b-name">{{ filterCalendarLabel === 'folio' ? 'Folio #' + block.folioNumber : block.guestName }}</span>
                        <span v-if="filterShowFolioSecondary" class="b-folio">Folio #{{ block.folioNumber }}</span>
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
      <span class="crp-header-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
      <div class="crp-header-text">
        <div class="crp-title">Create New</div>
        <div class="crp-dates">
          {{ formatDateLong(newResPopover.checkIn) }}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
          {{ formatDateLong(newResPopover.checkOut) }}
          <span class="crp-nights-chip">{{ nightsBetween(newResPopover.checkIn, newResPopover.checkOut) }}night(s)</span>
        </div>
      </div>
      <button class="crp-close" @click="closePopover" aria-label="Close">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="crp-divider"></div>

    <!-- Create Room Plan -->
    <button class="crp-card crp-card--plan" @click="selectType('room-plan')">
      <span class="crp-card-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </span>
      <span class="crp-card-label">Create Room Plan</span>
      <svg class="crp-card-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>

    <!-- Create Reservation — opens right submenu -->
    <button class="crp-card crp-card--res" :class="{ 'is-active': newResPopover.showResSub }" @click="newResPopover.showResSub = !newResPopover.showResSub">
      <span class="crp-card-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </span>
      <span class="crp-card-label">Create Reservation</span>
      <svg class="crp-card-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
  </div>

  <!-- Reservation type submenu (appears to the right) -->
  <div v-if="newResPopover?.showResSub" class="rc-res-submenu" :style="subMenuStyle">
    <button class="rsm-item" @click="selectType('single')">
      <span class="rsm-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </span>
      <span class="rsm-label">Single Reservation</span>
      <svg class="rsm-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
    <div class="rsm-sep"></div>
    <button class="rsm-item" @click="selectType('group')">
      <span class="rsm-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3" opacity="0.65"/>
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/>
          <path d="M17 14c2.5.4 5 2.4 5 6" opacity="0.65"/>
        </svg>
      </span>
      <span class="rsm-label">Group Reservation</span>
      <svg class="rsm-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
  </div>

  <!-- Move confirmation dialog -->
  <Transition name="confirm-dialog">
    <div v-if="pendingMove" class="rc-confirm-overlay" @pointerdown.self="cancelMove">
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
          </div>
        </div>

        <!-- Date + nights + paid -->
        <div v-if="pendingMove" class="rcd-meta-card">
          <div class="rcd-meta-left">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="rcd-nights">{{ formatDateRange(pendingMove.arrival_date, pendingMove.departure_date) }} · {{ nightsBetween(pendingMove.arrival_date, pendingMove.departure_date) }} nights</span>
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
  <Transition name="tt">
    <div v-if="tooltipTarget && !dragState && filterShowReservationDetail" class="rc-tooltip" :class="statusClass(tooltipTarget.block.status)" :style="tooltipStyle">
      <div class="tt-header">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <span class="tt-guest">{{ tooltipTarget.block.guestName }}</span>
      </div>
      <div class="tt-body">
        <div class="tt-row">
          <svg class="tt-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span class="tt-val">Room {{ tooltipTarget.room.name }}</span>
        </div>
        <div class="tt-row">
          <svg class="tt-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="tt-val">Folio #{{ tooltipTarget.block.folioNumber }}</span>
        </div>
        <div v-if="tooltipTarget.block.agentName" class="tt-row">
          <svg class="tt-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span class="tt-val">{{ tooltipTarget.block.agentName }}</span>
        </div>
        <div class="tt-divider"></div>
        <div class="tt-stay">
          <span class="tt-stay-label tt-l">Check-in</span>
          <span class="tt-stay-nights">{{ nightsBetween(tooltipTarget.block.checkIn, tooltipTarget.block.checkOut) }} {{ nightsBetween(tooltipTarget.block.checkIn, tooltipTarget.block.checkOut) === 1 ? 'night' : 'nights' }}</span>
          <span class="tt-stay-label tt-r">Check-out</span>
          <span class="tt-stay-date tt-l">{{ formatDateShort(tooltipTarget.block.checkIn) }}</span>
          <span class="tt-stay-conn">
            <i class="tt-stay-dot"></i>
            <i class="tt-stay-track"></i>
            <i class="tt-stay-arrow"></i>
          </span>
          <span class="tt-stay-date tt-r">{{ formatDateShort(tooltipTarget.block.checkOut) }}</span>
        </div>
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
        <div v-if="tooltipTarget.block.totalBill != null" class="tt-divider"></div>
        <div v-if="tooltipTarget.block.totalBill != null" class="tt-amounts">
          <div class="tt-amount-row">
            <span class="tt-amount-label">Total Bill</span>
            <span class="tt-amount-val">{{ formatMoney(tooltipTarget.block.totalBill) }}</span>
          </div>
          <div class="tt-amount-row">
            <span class="tt-amount-label">Outstanding</span>
            <span class="tt-amount-val" :class="{ 'tt-amount-due': (tooltipTarget.block.outstanding ?? 0) > 0 }">
              {{ formatMoney(tooltipTarget.block.outstanding ?? 0) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Filter Search Modal -->
  <Transition name="cfg-modal">
    <div v-if="filterSearchOpen" class="rc-cfg-overlay" @pointerdown.self="filterSearchOpen = false">
      <div class="rc-cfg-dialog rc-fs-dialog">
        <!-- Header -->
        <div class="rc-cfg-header">
          <div class="rc-cfg-header-left">
            <div class="rc-cfg-header-icon rc-fs-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div class="rc-cfg-title">Filter</div>
              <div class="rc-cfg-subtitle">Select a start date — the calendar shows 30 days and scrolls infinitely right</div>
            </div>
          </div>
          <button class="rc-cfg-close" @click="filterSearchOpen = false" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="rc-cfg-body rc-fs-body">

          <!-- Selected start date display -->
          <div class="rc-fs-range-bar rc-fs-range-bar--single">
            <div class="rc-fs-range-slot is-active" :class="{ 'is-filled': !!filterSearch.startDate }">
              <div class="rc-fs-range-label">Start Date</div>
              <div class="rc-fs-range-val">{{ filterSearch.startDate ? formatDpDate(filterSearch.startDate) : 'Select date' }}</div>
            </div>
          </div>

          <!-- Calendar -->
          <div class="rc-fs-cal">
            <!-- Month nav -->
            <div class="rc-fs-cal-nav">
              <button class="rc-fs-cal-nav-btn" @click="dpPrevMonth">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="rc-fs-cal-month">{{ dpMonthLabel }}</span>
              <button class="rc-fs-cal-nav-btn" @click="dpNextMonth">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <!-- Weekday headers -->
            <div class="rc-fs-cal-grid">
              <div v-for="wd in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="wd" class="rc-fs-cal-wd">{{ wd }}</div>

              <!-- Day cells -->
              <div
                v-for="cell in dpCells"
                :key="cell.key"
                class="rc-fs-cal-day"
                :class="{
                  'is-empty':   !cell.iso,
                  'is-today':   cell.iso === todayIso,
                  'is-start':   cell.iso === filterSearch.startDate,
                }"
                @click="cell.iso && onDpDayClick(cell.iso)"
                @mouseenter="cell.iso && (dpHover = cell.iso)"
                @mouseleave="dpHover = ''"
              >
                <span v-if="cell.iso" class="rc-fs-cal-day-inner">{{ cell.day }}</span>
              </div>
            </div>
          </div>

          <!-- Open Availability -->
          <div class="rc-fs-avail-row">
            <div>
              <div class="rc-fs-avail-label">Open Availability</div>
              <div class="rc-fs-avail-sub">Show only rooms with open slots</div>
            </div>
            <button class="rc-cfg-toggle" :class="{ 'is-on': filterSearch.openAvailability }" @click="filterSearch.openAvailability = !filterSearch.openAvailability">
              <span class="rc-cfg-toggle-thumb"></span>
            </button>
          </div>

        </div>

        <!-- Footer -->
        <div class="rc-cfg-footer">
          <button class="rc-cfg-btn rc-cfg-btn--cancel" @click="resetFilterSearch">Reset</button>
          <button class="rc-cfg-btn rc-cfg-btn--save rc-fs-search-btn" @click="submitFilterSearch">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
            Search
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Calendar Configuration Modal -->
  <Transition name="cfg-modal">
    <div v-if="calConfigOpen" class="rc-cfg-overlay" @pointerdown.self="calConfigOpen = false">
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

            <div class="rc-cfg-row rc-cfg-row--toggle">
              <label class="rc-cfg-label">Reservation Starts at 00:00</label>
              <button class="rc-cfg-toggle" :class="{ 'is-on': calConfig.calender_block_start_midnight === 1 }" @click="calConfig.calender_block_start_midnight = calConfig.calender_block_start_midnight === 1 ? 0 : 1">
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
            <!-- Room Type Column Width input removed: this Gantt layout renders room
                 types as section header rows, not a separate column, so the value
                 has no visual effect. The calender_room_type_column field is kept in
                 calConfig for backend round-trip via setCalendarConfiguration(). -->
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

  <!-- Transient toast (e.g. blocked move) -->
  <Transition name="rc-toast-fade">
    <div v-if="toastMessage" class="rc-toast" role="status">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ toastMessage }}</span>
    </div>
  </Transition>

  <!-- Loading lock — blocks all calendar interaction while data updates -->
  <Transition name="rc-loading-fade">
    <div v-if="isCalendarLoading" class="rc-loading-veil" @pointerdown.stop.prevent @click.stop.prevent @wheel.stop.prevent>
      <div class="rc-loading-pill">
        <svg class="rc-loading-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span>{{ loadingText }}</span>
      </div>
    </div>
  </Transition>

  </div><!-- /rc-root -->
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { Room, RoomSection, Reservation, CalendarConfig, CalendarFilter, NewResDragState, NewResPopover } from '../types'
import { useSections } from '../composables/useSections'
import { useCalendarDays } from '../composables/useCalendarDays'
import { useBlockLayout } from '../composables/useBlockLayout'
import { useDragDrop } from '../composables/useDragDrop'
import { addDays, todayIso, formatDateLong, formatDateRange, nightsBetween } from '../composables/useDateHelpers'
import { useTooltip } from '../composables/useTooltip'
import { transformRoomCharting, transformReservations } from '../composables/useGuestProAdapter'
import type { GuestProChartingRoom, GuestProReservationItem, GuestProReservationResponse } from '../composables/useGuestProAdapter'

function postFlutterMessage(type: string, payload: unknown) {
  if (typeof window !== 'undefined' && (window as any).Flutter) {
    (window as any).Flutter.postMessage(JSON.stringify({ type, payload }))
  }
}

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
  'reservation-moved':  [payload: { id: string; room_id: string; arrival_date: string; departure_date: string; company_id: string; from_room_id: string; original?: Record<string, unknown> }]
  'date-range-changed': [payload: { startDate: string; endDate: string }]
  'new-reservation':    [payload: { roomId: string; roomName: string; roomTypeId: string; roomTypeName: string; checkIn: string; checkOut: string; type: 'room-plan' | 'single' | 'group' }]
  'calendar-config-saved': [payload: Record<string, unknown>]
  'filter-search': [payload: { startDate: string; openAvailability: boolean }]
  'infinite-scroll-load': [payload: { startDate: string; endDate: string }]
}>()

const DAY_COL_W = computed(() => props.config.dayColWidth ?? 100)

// Filter overrides (set via setFilter())
const filterRoomColW            = ref<number | null>(null)
const filterShowRoomStatus      = ref(true)
const filterCalendarType        = ref<'by-room-type' | 'normal'>('by-room-type')
const filterRoomOrder           = ref<string[] | null>(null)
const filterShowUnallocated     = ref(true)
const filterShowTotalBalance    = ref(false)
const filterShowBedName         = ref(false)
const filterShowReservationDetail = ref(true)
const filterCalendarLabel         = ref<'guest-name' | 'folio'>('guest-name')
const filterBlockStartMidnight    = ref(true)
const filterShowFolioSecondary  = ref(false)
const filterAllowVerticalDrag = ref(true)

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
  calender_block_start_midnight:   1 as 0 | 1,
})

// Applied (committed) colors — the calendar reads from these, NOT the draft
// `calConfig`. Editing swatches in the popup only mutates the draft; colors are
// committed here on Save (or via setCalendarConfiguration).
const COLOR_KEYS = [
  'background_color_reservation',
  'background_color_tentative',
  'background_color_inhouse',
  'background_color_checkout',
  'background_color_room_maintenance',
  'foreground_color_reservation',
  'foreground_color_tentative',
  'foreground_color_inhouse',
  'foreground_color_checkout',
  'foreground_color_room_maintenance',
] as const
const appliedColors = reactive({
  background_color_reservation:      calConfig.background_color_reservation,
  background_color_tentative:        calConfig.background_color_tentative,
  background_color_inhouse:          calConfig.background_color_inhouse,
  background_color_checkout:         calConfig.background_color_checkout,
  background_color_room_maintenance: calConfig.background_color_room_maintenance,
  foreground_color_reservation:      calConfig.foreground_color_reservation,
  foreground_color_tentative:        calConfig.foreground_color_tentative,
  foreground_color_inhouse:          calConfig.foreground_color_inhouse,
  foreground_color_checkout:         calConfig.foreground_color_checkout,
  foreground_color_room_maintenance: calConfig.foreground_color_room_maintenance,
})
function commitColors() {
  for (const key of COLOR_KEYS) appliedColors[key] = calConfig[key]
}

const calConfigStyle = computed(() => ({
  '--rc-room-col-w': ROOM_COL_W.value + 'px',
  '--rc-bg-reservation': appliedColors.background_color_reservation,
  '--rc-bg-tentative':   appliedColors.background_color_tentative,
  '--rc-bg-inhouse':     appliedColors.background_color_inhouse,
  '--rc-bg-checkout':    appliedColors.background_color_checkout,
  '--rc-bg-maintenance': appliedColors.background_color_room_maintenance,
  '--rc-fg-reservation': appliedColors.foreground_color_reservation,
  '--rc-fg-tentative':   appliedColors.foreground_color_tentative,
  '--rc-fg-inhouse':     appliedColors.foreground_color_inhouse,
  '--rc-fg-checkout':    appliedColors.foreground_color_checkout,
  '--rc-fg-maintenance': appliedColors.foreground_color_room_maintenance,
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
  calConfig.calender_label               = filterCalendarLabel.value === 'folio' ? 'folio' : filterShowFolioSecondary.value ? 'guest_name,folio' : 'guest_name'
  calConfig.calender_type                = filterCalendarType.value === 'normal' ? 'NORMAL' : 'GROUP'
  calConfig.calender_use_unallocated     = filterShowUnallocated.value ? 1 : 0
  calConfig.calender_total_balance       = filterShowTotalBalance.value ? 1 : 0
  calConfig.show_bed_type_after_room_name = filterShowBedName.value ? 1 : 0
  calConfig.calender_show_hover_tooltips = filterShowReservationDetail.value ? 1 : 0
  calConfig.calender_block_start_midnight = filterBlockStartMidnight.value ? 1 : 0
  calConfig.calender_room_column         = ROOM_COL_W.value
  // Reset the draft swatches to the currently-applied colors so cancelling
  // discards any prior unsaved edits.
  for (const key of COLOR_KEYS) calConfig[key] = appliedColors[key]
  calConfigOpen.value = true
}

function applyCalConfig() {
  filterCalendarLabel.value         = calConfig.calender_label === 'folio' ? 'folio' : 'guest-name'
  filterShowFolioSecondary.value    = calConfig.calender_label === 'guest_name,folio'
  filterCalendarType.value          = calConfig.calender_type === 'NORMAL' ? 'normal' : 'by-room-type'
  filterShowUnallocated.value       = calConfig.calender_use_unallocated === 1
  filterShowTotalBalance.value      = calConfig.calender_total_balance === 1
  filterShowBedName.value           = calConfig.show_bed_type_after_room_name === 1
  filterShowReservationDetail.value = calConfig.calender_show_hover_tooltips === 1
  filterBlockStartMidnight.value    = calConfig.calender_block_start_midnight === 1
  filterRoomColW.value              = calConfig.calender_room_column
  // A prior cursor resize takes precedence in ROOM_COL_W via resizedRoomColW;
  // clear it so the config value actually applies instead of being shadowed.
  resizedRoomColW.value             = null
}

// Optional deferred-commit handler registered by the host via
// setSaveConfigurationHandler(). When present, Save Configuration hands the
// config to the host and only applies to the UI when event.commit() is called
// (e.g. after the host's persist API succeeds). When absent, the existing
// immediate behaviour runs (apply to UI + emit calendar-config-saved).
type SaveConfigEvent = { commit: () => void }
const saveConfigHandler = ref<((config: Record<string, unknown>, event: SaveConfigEvent) => void) | null>(null)

function saveCalConfig() {
  const cfg = { ...calConfig }
  calConfigOpen.value = false

  if (saveConfigHandler.value) {
    // Deferred mode — UI changes wait for the host to call event.commit().
    let committed = false
    const event: SaveConfigEvent = {
      commit() {
        if (committed) return
        committed = true
        applyCalConfig()
        commitColors()
      },
    }
    saveConfigHandler.value(cfg, event)
    return
  }

  // Immediate mode (existing behaviour for other modules).
  applyCalConfig()
  commitColors()
  emit('calendar-config-saved', cfg)
  postFlutterMessage('calendar-config-saved', cfg)
}

const resizedRoomColW   = ref<number | null>(null)
const isResizingRoomCol = ref(false)
const ROOM_COL_W = computed(() => resizedRoomColW.value ?? filterRoomColW.value ?? props.config.roomColWidth ?? 170)

const baseRowHeight = computed(() => {
  const lines = 1
    + (filterShowFolioSecondary.value ? 1 : 0)
    + (filterShowTotalBalance.value   ? 1 : 0)
  return lines === 1 ? 34 : lines === 2 ? 40 : 60
})

function onRoomColResizeStart(e: PointerEvent) {
  const startX = e.clientX
  const startW = ROOM_COL_W.value
  const MIN_W  = 100
  const MAX_W  = 400
  isResizingRoomCol.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

  function onMove(ev: PointerEvent) {
    resizedRoomColW.value = Math.min(MAX_W, Math.max(MIN_W, startW + ev.clientX - startX))
  }
  function onUp() {
    isResizingRoomCol.value = false
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// ── Search ────────────────────────────────────────────────────────────────────
const searchQuery        = ref('')
const searchActive       = ref(false)
const searchInputRef     = ref<HTMLInputElement | null>(null)
const preSearchStartDate = ref<string | null>(null)

function onSearchInput() {
  if (!preSearchStartDate.value && searchQuery.value) {
    preSearchStartDate.value = effectiveConfig.value.startDate
  }
}

function isSearchMatch(block: { guestName: string; folioNumber: string }): boolean {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return true
  return block.guestName.toLowerCase().includes(q) || block.folioNumber.toLowerCase().includes(q)
}

function clearSearch() {
  searchQuery.value             = ''
  searchActive.value            = false
  searchNavIndex.value          = 0
  filterStartDateOverride.value = preSearchStartDate.value
  preSearchStartDate.value      = null
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

// Sorted list of individual matching reservations for navigator
const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return localReservations.value
    .filter(r => r.guestName.toLowerCase().includes(q) || r.folioNumber.toLowerCase().includes(q))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
})

const searchNavIndex = ref(0)

watch(searchResults, (results) => {
  searchNavIndex.value = 0
  if (results.length > 0) searchNavJump(results, 0)
})

function searchNavJump(results: typeof searchResults.value, idx: number) {
  const res = results[idx]
  if (!res) return
  filterStartDateOverride.value = res.checkIn
  if (wrapRef.value) {
    wrapRef.value.scrollLeft = 0
    scrollLeft.value = 0
  }
  const payload = { startDate: res.checkIn, endDate: addDays(res.checkIn, effectiveConfig.value.visibleDays - 1) }
  emit('date-range-changed', payload)
  postFlutterMessage('date-range-changed', payload)
}

function searchNavPrev() {
  if (searchResults.value.length === 0) return
  searchNavIndex.value = (searchNavIndex.value - 1 + searchResults.value.length) % searchResults.value.length
  searchNavJump(searchResults.value, searchNavIndex.value)
}

function searchNavNext() {
  if (searchResults.value.length === 0) return
  searchNavIndex.value = (searchNavIndex.value + 1) % searchResults.value.length
  searchNavJump(searchResults.value, searchNavIndex.value)
}

function sortBySearch(rooms: Room[]): Room[] {
  if (!searchQuery.value.trim()) return rooms
  return rooms.filter(r => matchingRoomIds.value.has(r.id))
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

// ── Section availability (set externally via setAvailability()) ──────────────
const sectionAvailability = ref<Map<string, Map<string, number>>>(new Map())

function availClass(available: number, _total: number): string {
  return available > 0 ? 'avail-ok' : 'avail-none'
}

// ── Row drag-to-reorder (normal mode only) ────────────────────────────────────
const rowDragState = ref<{ roomId: string; fromIdx: number; toIdx: number } | null>(null)

function onRoomCellPointerdown(event: PointerEvent, roomId: string, roomIdx: number) {
  if (event.button !== 0 && event.pointerType !== 'touch') return
  if (filterCalendarType.value !== 'normal') return
  if (!filterAllowVerticalDrag.value) return
  if (dragState.value) return
  event.stopPropagation()
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)

  const startY = event.clientY
  const snapshotIds = displaySections.value[0]?.rooms.map(r => r.id) ?? []
  const totalRooms = snapshotIds.length
  rowDragState.value = { roomId, fromIdx: roomIdx, toIdx: roomIdx }

  function onPointermove(e: PointerEvent) {
    if (!rowDragState.value) return
    const delta = e.clientY - startY
    const newIdx = Math.max(0, Math.min(totalRooms - 1, roomIdx + Math.round(delta / 48)))
    rowDragState.value = { ...rowDragState.value, toIdx: newIdx }
  }

  function onPointerup() {
    document.removeEventListener('pointermove', onPointermove)
    document.removeEventListener('pointerup', onPointerup)
    const state = rowDragState.value
    rowDragState.value = null
    if (!state || state.fromIdx === state.toIdx) return
    const ids = [...snapshotIds]
    const [moved] = ids.splice(state.fromIdx, 1)
    ids.splice(state.toIdx, 0, moved)
    filterRoomOrder.value = ids
  }

  document.addEventListener('pointermove', onPointermove)
  document.addEventListener('pointerup', onPointerup)
}

function formatBalance(amount: number): string {
  if (amount === 0) return '0'
  return (amount > 0 ? '+' : '') + amount.toLocaleString('en-US')
}

// Currency display for tooltip totals (IDR). e.g. 6763000 → "Rp 6.763.000"
function formatMoney(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID')
}

// Map a Font Awesome icon_code (e.g. "b-fa b-fa-user") to a solid inline SVG.
// Path data is the official Font Awesome 6 Free Solid set; each icon keeps its
// own viewBox. Unknown codes fall back to the single user.
type AgentIconKey =
  | 'user' | 'users' | 'boat' | 'bed' | 'motorcycle'
  | 'plane-arrival' | 'plane-departure' | 'heart' | 'trash'
  | 'cake' | 'ban' | 'star' | 'clock' | 'lock'

const AGENT_ICONS: Record<AgentIconKey, { vb: string; d: string }> = {
  user:              { vb: '0 0 448 512', d: 'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z' },
  users:             { vb: '0 0 640 512', d: 'M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z' },
  boat:              { vb: '0 0 576 512', d: 'M192 32c0-17.7 14.3-32 32-32H352c17.7 0 32 14.3 32 32V64h48c26.5 0 48 21.5 48 48V240l44.4 14.8c23.1 7.7 29.5 37.5 11.5 53.9l-101 92.6c-16.2 9.4-34.7 15.1-50.9 15.1c-19.6 0-40.8-7.7-59.2-20.3c-22.1-15.5-51.6-15.5-73.7 0c-17.1 11.8-38 20.3-59.2 20.3c-16.2 0-34.7-5.7-50.9-15.1l-101-92.6c-18-16.5-11.6-46.2 11.5-53.9L96 240V112c0-26.5 21.5-48 48-48h48V32zM160 218.7l107.8-35.9c13.1-4.4 27.3-4.4 40.5 0L416 218.7V128H160v90.7zM306.5 421.9C329 437.4 356.5 448 384 448c26.9 0 55.4-10.8 77.4-26.1l0 0c11.9-8.5 28.1-7.8 39.2 1.7c14.4 11.9 32.5 21 50.6 25.2c17.2 4 27.9 21.2 23.9 38.4s-21.2 27.9-38.4 23.9c-24.5-5.7-44.9-16.5-58.2-25C449.5 501.7 417 512 384 512c-31.9 0-60.6-9.9-80.4-18.9c-5.8-2.7-11.1-5.3-15.6-7.7c-4.5 2.4-9.7 5.1-15.6 7.7c-19.8 9-48.5 18.9-80.4 18.9c-33 0-65.5-10.3-94.5-25.8c-13.4 8.4-33.7 19.3-58.2 25c-17.2 4-34.4-6.7-38.4-23.9s6.7-34.4 23.9-38.4c18.1-4.2 36.2-13.3 50.6-25.2c11.1-9.4 27.3-10.1 39.2-1.7l0 0C136.7 437.2 165.1 448 192 448c27.5 0 55-10.6 77.5-26.1c11.1-7.9 25.9-7.9 37 0z' },
  bed:               { vb: '0 0 640 512', d: 'M32 32c17.7 0 32 14.3 32 32V320H288V160c0-17.7 14.3-32 32-32H544c53 0 96 43 96 96V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V416H352 320 64v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V64C0 46.3 14.3 32 32 32zm144 96a80 80 0 1 1 0 160 80 80 0 1 1 0-160z' },
  motorcycle:        { vb: '0 0 640 512', d: 'M280 32c-13.3 0-24 10.7-24 24s10.7 24 24 24h57.7l16.4 30.3L256 192l-45.3-45.3c-12-12-28.3-18.7-45.3-18.7H64c-17.7 0-32 14.3-32 32v32h96c88.4 0 160 71.6 160 160c0 11-1.1 21.7-3.2 32h70.4c-2.1-10.3-3.2-21-3.2-32c0-52.2 25-98.6 63.7-127.8l15.4 28.6C402.4 276.3 384 312 384 352c0 70.7 57.3 128 128 128s128-57.3 128-128s-57.3-128-128-128c-13.5 0-26.5 2.1-38.7 6L418.2 128H480c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32H459.6c-7.5 0-14.7 2.6-20.5 7.4L391.7 78.9l-14-26c-7-12.9-20.5-21-35.2-21H280zM462.7 311.2l28.2 52.2c6.3 11.7 20.9 16 32.5 9.7s16-20.9 9.7-32.5l-28.2-52.2c2.3-.3 4.7-.4 7.1-.4c35.3 0 64 28.7 64 64s-28.7 64-64 64s-64-28.7-64-64c0-15.5 5.5-29.7 14.7-40.8zM187.3 376c-9.5 23.5-32.5 40-59.3 40c-35.3 0-64-28.7-64-64s28.7-64 64-64c26.9 0 49.9 16.5 59.3 40h66.4C242.5 268.8 190.5 224 128 224C57.3 224 0 281.3 0 352s57.3 128 128 128c62.5 0 114.5-44.8 125.8-104H187.3zM128 384a32 32 0 1 0 0-64 32 32 0 1 0 0 64z' },
  'plane-arrival':   { vb: '0 0 640 512', d: 'M.3 166.9L0 68C0 57.7 9.5 50.1 19.5 52.3l35.6 7.9c10.6 2.3 19.2 9.9 23 20L96 128l127.3 37.6L181.8 20.4C178.9 10.2 186.6 0 197.2 0h40.1c11.6 0 22.2 6.2 27.9 16.3l109 193.8 107.2 31.7c15.9 4.7 30.8 12.5 43.7 22.8l34.4 27.6c24 19.2 18.1 57.3-10.7 68.2c-41.2 15.6-86.2 18.1-128.8 7L121.7 289.8c-11.1-2.9-21.2-8.7-29.3-16.9L9.5 189.4c-5.9-6-9.3-14.1-9.3-22.5zM32 448H608c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32zm96-80a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm128-16a32 32 0 1 1 0 64 32 32 0 1 1 0-64z' },
  'plane-departure': { vb: '0 0 640 512', d: 'M381 114.9L186.1 41.8c-16.7-6.2-35.2-5.3-51.1 2.7L89.1 67.4C78 73 77.2 88.5 87.6 95.2l146.9 94.5L136 240 77.8 214.1c-8.7-3.9-18.8-3.7-27.3 .6L18.3 230.8c-9.3 4.7-11.8 16.8-5 24.7l73.1 85.3c6.1 7.1 15 11.2 24.3 11.2H248.4c5 0 9.9-1.2 14.3-3.4L535.6 212.2c46.5-23.3 82.5-63.3 100.8-112C645.9 75 627.2 48 600.2 48H542.8c-20.2 0-40.2 4.8-58.2 14L381 114.9zM0 480c0 17.7 14.3 32 32 32H608c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32z' },
  heart:             { vb: '0 0 512 512', d: 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z' },
  trash:             { vb: '0 0 448 512', d: 'M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z' },
  cake:              { vb: '0 0 448 512', d: 'M86.4 5.5L61.8 47.6C58 54.1 56 61.6 56 69.2V72c0 22.1 17.9 40 40 40s40-17.9 40-40V69.2c0-7.6-2-15-5.8-21.6L105.6 5.5C103.6 2.1 100 0 96 0s-7.6 2.1-9.6 5.5zm128 0L189.8 47.6c-3.8 6.5-5.8 14-5.8 21.6V72c0 22.1 17.9 40 40 40s40-17.9 40-40V69.2c0-7.6-2-15-5.8-21.6L233.6 5.5C231.6 2.1 228 0 224 0s-7.6 2.1-9.6 5.5zM317.8 47.6c-3.8 6.5-5.8 14-5.8 21.6V72c0 22.1 17.9 40 40 40s40-17.9 40-40V69.2c0-7.6-2-15-5.8-21.6L361.6 5.5C359.6 2.1 356 0 352 0s-7.6 2.1-9.6 5.5L317.8 47.6zM128 176c0-17.7-14.3-32-32-32s-32 14.3-32 32v48c-35.3 0-64 28.7-64 64v71c8.3 5.2 18.1 9 28.8 9c13.5 0 27.2-6.1 38.4-13.4c5.4-3.5 9.9-7.1 13-9.7c1.5-1.3 2.7-2.4 3.5-3.1c.4-.4 .7-.6 .8-.8l.1-.1 0 0 0 0s0 0 0 0s0 0 0 0c3.1-3.2 7.4-4.9 11.9-4.8s8.6 2.1 11.6 5.4l0 0 0 0 .1 .1c.1 .1 .4 .4 .7 .7c.7 .7 1.7 1.7 3.1 3c2.8 2.6 6.8 6.1 11.8 9.5c10.2 7.1 23 13.1 36.3 13.1s26.1-6 36.3-13.1c5-3.5 9-6.9 11.8-9.5c1.4-1.3 2.4-2.3 3.1-3c.3-.3 .6-.6 .7-.7l.1-.1c3-3.5 7.4-5.4 12-5.4s9 2 12 5.4l.1 .1c.1 .1 .4 .4 .7 .7c.7 .7 1.7 1.7 3.1 3c2.8 2.6 6.8 6.1 11.8 9.5c10.2 7.1 23 13.1 36.3 13.1s26.1-6 36.3-13.1c5-3.5 9-6.9 11.8-9.5c1.4-1.3 2.4-2.3 3.1-3c.3-.3 .6-.6 .7-.7l.1-.1c2.9-3.4 7.1-5.3 11.6-5.4s8.7 1.6 11.9 4.8l0 0 0 0 0 0 .1 .1c.2 .2 .4 .4 .8 .8c.8 .7 1.9 1.8 3.5 3.1c3.1 2.6 7.5 6.2 13 9.7c11.2 7.3 24.9 13.4 38.4 13.4c10.7 0 20.5-3.9 28.8-9V288c0-35.3-28.7-64-64-64V176c0-17.7-14.3-32-32-32s-32 14.3-32 32v48H256V176c0-17.7-14.3-32-32-32s-32 14.3-32 32v48H128V176zM448 394.6c-8.5 3.3-18.2 5.4-28.8 5.4c-22.5 0-42.4-9.9-55.8-18.6c-4.1-2.7-7.8-5.4-10.9-7.8c-2.8 2.4-6.1 5-9.8 7.5C329.8 390 310.6 400 288 400s-41.8-10-54.6-18.9c-3.5-2.4-6.7-4.9-9.4-7.2c-2.7 2.3-5.9 4.7-9.4 7.2C201.8 390 182.6 400 160 400s-41.8-10-54.6-18.9c-3.7-2.6-7-5.2-9.8-7.5c-3.1 2.4-6.8 5.1-10.9 7.8C71.2 390.1 51.3 400 28.8 400c-10.6 0-20.3-2.2-28.8-5.4V480c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V394.6z' },
  ban:               { vb: '0 0 512 512', d: 'M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z' },
  star:              { vb: '0 0 576 512', d: 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z' },
  clock:             { vb: '0 0 512 512', d: 'M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z' },
  lock:              { vb: '0 0 448 512', d: 'M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z' },
}

function agentIconKey(iconCode?: string): AgentIconKey {
  const c = (iconCode || '').toLowerCase()
  // Order matters: check specific/plural codes before generic singular ones.
  if (/users|user-group|user-friends|people|group/.test(c)) return 'users'
  if (/ship|boat|ferry|anchor|sailboat/.test(c))            return 'boat'
  if (/bed/.test(c))                                        return 'bed'
  if (/motorcycle|motorbike|\bmotor\b/.test(c))             return 'motorcycle'
  if (/plane-arrival|arrival|plane-landing/.test(c))        return 'plane-arrival'
  if (/plane-departure|departure|transfer|plane|jet/.test(c)) return 'plane-departure'
  if (/heart|honeymoon/.test(c))                            return 'heart'
  if (/trash|empty|delete/.test(c))                         return 'trash'
  if (/cake|birthday/.test(c))                              return 'cake'
  if (/ban|do-not|no-entry|prohibit/.test(c))              return 'ban'
  if (/star|vip/.test(c))                                   return 'star'
  if (/clock|late|time/.test(c))                            return 'clock'
  if (/lock/.test(c))                                       return 'lock'
  return 'user'
}

function agentIcon(iconCode?: string): { vb: string; d: string } {
  return AGENT_ICONS[agentIconKey(iconCode)]
}

const _MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${_MONTHS_SHORT[d.getMonth()]}`
}

function statusClass(status: string): string {
  return 'tt-st-' + status.toLowerCase().replace(/_/g, '-')
}

const localReservations = ref<Reservation[]>([...props.reservations])
watch(() => props.reservations, (val) => { localReservations.value = [...val] }, { deep: true })

const roomById = computed(() => {
  const map = new Map<string, Room>()
  for (const s of localSections.value)
    for (const r of s.rooms) map.set(r.id, r)
  return map
})

// Internal date override — set when filter search is applied so the calendar
// moves to the selected range without waiting for the parent to update the prop.
const filterStartDateOverride   = ref<string | null>(null)
const filterVisibleDaysOverride = ref<number | null>(null)
// Extra days appended by infinite scroll (resets when filter changes)
const infiniteExtraDays         = ref(0)
const isInfiniteLoading         = ref(false)
// True when the grid is scrolled to (or near) its right edge — gates the Load More button
const atScrollEnd               = ref(false)
// True while the host is updating data — shows the loading veil and blocks all interaction
const isCalendarLoading         = ref(false)
const DEFAULT_LOADING_TEXT      = 'Loading...'
const loadingText               = ref(DEFAULT_LOADING_TEXT)

const effectiveConfig = computed(() => ({
  ...props.config,
  startDate:   filterStartDateOverride.value  ?? props.config.startDate ?? todayIso,
  visibleDays: (filterVisibleDaysOverride.value ?? props.config.visibleDays) + infiniteExtraDays.value,
}))

// Which raw fields the adapter should read for timeline positioning. Configurable
// via config; defaults to the calendar_reservation_data_list shape (startDate/endDate).
const timelineKeyOpts = () => ({
  startKey: props.config.key_start_date_timeline_item_calendar,
  endKey:   props.config.key_end_date_timeline_item_calendar,
})


const { tooltipTarget, tooltipStyle, showTooltip, moveTooltip, hideTooltip } = useTooltip()

const { expandedSections, toggleSection } = useSections(localSections)
const { visibleDays, weekHeaders }         = useCalendarDays(effectiveConfig)
// Transient toast shown when a move is blocked by the app-date rule
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = ''; toastTimer = null }, 2800)
}

const { dragState, pendingMove, confirmMove, cancelMove, revertLastMove, onBlockPointerdown } = useDragDrop(
  localReservations,
  emit,
  effectiveConfig,
  filterAllowVerticalDrag,
  hideTooltip,
  () => showToast('This reservation can no longer be moved.'),
)
const { roomBlocks, roomTotalRows, wrapRef } = useBlockLayout(localReservations, effectiveConfig, DAY_COL_W, filterBlockStartMidnight)
const scrollLeft = ref(0)
let infiniteScrollTimer: ReturnType<typeof setTimeout> | null = null
function onScroll(e: Event) {
  const el = e.target as HTMLElement
  scrollLeft.value = el.scrollLeft
  // Keeping the booking label visible while scrolling is now handled purely by
  // CSS (`.booking-inner { position: sticky }`) — no per-block transform needed.
  // Reveal the Load More button only once the user has scrolled to the right edge
  atScrollEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - DAY_COL_W.value
}

// Load More: manually append 30 days when the user clicks the sticky button.
// Shows the spinner immediately, then appends after 1 s (kept from prior debounce).
function loadMoreDays() {
  if (isInfiniteLoading.value) return
  isInfiniteLoading.value = true
  if (infiniteScrollTimer) clearTimeout(infiniteScrollTimer)
  const snapStartDate = effectiveConfig.value.startDate
  const snapPrevTotal = (filterVisibleDaysOverride.value ?? props.config.visibleDays) + infiniteExtraDays.value
  infiniteScrollTimer = setTimeout(() => {
    infiniteExtraDays.value += 30
    const chunkStart = addDays(snapStartDate, snapPrevTotal)
    const chunkEnd   = addDays(snapStartDate, snapPrevTotal + 29)
    emit('infinite-scroll-load', { startDate: chunkStart, endDate: chunkEnd })
    isInfiniteLoading.value = false
    infiniteScrollTimer = null
    // New columns appended → grid is no longer at the right edge, hide the button
    atScrollEnd.value = false
  }, 1000)
}

// ── New reservation drag-to-create ──────────────────────────────────────────
const newResDrag    = ref<NewResDragState | null>(null)
const newResPopover = ref<NewResPopover | null>(null)

// First visible day index that may be used to create a reservation. Days whose
// ISO is before the hotel app date are locked (consistent with the drag-move
// rule), so the earliest allowed index is the first day on/after appDate.
const minCreateIdx = computed(() => {
  const appDate = effectiveConfig.value.appDate
  if (!appDate) return 0
  const days = visibleDays.value
  let i = 0
  while (i < days.length && days[i].iso < appDate) i++
  return i
})

const newResPreview = computed(() => {
  const d = newResDrag.value
  if (!d) return null
  const days = visibleDays.value
  // Clamp the left edge so the selection can't extend into locked past dates.
  const minIdx = Math.max(0, minCreateIdx.value, Math.min(d.startDayIdx, d.currentDayIdx))
  const maxIdx = Math.min(days.length - 1, Math.max(d.startDayIdx, d.currentDayIdx))
  // Whole selection lies in the locked range → nothing to create.
  if (maxIdx < minIdx) return null
  return {
    roomId:   d.roomId,
    roomName: d.roomName,
    roomTypeId:   d.roomTypeId,
    roomTypeName: d.roomTypeName,
    left:     minIdx * DAY_COL_W.value + (filterBlockStartMidnight.value ? 0 : DAY_COL_W.value / 2),
    width:    (maxIdx - minIdx + 1) * DAY_COL_W.value,
    checkIn:  days[minIdx].iso,
    checkOut: addDays(days[maxIdx].iso, 1),
  }
})

// Frozen preview kept alive while popover is open
const frozenPreview = ref<{ roomId: string; roomName: string; roomTypeId: string; roomTypeName: string; left: number; width: number; checkIn: string; checkOut: string } | null>(null)

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

const POPOVER_W = 220
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
const subMenuStyle = computed(() => {
  const p = newResPopover.value
  const preview = frozenPreview.value
  if (!p || !preview) return {}
  return {
    top:       (p.y - 8) + 'px',
    left:      (blockCenterX(preview) + POPOVER_W / 2 + 8) + 'px',
    transform: 'translateY(-100%)',
  }
})

function onCellPointerdown(event: PointerEvent, room: Room, dayIdx: number) {
  // On touch, skip drag-to-create so native scroll works freely
  if (event.pointerType === 'touch') return
  if (event.button !== 0) return
  if (dragState.value) return
  closePopover()
  event.preventDefault()

  const startClientX = event.clientX
  const section = localSections.value.find(s => s.rooms.some(r => r.id === room.id))
  newResDrag.value = {
    roomId: room.id, roomName: room.name,
    roomTypeId: section?.id ?? '', roomTypeName: section?.label ?? '',
    startDayIdx: dayIdx, currentDayIdx: dayIdx,
    startClientX,
    mouseX: event.clientX, mouseY: event.clientY,
    isActive: false,
  }

  let hasDragged = false

  function onPointermove(e: PointerEvent) {
    if (!newResDrag.value) return
    const totalDeltaPx = e.clientX - startClientX
    if (!hasDragged && Math.abs(totalDeltaPx) < 6) return
    hasDragged = true
    if (newResDrag.value) newResDrag.value.isActive = true
    const deltaIdx = Math.round(totalDeltaPx / DAY_COL_W.value)
    newResDrag.value.currentDayIdx = Math.max(0, Math.min(visibleDays.value.length - 1, dayIdx + deltaIdx))
  }

  function onPointerup() {
    document.removeEventListener('pointermove', onPointermove)
    document.removeEventListener('pointerup',   onPointerup)
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
        roomId:       preview.roomId,
        roomName:     preview.roomName,
        roomTypeId:   preview.roomTypeId,
        roomTypeName: preview.roomTypeName,
        checkIn:      preview.checkIn,
        checkOut:     preview.checkOut,
        showResSub: false,
      }
      requestAnimationFrame(() => {
        document.addEventListener('pointerdown', onOutsideClick)
      })
    }
    newResDrag.value = null
  }

  document.addEventListener('pointermove', onPointermove)
  document.addEventListener('pointerup',   onPointerup)
}

function onOutsideClick(e: PointerEvent) {
  const inside = e.composedPath().some((el) => {
    const cls = (el as HTMLElement).classList
    return cls?.contains('rc-create-popover') || cls?.contains('rc-res-submenu')
  })
  if (!inside) closePopover()
}

function closePopover() {
  newResPopover.value  = null
  frozenPreview.value  = null
  document.removeEventListener('pointerdown', onOutsideClick)
}

function selectType(type: 'room-plan' | 'single' | 'group') {
  const p = newResPopover.value
  if (!p) return
  const payload = { roomId: p.roomId, roomName: p.roomName, roomTypeId: p.roomTypeId, roomTypeName: p.roomTypeName, checkIn: p.checkIn, checkOut: p.checkOut, type }
  emit('new-reservation', payload)
  postFlutterMessage('new-reservation', payload)
  closePopover()
}

// ── Filter Search ─────────────────────────────────────────────────────────────
const filterSearchOpen   = ref(false)
const filterSearchActive = ref(false)

const filterSearch = reactive({
  startDate:        '',
  openAvailability: false,
})

// Date picker state
const dpHover = ref('')

function dpTodayParts() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() }
}
const dpYear  = ref(dpTodayParts().year)
const dpMonth = ref(dpTodayParts().month)

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dpMonthLabel = computed(() => `${MONTH_NAMES[dpMonth.value]} ${dpYear.value}`)

function dpPrevMonth() {
  if (dpMonth.value === 0) { dpMonth.value = 11; dpYear.value-- }
  else dpMonth.value--
}
function dpNextMonth() {
  if (dpMonth.value === 11) { dpMonth.value = 0; dpYear.value++ }
  else dpMonth.value++
}

const dpCells = computed(() => {
  const firstDay = new Date(dpYear.value, dpMonth.value, 1).getDay()
  const daysInMonth = new Date(dpYear.value, dpMonth.value + 1, 0).getDate()
  const cells: { key: string; iso: string; day: number }[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ key: `e${i}`, iso: '', day: 0 })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${dpYear.value}-${String(dpMonth.value + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ key: iso, iso, day: d })
  }
  return cells
})

function onDpDayClick(iso: string) {
  filterSearch.startDate = iso
}

function formatDpDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`
}

function openFilterSearch() {
  // Pre-fill with current calendar start date if nothing selected yet
  if (!filterSearch.startDate) filterSearch.startDate = effectiveConfig.value.startDate || todayIso
  const [y, m] = filterSearch.startDate.split('-').map(Number)
  dpYear.value  = y
  dpMonth.value = m - 1
  filterSearchOpen.value = true
}

function resetFilterSearch() {
  filterSearch.startDate        = ''
  filterSearch.openAvailability = false
  filterStartDateOverride.value   = null
  filterVisibleDaysOverride.value = null
  infiniteExtraDays.value         = 0
  filterSearchActive.value = false
  emit('filter-search', { startDate: '', openAvailability: false })
  postFlutterMessage('filter-search', { startDate: '', openAvailability: false })
  filterSearchOpen.value = false
}

function submitFilterSearch() {
  filterSearchActive.value = !!(filterSearch.startDate || filterSearch.openAvailability)
  const payload = {
    startDate:        filterSearch.startDate,
    openAvailability: filterSearch.openAvailability,
  }
  emit('filter-search', payload)
  postFlutterMessage('filter-search', payload)
  if (filterSearch.startDate) {
    filterStartDateOverride.value   = filterSearch.startDate
    filterVisibleDaysOverride.value = 30
    infiniteExtraDays.value         = 0
    const endDate = addDays(filterSearch.startDate, 29)
    const datePayload = { startDate: filterSearch.startDate, endDate: endDate }
    emit('date-range-changed', datePayload)
    postFlutterMessage('date-range-changed', datePayload)
  }
  filterSearchOpen.value = false
}

defineExpose({
  // Loading lock — call before updating data, then hideLoading() when done.
  // Blocks all calendar interaction (drag/click/scroll/buttons) while active.
  // Pass an optional message to vary the text per action (e.g.
  // showLoading('Saving reservation...')); omit it to fall back to the default.
  showLoading(text?: string) {
    loadingText.value = text ?? DEFAULT_LOADING_TEXT
    isCalendarLoading.value = true
  },
  hideLoading() {
    isCalendarLoading.value = false
  },
  // Register a deferred Save Configuration handler. When set, clicking
  // "Save Configuration" calls handler(config, event); the UI updates only
  // when event.commit() runs. Pass null to restore the immediate behaviour.
  setSaveConfigurationHandler(
    handler: ((config: Record<string, unknown>, event: { commit: () => void }) => void) | null,
  ) {
    saveConfigHandler.value = handler
  },
  goToDate(iso: string) {
    const payload = { startDate: iso, endDate: addDays(iso, props.config.visibleDays - 1) }
    emit('date-range-changed', payload)
    postFlutterMessage('date-range-changed', payload)
  },
  goToToday() {
    const payload = { startDate: todayIso, endDate: addDays(todayIso, props.config.visibleDays - 1) }
    emit('date-range-changed', payload)
    postFlutterMessage('date-range-changed', payload)
  },
  setData(chartingRooms: GuestProChartingRoom[]) {
    localSections.value = transformRoomCharting(chartingRooms)
  },
  setAvailability(data: { data: { room_type_id: string; availability: { date: string; available: number }[] }[] }) {
    const map = new Map<string, Map<string, number>>()
    for (const entry of data.data) {
      const dayMap = new Map<string, number>()
      for (const a of entry.availability) dayMap.set(a.date, a.available)
      map.set(entry.room_type_id, dayMap)
    }
    sectionAvailability.value = map
  },
  appendAvailability(data: { data: { room_type_id: string; availability: { date: string; available: number }[] }[] }) {
    // Merge incoming day counts into the existing map without dropping prior dates.
    const map = new Map(sectionAvailability.value)
    for (const entry of data.data) {
      const dayMap = new Map(map.get(entry.room_type_id) ?? [])
      for (const a of entry.availability) dayMap.set(a.date, a.available)
      map.set(entry.room_type_id, dayMap)
    }
    sectionAvailability.value = map
  },
  loadReservation(data: GuestProReservationItem[] | GuestProReservationResponse) {
    localReservations.value = transformReservations(data, timelineKeyOpts())
  },
  appendReservation(data: GuestProReservationItem[] | GuestProReservationResponse) {
    const incoming = transformReservations(data, timelineKeyOpts())
    const existingIds = new Set(localReservations.value.map(r => r.id))
    const toAdd = incoming.filter(r => !existingIds.has(r.id))
    if (toAdd.length) localReservations.value = [...localReservations.value, ...toAdd]
  },
  updateReservations(data: GuestProReservationItem[] | GuestProReservationResponse) {
    const incoming = transformReservations(data, timelineKeyOpts())
    const baseId = (id: string) => id.split(';')[0]
    const updated = [...localReservations.value]
    for (const next of incoming) {
      const idx = updated.findIndex(r => baseId(r.id) === baseId(next.id))
      if (idx !== -1) {
        updated[idx] = next
      } else {
        updated.push(next)
      }
    }
    localReservations.value = updated
  },
  revertLastMove() {
    revertLastMove()
  },
  search(query: string) {
    searchQuery.value = query
    searchActive.value = query.length > 0
  },
  setCalendarConfiguration(cfg: {
    calender_label?: string
    calender_type?: string
    calender_use_unallocated?: 0 | 1
    calender_total_balance?: 0 | 1
    show_bed_type_after_room_name?: 0 | 1
    calender_show_hover_tooltips?: string | 0 | 1
    calender_block_start_midnight?: 0 | 1
    calender_room_column?: number
    calender_room_type_column?: number
    background_color_reservation?: string
    background_color_tentative?: string
    background_color_inhouse?: string
    background_color_checkout?: string
    background_color_room_maintenance?: string
    foreground_color_reservation?: string
    foreground_color_tentative?: string
    foreground_color_inhouse?: string
    foreground_color_checkout?: string
    foreground_color_room_maintenance?: string
    [key: string]: unknown
  }) {
    if (cfg.calender_label                  !== undefined) calConfig.calender_label                  = cfg.calender_label as typeof calConfig.calender_label
    if (cfg.calender_type                   !== undefined) calConfig.calender_type                   = cfg.calender_type as typeof calConfig.calender_type
    if (cfg.calender_use_unallocated        !== undefined) calConfig.calender_use_unallocated        = cfg.calender_use_unallocated as 0 | 1
    if (cfg.calender_total_balance          !== undefined) calConfig.calender_total_balance          = cfg.calender_total_balance as 0 | 1
    if (cfg.show_bed_type_after_room_name   !== undefined) calConfig.show_bed_type_after_room_name   = cfg.show_bed_type_after_room_name as 0 | 1
    if (cfg.calender_show_hover_tooltips    !== undefined) calConfig.calender_show_hover_tooltips    = (cfg.calender_show_hover_tooltips == '1' || cfg.calender_show_hover_tooltips === 1) ? 1 : 0
    if (cfg.calender_block_start_midnight   !== undefined) calConfig.calender_block_start_midnight   = cfg.calender_block_start_midnight as 0 | 1
    if (cfg.calender_room_column            !== undefined) calConfig.calender_room_column            = cfg.calender_room_column
    if (cfg.calender_room_type_column       !== undefined) calConfig.calender_room_type_column       = cfg.calender_room_type_column
    if (cfg.background_color_reservation    !== undefined) calConfig.background_color_reservation    = cfg.background_color_reservation
    if (cfg.background_color_tentative      !== undefined) calConfig.background_color_tentative      = cfg.background_color_tentative
    if (cfg.background_color_inhouse        !== undefined) calConfig.background_color_inhouse        = cfg.background_color_inhouse
    if (cfg.background_color_checkout       !== undefined) calConfig.background_color_checkout       = cfg.background_color_checkout
    if (cfg.background_color_room_maintenance !== undefined) calConfig.background_color_room_maintenance = cfg.background_color_room_maintenance
    if (cfg.foreground_color_reservation    !== undefined) calConfig.foreground_color_reservation    = cfg.foreground_color_reservation
    if (cfg.foreground_color_tentative      !== undefined) calConfig.foreground_color_tentative      = cfg.foreground_color_tentative
    if (cfg.foreground_color_inhouse        !== undefined) calConfig.foreground_color_inhouse        = cfg.foreground_color_inhouse
    if (cfg.foreground_color_checkout       !== undefined) calConfig.foreground_color_checkout       = cfg.foreground_color_checkout
    if (cfg.foreground_color_room_maintenance !== undefined) calConfig.foreground_color_room_maintenance = cfg.foreground_color_room_maintenance
    applyCalConfig()
    commitColors()
  },
  setFilter(filter: CalendarFilter) {
    if (filter.roomColWidth          !== undefined) { filterRoomColW.value = filter.roomColWidth; resizedRoomColW.value = null }
    if (filter.showRoomStatus        !== undefined) filterShowRoomStatus.value       = filter.showRoomStatus
    if (filter.calendarType          !== undefined) filterCalendarType.value         = filter.calendarType
    if (filter.roomOrder             !== undefined) filterRoomOrder.value            = filter.roomOrder
    if (filter.showUnallocated       !== undefined) filterShowUnallocated.value      = filter.showUnallocated
    if (filter.showTotalBalance      !== undefined) filterShowTotalBalance.value     = filter.showTotalBalance
    if (filter.showBedName           !== undefined) filterShowBedName.value          = filter.showBedName
    if (filter.showReservationDetail !== undefined) filterShowReservationDetail.value = filter.showReservationDetail
    if (filter.calendarLabel         !== undefined) filterCalendarLabel.value        = filter.calendarLabel
    if (filter.allowVerticalDrag !== undefined) filterAllowVerticalDrag.value = filter.allowVerticalDrag
    if (filter.startDate !== undefined) {
      const end = filter.endDate ?? addDays(filter.startDate, props.config.visibleDays - 1)
      const payload = { startDate: filter.startDate, endDate: end }
      emit('date-range-changed', payload)
      postFlutterMessage('date-range-changed', payload)
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
.col-room--header { font-size: 14px; font-weight: 700; letter-spacing: 0.05em; z-index:20!important; }
.col-day  { width: 100px; min-width: 100px; }

.cal-table-positioner {
  position: relative;
  display: inline-block;
  min-width: 100%;
}

/* Load More — toolbar button shown only when scrolled to the right edge */
.rc-loadmore-btn {
  display: flex; align-items: center; gap: 7px;
  margin-left: auto;
  padding: 8px 14px;
  background: #eef5e1;
  border: 1.5px solid #cfe3a8;
  border-radius: 9px;
  font-size: 13px; font-weight: 600; color: #4f7a13;
  cursor: pointer; flex-shrink: 0; font-family: inherit;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s,
              transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}
.rc-loadmore-btn:disabled { cursor: default; opacity: 0.85; }
@media (hover: hover) and (pointer: fine) {
  .rc-loadmore-btn:not(:disabled):hover { background: #e4efce; border-color: #bcd98c; }
}
.rc-loadmore-btn:not(:disabled):active { transform: scale(0.97); }
.rc-loadmore-spinner { animation: inf-spin 0.7s linear infinite; }

/* Load More button enter/exit */
.loadmore-fade-enter-active { transition: opacity 0.16s ease-out, transform 0.16s cubic-bezier(0.23, 1, 0.32, 1); }
.loadmore-fade-leave-active { transition: opacity 0.12s ease-in, transform 0.12s ease-in; }
.loadmore-fade-enter-from   { opacity: 0; transform: translateX(6px) scale(0.95); }
.loadmore-fade-leave-to     { opacity: 0; transform: translateX(4px) scale(0.97); }

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
  z-index: 12;
  box-shadow: 1px 0 0 #e5e7eb, 4px 0 8px -2px rgba(0,0,0,0.06);
}
/* All thead cells stick to the top when scrolling down */
.cal-table thead tr:first-child th { position: sticky; top: 0;     z-index: 11; }
.cal-table thead tr:last-child  th { position: sticky; top: 26px;  z-index: 11; }
/* ROOM corner cell — sticky both horizontally and vertically, highest z-index */
.cal-table thead th:first-child    { z-index: 21; }

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
.week-header { text-align: center !important; }
.today-th {
  background: #f0fdf4 !important;
  color: #16a34a !important;
  font-weight: 600 !important;
}

.cal-table td {
  border-right: 2px solid #f3f4f6;
  border-bottom: 2px solid #f3f4f6;
  height: var(--row-h, 34px);
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
  padding: 0px 10px!important;
  vertical-align: middle !important;
  display: table-cell;
  background: #fff;
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
.section-row:hover .section-rest  { background: #efefef !important; }
.section-first {
  padding: 0 12px 0 14px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
  color: #6b7280 !important;
  background: #f5f5f5 !important;
  border-right: 1px solid #e5e7eb !important;
  vertical-align: middle !important;
  overflow: hidden !important;
  /* Keep this td as a table cell so `position: sticky` (first-column pin) works
     in Safari/Firefox — flex layout lives on .section-first-inner instead. Putting
     display:flex on the cell itself silently breaks sticky outside Chromium. */
}
.section-first-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-rest {
  background: #f5f5f5 !important;
  border-right: none !important;
  text-align: center !important;
  vertical-align: middle !important;
}
.avail-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  line-height: 20px;
}
.avail-ok   { color: #16a34a; }
.avail-none { color: #dc2626; }
.section-dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; margin-right: 7px;
  vertical-align: middle; flex-shrink: 0;
}
.section-chevron {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; flex-shrink: 0;
  color: #d1d5db;
  transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
  transform: rotate(-90deg);
}
.section-chevron.is-open { transform: rotate(0deg); }

/* Booking block */
.booking-block {
  position: absolute;
  top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
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
  opacity: 0.45;
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
  /* Horizontal sticky: pins the label just right of the sticky room column
     as the block scrolls left, auto-clamped to the block's own bounds. */
  position: sticky;
  left: calc(var(--rc-room-col-w, 170px) + 8px);
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  white-space: nowrap;
  pointer-events: none;
  color: var(--block-fg, #fff);
}
.b-left-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
}
.b-left-col > svg { opacity: 0.75; }
.b-texts { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
.b-name  { font-size: 12px; font-weight: 600; color: var(--block-fg, #fff); }
.b-folio { font-size: 11px;  color: var(--block-fg, #fff); opacity: 1; }
.b-paid  { font-size: 11px;  color: var(--block-fg, #fff); opacity: 1; }

/* Tooltip */
.rc-tooltip {
  position: fixed;
  z-index: 9999;
  min-width: 210px;
  max-width: 232px;
  background: #ffffff;
  border: 1px solid #ececf0;
  border-radius: 11px;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06);
  font-size: 12px;
  color: #555;
  line-height: 1.45;
  transform: translateY(-50%);
  transform-origin: left center;
  /* default accent — overridden per status below */
  --tt-accent: #1a1a1a;
}

/* Status accent colors (mirror booking-block status colors) */
.rc-tooltip.tt-st-definite         { --tt-accent: var(--rc-bg-reservation, #d97706); }
.rc-tooltip.tt-st-check-in         { --tt-accent: var(--rc-bg-inhouse, #16a34a); }
.rc-tooltip.tt-st-check-out        { --tt-accent: var(--rc-bg-checkout, #dc2626); }
.rc-tooltip.tt-st-booked           { --tt-accent: var(--rc-bg-tentative, #475569); }
.rc-tooltip.tt-st-room-maintenance { --tt-accent: var(--rc-bg-maintenance, #475569); }

/* Colored header band */
.tt-header {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 13px;
  background: #76b51b;
  color: #fff;
}
.tt-header svg { opacity: 0.85; flex-shrink: 0; }
.tt-guest {
  flex: 1; min-width: 0;
  font-size: 14px; font-weight: 700; letter-spacing: 0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tt-status {
  flex-shrink: 0;
  font-size: 9.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 2px 6px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.tt-body { padding: 10px 13px 11px; }
.tt-divider { height: 1px; background: #efeff2; margin: 9px 0; }
.tt-row { display: flex; align-items: center; gap: 7px; margin: 5px 0; }
.tt-icon { color: #9ca3af; flex-shrink: 0; }
.tt-val {
  color: #2a2a32; font-size: 12px; font-weight: 500;
  min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Stay block — two labeled columns with a centered connector + nights */
.tt-stay {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  row-gap: 4px; column-gap: 11px;
}
.tt-stay-label {
  font-size: 10px; font-weight: 500; color: #9ca3af;
}
.tt-stay-nights {
  font-size: 11.5px; font-weight: 700; color: #76b51b;
  text-align: center; white-space: nowrap;
}
.tt-l { text-align: left; }
.tt-r { text-align: right; }
.tt-stay-date {
  font-size: 12.5px; font-weight: 700; color: #1a1a1a;
  white-space: nowrap;
}
.tt-stay-conn {
  display: flex; align-items: center; min-width: 30px;
}
.tt-stay-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #76b51b; flex-shrink: 0;
}
.tt-stay-track {
  flex: 1; height: 2px; border-radius: 1px;
  background: #76b51b; opacity: 0.32;
}
.tt-stay-arrow {
  width: 0; height: 0; flex-shrink: 0;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
  border-left: 5px solid #76b51b;
}

.tt-payment { display: flex; align-items: center; gap: 9px; }
.tt-bar-track {
  flex: 1; height: 5px; background: #ededf0;
  border-radius: 3px; overflow: hidden;
}
.tt-bar-fill { height: 100%; background: #f59e0b; border-radius: 3px; transition: width 200ms cubic-bezier(0.23, 1, 0.32, 1); }
.tt-bar-fill.full { background: #16a34a; }
.tt-paid-txt { font-size: 11px; font-weight: 600; color: #f59e0b; white-space: nowrap; }
.tt-paid-txt.full { color: #16a34a; }

.tt-amounts { display: flex; flex-direction: column; gap: 4px; }
.tt-amount-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.tt-amount-label { font-size: 11px; color: #6b7280; }
.tt-amount-val { font-size: 11.5px; font-weight: 700; color: #111827; white-space: nowrap; }
.tt-amount-val.tt-amount-due { color: #dc2626; }

/* Enter/exit animation — fade + slight scale */
.tt-enter-active { transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1); }
.tt-leave-active { transition: opacity 100ms ease-in, transform 100ms ease-in; }
.tt-enter-from, .tt-leave-to { opacity: 0; transform: translateY(-50%) scale(0.96); }


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
  padding: 10px 8px 8px;
  display: flex; flex-direction: column; gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  animation: pop-fade 0.15s ease-out;
}
@keyframes pop-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Header */
.crp-header {
  display: flex; align-items: center; gap: 9px;
  padding: 0 2px 2px;
}
.crp-header-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: #eff6ff; color: #2563eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.crp-header-text { flex: 1; min-width: 0; }
.crp-title { font-size: 13px; font-weight: 700; color: #111827; }
.crp-dates {
  display: flex; align-items: center; gap: 3px;
  font-size: 10px; color: #9ca3af; margin-top: 2px;
  flex-wrap: wrap; line-height: 1.4;
}
.crp-dates svg { flex-shrink: 0; color: #d1d5db; }
.crp-nights-chip {
  display: inline-flex; align-items: center;
  padding: 0 5px; border-radius: 20px;
  background: #f3f4f6; color: #6b7280;
  font-size: 10px; font-weight: 600;
}
.crp-close {
  width: 24px; height: 24px; border-radius: 6px;
  background: none; border: none; color: #9ca3af;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.1s, color 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .crp-close:hover { background: #f3f4f6; color: #374151; }
}
.crp-close:active { transform: scale(0.9); }
.crp-divider { height: 1px; background: #f3f4f6; }

/* Card buttons */
.crp-card {
  display: flex; align-items: center; gap: 9px;
  width: 100%; border: none; border-radius: 10px;
  padding: 9px 10px;
  cursor: pointer; text-align: left;
  transition: background 0.1s, transform 0.1s;
}
.crp-card:active { transform: scale(0.97); }

/* Room Plan card */
.crp-card--plan { background: #eff6ff; }
@media (hover: hover) and (pointer: fine) {
  .crp-card--plan:hover { background: #dbeafe; }
}
.crp-card--plan .crp-card-icon { background: #bfdbfe; color: #2563eb; }
.crp-card--plan .crp-card-label { color: #1e3a8a; }
.crp-card--plan .crp-card-arrow { color: #93c5fd; }

/* Reservation card */
.crp-card--res { background: #16a34a; }
@media (hover: hover) and (pointer: fine) {
  .crp-card--res:hover { background: #15803d; }
}
.crp-card--res.is-active { background: #15803d; }
.crp-card--res .crp-card-icon { background: rgba(255,255,255,0.2); color: #fff; }
.crp-card--res .crp-card-label { color: #fff; }
.crp-card--res .crp-card-arrow { color: rgba(255,255,255,0.6); }

/* Shared card icon */
.crp-card-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.crp-card-label { flex: 1; font-size: 12px; font-weight: 600; color: #111827; }
.crp-card-arrow { flex-shrink: 0; color: #d1d5db; }

/* Right submenu */
.rc-res-submenu {
  position: fixed; z-index: 9999;
  width: 196px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  animation: pop-fade 0.12s ease-out;
}
.rsm-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 9px 10px;
  background: none; border: none; border-radius: 7px;
  cursor: pointer; text-align: left;
  font-size: 12px; font-weight: 500; color: #111827;
  transition: background 0.1s, transform 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .rsm-item:hover { background: #f9fafb; }
}
.rsm-item:active { background: #f3f4f6; transform: scale(0.97); }
.rsm-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: #f3f4f6; color: #374151;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rsm-label { flex: 1; }
.rsm-arrow { color: #d1d5db; flex-shrink: 0; }
.rsm-sep { height: 1px; background: #f3f4f6; margin: 2px 0; }

/* Scrollbar */
.cal-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
.cal-wrap::-webkit-scrollbar-track { background: #f9fafb; }
.cal-wrap::-webkit-scrollbar-track:horizontal { margin-left: var(--rc-room-col-w, 170px); }
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
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Loading lock — light veil (calendar stays visible) that intercepts all input */
.rc-loading-veil {
  position: absolute;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 90px;
  background: rgba(255, 255, 255, 0.4);
  cursor: progress;
}
.rc-loading-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
}
.rc-loading-spinner { color: #76b51b; animation: inf-spin 0.7s linear infinite; }
.rc-loading-fade-enter-active { transition: opacity 0.16s ease-out; }
.rc-loading-fade-leave-active { transition: opacity 0.14s ease-in; }
.rc-loading-fade-enter-from,
.rc-loading-fade-leave-to { opacity: 0; }

/* Transient toast */
.rc-toast {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9500;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  font-size: 12.5px;
  font-weight: 600;
}
.rc-toast svg { color: #fbbf24; flex-shrink: 0; }
.rc-toast-fade-enter-active { transition: opacity 0.18s ease-out, transform 0.18s cubic-bezier(0.23, 1, 0.32, 1); }
.rc-toast-fade-leave-active { transition: opacity 0.14s ease-in, transform 0.14s ease-in; }
.rc-toast-fade-enter-from,
.rc-toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* Load More spinner rotation */
@keyframes inf-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
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

.rc-search-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px 6px;
  white-space: nowrap;
}
.rc-search-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  padding: 0;
  transition: background 0.1s;
}
@media (hover: hover) and (pointer: fine) {
  .rc-search-nav-btn:hover:not(:disabled) { background: #e5e7eb; }
}
.rc-search-nav-btn:disabled { opacity: 0.3; cursor: default; }
.rc-search-nav-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  min-width: 36px;
  text-align: center;
}
.rc-search-nav-empty {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 2px;
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
  z-index: 5;
}
.booking-block.is-search-active {
  box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #f59e0b;
  z-index: 6;
  filter: brightness(1.08);
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

/* ── Touch / Mobile ─────────────────────────────────────────────────────────── */

/* Allow native two-finger scroll on the grid; individual draggable elements opt out below */
.cal-wrap { touch-action: pan-x pan-y; }

/* Booking blocks opt out of native scroll so pointer capture works during drag */
.booking-block { touch-action: none; }

/* Hide the mouse-only resize bar on touch devices */
@media (pointer: coarse) {
  .room-col-resize-bar { display: none; }
  .room-drag-handle { display: none; }

  /* Slightly larger tap targets for room rows */
  .cal-table td { height: var(--row-h, 34px); }
  .section-row td { height: 44px !important; }

  /* Toolbar: search field + config button on one row */
  .rc-search-bar { flex-wrap: wrap; gap: 8px; }
  .rc-search-field { flex: 1; min-width: 0; }
  .rc-config-btn { margin-left: 0; flex-shrink: 0; font-size: 12px; padding: 7px 10px; gap: 0; }
  .rc-config-btn-text { display: none; }

  /* Move dialog — full-width on small screens */
  .rc-confirm-dialog {
    width: calc(100vw - 24px);
    padding: 20px 16px 16px;
    border-radius: 14px;
  }

  /* Config dialog — full-height sheet on mobile */
  .rc-cfg-dialog {
    width: 100vw;
    max-width: 100vw;
    max-height: 92vh;
    border-radius: 18px 18px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
  }
  .rc-cfg-overlay { align-items: flex-end; }
}

/* Filter button */
.rc-filter-btn {
  display: flex; align-items: center; gap: 7px;
  position: relative;
  padding: 8px 14px;
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px; font-weight: 600; color: #374151;
  cursor: pointer; flex-shrink: 0; font-family: inherit;
  transition: background 0.12s, border-color 0.12s,
              transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
  white-space: nowrap;
  margin-left: auto;
}
@media (hover: hover) and (pointer: fine) {
  .rc-filter-btn:hover { background: #e5e7eb; border-color: #d1d5db; }
}
.rc-filter-btn:active { transform: scale(0.97); }
.rc-filter-btn.has-active { background: #f3fae8; border-color: #76b51b; color: #5e9016; }
.rc-filter-dot {
  position: absolute; top: 6px; right: 6px;
  width: 7px; height: 7px; border-radius: 50%;
  background: #76b51b; border: 1.5px solid #ffffff;
}

/* Override config button's margin-left since filter button now owns it */
.rc-config-btn { margin-left: 0; }

/* Filter dialog sizing */
.rc-fs-dialog { width: 380px; }
.rc-fs-header-icon { background: #76b51b; }
.rc-fs-body { padding: 0 !important; overflow: visible !important; }

/* Range bar — selected date display */
.rc-fs-range-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid #f3f4f6;
}
.rc-fs-range-bar--single { display: block; }
.rc-fs-range-slot {
  flex: 1; padding: 10px 14px; border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  cursor: pointer; background: #fafafa;
  transition: border-color 0.15s, background 0.15s;
}
.rc-fs-range-slot.is-active {
  border-color: #76b51b; background: #fff;
  box-shadow: 0 0 0 3px rgba(118,181,27,0.1);
}
.rc-fs-range-slot.is-filled { background: #fff; }
.rc-fs-range-label {
  font-size: 10px; font-weight: 600; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px;
}
.rc-fs-range-val { font-size: 13px; font-weight: 600; color: #111827; }
.rc-fs-range-slot:not(.is-filled) .rc-fs-range-val { color: #d1d5db; font-weight: 400; }

/* Calendar */
.rc-fs-cal { padding: 12px 20px 8px; }
.rc-fs-cal-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.rc-fs-cal-month { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
.rc-fs-cal-nav-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #6b7280;
  transition: background 0.1s, color 0.1s, transform 0.1s cubic-bezier(0.23,1,0.32,1);
}
@media (hover: hover) and (pointer: fine) {
  .rc-fs-cal-nav-btn:hover { background: #f3f4f6; color: #111827; }
}
.rc-fs-cal-nav-btn:active { transform: scale(0.9); }

.rc-fs-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.rc-fs-cal-wd {
  text-align: center; font-size: 10.5px; font-weight: 600;
  color: #9ca3af; padding: 4px 0 6px; letter-spacing: 0.02em;
}
.rc-fs-cal-day {
  position: relative;
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 8px;
  transition: background 0.1s;
}
.rc-fs-cal-day.is-empty { pointer-events: none; }
.rc-fs-cal-day-inner {
  font-size: 13px; font-weight: 500; color: #374151;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; position: relative; z-index: 1;
  transition: background 0.12s, color 0.12s;
}
@media (hover: hover) and (pointer: fine) {
  .rc-fs-cal-day:not(.is-start):not(.is-end):not(.is-disabled):hover .rc-fs-cal-day-inner {
    background: #f3f4f6; color: #111827;
  }
}
.rc-fs-cal-day.is-today .rc-fs-cal-day-inner::after {
  content: '';
  position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
  width: 4px; height: 4px; border-radius: 50%;
  background: #76b51b;
}
.rc-fs-cal-day.is-start .rc-fs-cal-day-inner,
.rc-fs-cal-day.is-end .rc-fs-cal-day-inner {
  background: #76b51b; color: #fff; font-weight: 700;
}
.rc-fs-cal-day.is-today.is-start .rc-fs-cal-day-inner::after,
.rc-fs-cal-day.is-today.is-end .rc-fs-cal-day-inner::after { background: rgba(255,255,255,0.6); }

/* Range highlight band (unused — kept for future use) */
.rc-fs-cal-day.is-range,
.rc-fs-cal-day.is-hover-range {
  background: #f3fae8; border-radius: 0;
}
.rc-fs-cal-day.is-range .rc-fs-cal-day-inner,
.rc-fs-cal-day.is-hover-range .rc-fs-cal-day-inner { color: #5e9016; font-weight: 600; }
.rc-fs-cal-day.is-range-start { border-radius: 8px 0 0 8px; background: #f3fae8; }
.rc-fs-cal-day.is-range-end   { border-radius: 0 8px 8px 0; background: #f3fae8; }

/* Disabled */
.rc-fs-cal-day.is-disabled { pointer-events: none; }
.rc-fs-cal-day.is-disabled .rc-fs-cal-day-inner { color: #e5e7eb; }

/* Open Availability row */
.rc-fs-avail-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 20px 16px;
  border-top: 1px solid #f3f4f6;
}
.rc-fs-avail-label { font-size: 13px; font-weight: 600; color: #374151; }
.rc-fs-avail-sub   { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* Search button */
.rc-fs-search-btn { display: flex; align-items: center; gap: 6px; background: #76b51b; }
@media (hover: hover) and (pointer: fine) {
  .rc-fs-search-btn:hover { background: #5e9016; }
}

@media (pointer: coarse) {
  .rc-filter-btn { margin-left: 0; font-size: 12px; padding: 7px 10px; gap: 0; }
  .rc-filter-btn-text { display: none; }
  .rc-fs-dialog { width: 100vw; max-width: 100vw; max-height: 92vh; border-radius: 18px 18px 0 0; position: fixed; bottom: 0; left: 0; }
  .rc-fs-cal-day-inner { width: 36px; height: 36px; }
}

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
