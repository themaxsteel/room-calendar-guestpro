import { ref, computed } from 'vue'
import type { BlockLayout, Room } from '../types'

export interface TooltipTarget {
  block: BlockLayout
  room: Room
}

const TOOLTIP_WIDTH = 224

export function useTooltip() {
  const target = ref<TooltipTarget | null>(null)
  const x = ref(0)
  const y = ref(0)

  const tooltipStyle = computed(() => {
    const flipX = x.value + 20 + TOOLTIP_WIDTH > window.innerWidth
    return {
      left:      flipX ? x.value - 16 - TOOLTIP_WIDTH + 'px' : x.value + 16 + 'px',
      top:       y.value + 'px',
      transform: 'translateY(-50%)',
    }
  })

  function showTooltip(e: MouseEvent, block: BlockLayout, room: Room) {
    target.value = { block, room }
    x.value = e.clientX
    y.value = e.clientY
  }

  function moveTooltip(e: MouseEvent) {
    if (!target.value) return
    x.value = e.clientX
    y.value = e.clientY
  }

  function hideTooltip() {
    target.value = null
  }

  return { tooltipTarget: target, tooltipStyle, showTooltip, moveTooltip, hideTooltip }
}
