<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      @click.self="close"
    >
      <div
        class="relative w-full max-w-md bg-[#0a0a0a] border border-[#ff0040]/50 rounded-lg shadow-[0_0_40px_rgba(255,0,64,0.15)] overflow-hidden"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#ff0040]/20 bg-[#ff0040]/5">
          <div class="flex items-center gap-3">
            <div class="h-7 w-7 rounded-md border border-[#ff0040]/60 bg-[#450a0a]/60 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-[#ff0040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-[#ff0040] font-mono text-sm tracking-wider uppercase">
                危险操作警告
              </h3>
            </div>
          </div>
          <button
            type="button"
            @click="close"
            class="text-[#fca5a5] hover:text-[#ff0040] transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-5 space-y-4 bg-[#0a0a0a]">
          <div>
            <div class="text-[10px] text-[#666666] font-mono uppercase tracking-wider mb-2">
              目标会话
            </div>
            <div class="bg-[#111111] border border-[#222222] px-3 py-2.5 font-mono text-sm text-[#00ff41] rounded-md">
              {{ sessionTitle || '未命名会话' }}
            </div>
          </div>

          <div class="flex items-start gap-2 text-xs font-mono">
            <span class="text-[#ff0040]">[WARNING]</span>
            <span class="text-[#e5e7eb]">此操作将永久删除该会话及其所有通信记录，数据不可恢复。</span>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="px-5 py-3 border-t border-[#ff0040]/20 bg-[#0a0a0a]/95 flex justify-end gap-3">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-xs text-[#e5e7eb] hover:text-white transition-colors font-mono uppercase tracking-wider border border-transparent hover:border-[#4b5563] rounded-md"
          >
            [ 取消 ]
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="loading"
            class="px-5 py-2 text-xs font-mono uppercase tracking-wider rounded-md border transition-all flex items-center justify-center gap-2"
            :class="loading
              ? 'bg-[#b91c1c]/10 border-[#ff0040]/50 text-[#fecaca]/70 cursor-not-allowed'
              : 'bg-[#b91c1c]/30 border-[#ff0040]/70 text-[#fee2e2] hover:bg-[#dc2626]/50 hover:border-[#fee2e2]'"
          >
            <span v-if="loading" class="animate-pulse">[ 处理中... ]</span>
            <span v-else>[ 确认删除 ]</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  sessionTitle?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const close = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  if (props.loading) return
  emit('confirm')
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

