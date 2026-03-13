<template>
  <Teleport to="body">
    <div
      v-if="modelValue && position"
      class="fixed inset-0 z-50"
      @click="handleOverlayClick"
    >
      <div
        class="absolute min-w-[140px] rounded bg-[#0a0a0a] border border-[#444444] shadow-[0_0_20px_rgba(0,0,0,0.8)] py-0"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @click.stop
      >
        <button
          type="button"
          @click="handleRename"
          class="w-full px-3 py-2.5 text-left text-sm text-gray-400 hover:bg-[#00ff41]/10 hover:text-[#00ff41] transition-all duration-150 flex items-center gap-3 group"
        >
          <svg
            class="w-4 h-4 text-[#555555] group-hover:text-[#00ff41] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span class="font-mono text-xs tracking-wide">重命名</span>
        </button>
        <div class="h-px bg-[#222222] mx-3"></div>
        <button
          type="button"
          @click="handleDelete"
          class="w-full px-3 py-2.5 text-left text-sm text-gray-400 hover:bg-[#ff0040]/10 hover:text-[#ff0040] transition-all duration-150 flex items-center gap-3 group"
        >
          <svg
            class="w-4 h-4 text-[#555555] group-hover:text-[#ff0040] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span class="font-mono text-xs tracking-wide">删除</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Session } from '../api/game'

const props = defineProps<{
  modelValue: boolean
  session: Session | null
  position: { x: number; y: number } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'rename'): void
  (e: 'delete'): void
}>()

const handleOverlayClick = () => {
  emit('update:modelValue', false)
}

const handleRename = () => {
  emit('rename')
  emit('update:modelValue', false)
}

const handleDelete = () => {
  emit('delete')
  emit('update:modelValue', false)
}
</script>

<style scoped>
</style>

