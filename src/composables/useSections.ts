import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { RoomSection } from '../types'

export function useSections(sections: Ref<RoomSection[]>) {
  const expandedSections = ref<Record<string, boolean>>({})

  watch(sections, (val) => {
    for (const s of val) {
      if (!(s.id in expandedSections.value)) {
        expandedSections.value[s.id] = true
      }
    }
  }, { immediate: true })

  function toggleSection(sectionId: string) {
    expandedSections.value[sectionId] = !expandedSections.value[sectionId]
  }

  return { expandedSections, toggleSection }
}
