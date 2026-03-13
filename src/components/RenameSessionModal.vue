<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <div
        class="relative w-full max-w-md bg-[#0a0a0a] border border-[#333333] rounded-lg shadow-[0_0_40px_rgba(0,255,65,0.1)] overflow-hidden"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#111111]">
          <div class="flex items-center gap-3">
            <svg class="w-4 h-4 text-[#00ff41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 class="text-[#00ff41] font-mono text-sm tracking-wider uppercase">
              修改会话标识
            </h3>
          </div>
          <button
            type="button"
            @click="close"
            class="text-[#444444] hover:text-[#00ff41] transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-5 space-y-4 bg-[#0a0a0a]">
          <div>
            <label class="block text-[10px] text-[#666666] font-mono uppercase tracking-wider mb-2">
              新标识符
            </label>
            <input
              v-model="localTitle"
              maxlength="35"
              type="text"
              placeholder="输入新的会话标题..."
              class="w-full bg-[#111111] text-[#00ff41] border border-[#333333] px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#333333]"
              @keyup.enter="handleConfirm"
            />
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="px-5 py-3 border-t border-[#333333] bg-[#111111]/50 flex justify-end gap-3">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-xs text-[#666666] hover:text-[#aaaaaa] transition-colors font-mono uppercase tracking-wider border border-transparent hover:border-[#333333]"
          >
            [ 取消 ]
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="!localTitle.trim() || loading"
            class="px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41]/50 text-[#00ff41] hover:bg-[#00ff41]/20 hover:border-[#00ff41] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none text-xs font-mono uppercase tracking-wider"
          >
            {{ loading ? '[ 处理中... ]' : '[ 确认 ]' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  initialTitle: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', value: string): void
}>()

const localTitle = ref(props.initialTitle ?? '')

watch(
  () => props.initialTitle,
  (val) => {
    if (props.modelValue) {
      localTitle.value = val ?? ''
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      localTitle.value = props.initialTitle ?? ''
    }
  }
)

const close = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  const value = localTitle.value.trim()
  if (!value || props.loading) return
  emit('confirm', value)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

