<template>
  <div 
    :class="cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      content.variant === 'dialog' ? 'fixed inset-0 z-50' : '',
      content.customClass
    )"
    :style="content.customStyle"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <!-- Backdrop for dialog variant -->
    <div
      v-if="content.variant === 'dialog'"
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      @click="handleBackdropClick"
    />

    <!-- Command container -->
    <div
      :class="cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground border',
        content.variant === 'dialog' ? 'fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-[450px] translate-x-[-50%] translate-y-[-50%] animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]' : ''
      )"
    >
      <!-- Header with search -->
      <div class="flex items-center border-b px-3" cmdk-input-wrapper="">
        <svg
          class="mr-2 h-4 w-4 shrink-0 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="21 21l-4.35-4.35"/>
        </svg>
        <input
          ref="searchInput"
          v-model="searchTerm"
          :class="cn(
            'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
          )"
          :placeholder="content.placeholder || 'Type a command or search...'"
          @input="handleSearch"
          @keydown="handleSearchKeyDown"
        />
      </div>

      <!-- Command list -->
      <div class="max-h-[300px] overflow-y-auto overflow-x-hidden">
        <div class="p-1">
          <!-- Empty state -->
          <div
            v-if="filteredGroups.length === 0"
            class="py-6 text-center text-sm text-muted-foreground"
          >
            {{ content.emptyMessage || 'No results found.' }}
          </div>

          <!-- Command groups -->
          <div
            v-for="(group, groupIndex) in filteredGroups"
            :key="group.id || groupIndex"
            class="overflow-hidden"
          >
            <!-- Group heading -->
            <div
              v-if="group.heading"
              class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {{ group.heading }}
            </div>

            <!-- Group items -->
            <div class="space-y-1">
              <button
                v-for="(item, itemIndex) in group.items"
                :key="item.id || itemIndex"
                :class="cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedIndex === getGlobalIndex(groupIndex, itemIndex) ? 'bg-accent text-accent-foreground' : '',
                  item.disabled ? 'pointer-events-none opacity-50' : ''
                )"
                @click="executeCommand(item, groupIndex, itemIndex)"
                :disabled="item.disabled"
                role="option"
                :aria-selected="selectedIndex === getGlobalIndex(groupIndex, itemIndex)"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="mr-2 h-4 w-4"
                />
                <span class="flex-1 text-left">{{ item.label }}</span>
                <span v-if="item.shortcut" class="ml-auto text-xs tracking-widest opacity-60">
                  {{ item.shortcut }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

export default {
  props: {
    content: {
      type: Object,
      default: () => ({})
    },
    open: {
      type: Boolean,
      default: false
    }
  },
  emits: ['command-execute', 'close', 'search'],
  setup(props, { emit }) {
    // Import utility function
    const cn = (...inputs) => {
      return inputs.filter(Boolean).join(' ')
    }

    const searchInput = ref(null)
    const searchTerm = ref('')
    const selectedIndex = ref(0)

    const filteredGroups = computed(() => {
      if (!searchTerm.value.trim()) {
        return props.content.groups || []
      }

      const term = searchTerm.value.toLowerCase()
      return (props.content.groups || []).map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.label.toLowerCase().includes(term) ||
          (item.keywords && item.keywords.some(keyword => 
            keyword.toLowerCase().includes(term)
          ))
        )
      })).filter(group => group.items.length > 0)
    })

    const totalItems = computed(() => {
      return filteredGroups.value.reduce((total, group) => total + group.items.length, 0)
    })

    const getGlobalIndex = (groupIndex, itemIndex) => {
      let globalIndex = 0
      for (let i = 0; i < groupIndex; i++) {
        globalIndex += filteredGroups.value[i].items.length
      }
      return globalIndex + itemIndex
    }

    const getItemFromGlobalIndex = (globalIndex) => {
      let currentIndex = 0
      for (let groupIndex = 0; groupIndex < filteredGroups.value.length; groupIndex++) {
        const group = filteredGroups.value[groupIndex]
        if (globalIndex < currentIndex + group.items.length) {
          const itemIndex = globalIndex - currentIndex
          return { group, item: group.items[itemIndex], groupIndex, itemIndex }
        }
        currentIndex += group.items.length
      }
      return null
    }

    const executeCommand = (item, groupIndex, itemIndex) => {
      if (item.disabled) return

      emit('command-execute', {
        item,
        group: filteredGroups.value[groupIndex],
        groupIndex,
        itemIndex,
        searchTerm: searchTerm.value
      })

      if (props.content.variant === 'dialog') {
        emit('close')
      }
    }

    const handleSearch = () => {
      selectedIndex.value = 0
      emit('search', {
        term: searchTerm.value,
        results: filteredGroups.value
      })
    }

    const handleSearchKeyDown = (event) => {
      // Let parent handle these keys
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault()
        handleKeyDown(event)
      }
    }

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems.value - 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
          break
        case 'Enter':
          event.preventDefault()
          if (totalItems.value > 0) {
            const result = getItemFromGlobalIndex(selectedIndex.value)
            if (result) {
              executeCommand(result.item, result.groupIndex, result.itemIndex)
            }
          }
          break
        case 'Escape':
          event.preventDefault()
          if (props.content.variant === 'dialog') {
            emit('close')
          }
          break
        case 'Home':
          event.preventDefault()
          selectedIndex.value = 0
          break
        case 'End':
          event.preventDefault()
          selectedIndex.value = totalItems.value - 1
          break
      }
    }

    const handleBackdropClick = () => {
      if (props.content.closeOnBackdrop !== false) {
        emit('close')
      }
    }

    // Focus search input when component mounts or opens
    onMounted(() => {
      if (props.open || props.content.variant !== 'dialog') {
        nextTick(() => {
          searchInput.value?.focus()
        })
      }
    })

    // Watch for open prop changes
    const unwatchOpen = computed(() => props.open)
    unwatchOpen.effect(() => {
      if (props.open) {
        nextTick(() => {
          searchInput.value?.focus()
        })
      }
    })

    return {
      cn,
      searchInput,
      searchTerm,
      selectedIndex,
      filteredGroups,
      totalItems,
      getGlobalIndex,
      getItemFromGlobalIndex,
      executeCommand,
      handleSearch,
      handleSearchKeyDown,
      handleKeyDown,
      handleBackdropClick
    }
  }
}
</script>

<style>
/* Import global shadcn/ui styles */
@import './globals.css';
</style> 