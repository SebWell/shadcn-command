<template>
  <div 
    :class="[
      'command-root',
      {
        'command-dialog': variant === 'dialog',
        'command-inline': variant !== 'dialog'
      },
      customClass
    ]"
    :style="customStyle"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <!-- Backdrop for dialog variant -->
    <div
      v-if="variant === 'dialog'"
      class="command-backdrop"
      @click="handleBackdropClick"
    />

    <!-- Command container -->
    <div
      :class="[
        'command-container',
        {
          'command-container-dialog': variant === 'dialog',
          'command-container-inline': variant !== 'dialog'
        }
      ]"
    >
      <!-- Header with search -->
      <div class="command-header" cmdk-input-wrapper="">
        <svg
          class="command-search-icon"
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
          class="command-input"
          :placeholder="placeholder || 'Type a command or search...'"
          @input="handleSearch"
          @keydown="handleSearchKeyDown"
        />
      </div>

      <!-- Command list -->
      <div class="command-list-container">
        <div class="command-list-padding">
          <!-- Empty state -->
          <div
            v-if="filteredGroups.length === 0"
            class="command-empty"
          >
            {{ emptyMessage || 'No results found.' }}
          </div>

          <!-- Command groups -->
          <div
            v-for="(group, groupIndex) in filteredGroups"
            :key="group.id || groupIndex"
            class="command-group"
          >
            <!-- Group heading -->
            <div
              v-if="group.heading"
              class="command-group-heading"
            >
              {{ group.heading }}
            </div>

            <!-- Group items -->
            <div class="command-items">
              <button
                v-for="(item, itemIndex) in group.items"
                :key="item.id || itemIndex"
                :class="[
                  'command-item',
                  {
                    'command-item-selected': selectedIndex === getGlobalIndex(groupIndex, itemIndex),
                    'command-item-disabled': item.disabled
                  }
                ]"
                @click="executeCommand(item, groupIndex, itemIndex)"
                :disabled="item.disabled"
                role="option"
                :aria-selected="selectedIndex === getGlobalIndex(groupIndex, itemIndex)"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="command-item-icon"
                />
                <span class="command-item-label">{{ item.label }}</span>
                <span v-if="item.shortcut" class="command-item-shortcut">
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
  data() {
    return {
      searchTerm: '',
      selectedIndex: 0
    }
  },
  computed: {
    filteredGroups() {
      if (!this.searchTerm.trim()) {
        return this.groups || []
      }

      const term = this.searchTerm.toLowerCase()
      return (this.groups || []).map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.label.toLowerCase().includes(term) ||
          (item.keywords && item.keywords.some(keyword => 
            keyword.toLowerCase().includes(term)
          ))
        )
      })).filter(group => group.items.length > 0)
    },

    totalItems() {
      return this.filteredGroups.reduce((total, group) => total + group.items.length, 0)
    }
  },
  watch: {
    open(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.$refs.searchInput?.focus()
        })
      }
    }
  },
  mounted() {
    if (this.open || this.variant !== 'dialog') {
      this.$nextTick(() => {
        this.$refs.searchInput?.focus()
      })
    }
  },
  methods: {

    getGlobalIndex(groupIndex, itemIndex) {
      let globalIndex = 0
      for (let i = 0; i < groupIndex; i++) {
        globalIndex += this.filteredGroups[i].items.length
      }
      return globalIndex + itemIndex
    },

    getItemFromGlobalIndex(globalIndex) {
      let currentIndex = 0
      for (let groupIndex = 0; groupIndex < this.filteredGroups.length; groupIndex++) {
        const group = this.filteredGroups[groupIndex]
        if (globalIndex < currentIndex + group.items.length) {
          const itemIndex = globalIndex - currentIndex
          return { group, item: group.items[itemIndex], groupIndex, itemIndex }
        }
        currentIndex += group.items.length
      }
      return null
    },

    executeCommand(item, groupIndex, itemIndex) {
      if (item.disabled) return

      this.$emit('command-execute', {
        item,
        group: this.filteredGroups[groupIndex],
        groupIndex,
        itemIndex,
        searchTerm: this.searchTerm
      })

      if (this.variant === 'dialog') {
        this.$emit('close')
      }
    },

    handleSearch() {
      this.selectedIndex = 0
      this.$emit('search', {
        term: this.searchTerm,
        results: this.filteredGroups
      })
    },

    handleSearchKeyDown(event) {
      // Let parent handle these keys
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault()
        this.handleKeyDown(event)
      }
    },

    handleKeyDown(event) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.totalItems - 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
          break
        case 'Enter':
          event.preventDefault()
          if (this.totalItems > 0) {
            const result = this.getItemFromGlobalIndex(this.selectedIndex)
            if (result) {
              this.executeCommand(result.item, result.groupIndex, result.itemIndex)
            }
          }
          break
        case 'Escape':
          event.preventDefault()
          if (this.variant === 'dialog') {
            this.$emit('close')
          }
          break
        case 'Home':
          event.preventDefault()
          this.selectedIndex = 0
          break
        case 'End':
          event.preventDefault()
          this.selectedIndex = this.totalItems - 1
          break
      }
    },

    handleBackdropClick() {
      if (this.closeOnBackdrop !== false) {
        this.$emit('close')
      }
    }
  }
}
</script>

<style scoped>
/* Shadcn UI CSS Variables */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 98%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --ring: 212.7 26.8% 83.9%;
}

/* Command root styles */
.command-root {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: calc(var(--radius) - 2px);
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}

.command-dialog {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.command-inline {
  position: relative;
}

/* Backdrop styles */
.command-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: hsl(var(--background) / 0.8);
  backdrop-filter: blur(2px);
}

/* Container styles */
.command-container {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: calc(var(--radius) - 2px);
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border));
}

.command-container-dialog {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 50;
  max-height: 85vh;
  width: 100%;
  max-width: 450px;
  transform: translate(-50%, -50%);
  animation: command-fade-in 0.3s ease-out, command-zoom-in 0.3s ease-out;
}

.command-container-inline {
  position: relative;
}

/* Header styles */
.command-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid hsl(var(--border));
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.command-search-icon {
  margin-right: 0.5rem;
  height: 1rem;
  width: 1rem;
  flex-shrink: 0;
  opacity: 0.5;
}

.command-input {
  display: flex;
  height: 2.75rem;
  width: 100%;
  border-radius: calc(var(--radius) - 2px);
  background-color: transparent;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  border: none;
  color: hsl(var(--popover-foreground));
}

.command-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.command-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* List container styles */
.command-list-container {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.command-list-padding {
  padding: 0.25rem;
}

/* Empty state styles */
.command-empty {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

/* Group styles */
.command-group {
  overflow: hidden;
}

.command-group-heading {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

/* Items container */
.command-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Item styles */
.command-item {
  position: relative;
  display: flex;
  width: 100%;
  cursor: default;
  user-select: none;
  align-items: center;
  border-radius: calc(var(--radius) - 4px);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.15s ease;
  background: none;
  border: none;
  text-align: left;
  color: hsl(var(--popover-foreground));
}

.command-item:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.command-item-selected {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.command-item-disabled {
  pointer-events: none;
  opacity: 0.5;
}

.command-item-icon {
  margin-right: 0.5rem;
  height: 1rem;
  width: 1rem;
  flex-shrink: 0;
}

.command-item-label {
  flex: 1;
  text-align: left;
}

.command-item-shortcut {
  margin-left: auto;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

/* Animations */
@keyframes command-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes command-zoom-in {
  from {
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Scrollbar styling */
.command-list-container::-webkit-scrollbar {
  width: 6px;
}

.command-list-container::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

.command-list-container::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.command-list-container::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style> 