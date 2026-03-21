<template>
  <!-- 聊天面板头部 -->
  <div class="p-4 border-b border-[#333333] flex items-center justify-between bg-[#111111]/50">
    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="exitLocked"
        @click="$emit('exit')"
        class="text-[#555555] hover:text-[#ff0040] transition-colors text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#555555]"
      >
        ← 返回
      </button>
      <span class="text-[#333333]">|</span>
      <div>
        <h3 class="text-[#00ff41] font-mono">{{ currentSessionTitle }}</h3>
        <p class="text-xs text-[#555555]">{{ currentSessionNpc }}</p>
      </div>
    </div>
    <!-- 好感度显示 -->
    <div v-if="favorability !== null" class="flex items-center gap-4 text-sm font-mono">
      <div class="flex items-center gap-2">
        <span class="text-[#888888]">好感度:</span>
        <span class="text-[#00ff41]">{{ favorability }}</span>
        <!-- 好感度变化飘字 -->
        <Transition name="float">
          <span
            v-if="showFavorChange"
            class="text-sm font-bold"
            :class="favorChangeValue > 0 ? 'text-[#00ff41]' : 'text-[#ff0040]'"
          >
            {{ favorChangeValue > 0 ? '+' : '' }}{{ favorChangeValue }}
          </span>
        </Transition>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#888888]">关系:</span>
        <span class="text-[#00ffff]">{{ relationshipLevel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    currentSessionTitle: string
    currentSessionNpc: string
    favorability: number | null
    relationshipLevel: string
    showFavorChange: boolean
    favorChangeValue: number
    /** 流式回复进行中：禁止返回会话列表 */
    exitLocked?: boolean
  }>(),
  { exitLocked: false }
)

defineEmits<{
  (e: 'exit'): void
}>()
</script>

