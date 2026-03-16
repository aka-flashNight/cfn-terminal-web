<template>
  <!-- 左侧边栏：会话列表 -->
  <aside class="w-[250px] flex-shrink-0 bg-[#111111] border-r border-[#333333] flex flex-col">
    <!-- 顶部：会话列表标题 -->
    <div class="p-4 border-b border-[#333333]">
      <h2 class="text-sm font-bold text-[#00ff41] uppercase tracking-wider flex items-center gap-2">
        <span class="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse"></span>
        会话列表
      </h2>
    </div>

    <!-- 中间：会话列表区域 -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- 加载中 -->
      <div v-if="loadingSessions" class="text-[#555555] text-sm text-center py-4">
        加载中...
      </div>
      <!-- 空状态 -->
      <div v-else-if="sessions.length === 0" class="text-[#555555] text-sm italic text-center py-4">
        暂无会话
      </div>
      <!-- 会话列表 -->
      <div v-else class="space-y-1">
        <div
          v-for="session in sessions"
          :key="session.session_id"
          class="group relative"
        >
          <button
            @click="onSelectSession(session.session_id)"
            class="w-full text-left p-3 rounded border transition-all pr-8"
            :class="currentSessionId === session.session_id
              ? 'bg-[#00ff41]/10 border-[#00ff41]/50 text-[#00ff41]'
              : 'bg-[#1a1a1a] border-transparent text-gray-400 hover:bg-[#252525] hover:text-[#00ff41]'"
          >
            <div class="text-sm font-medium truncate">{{ session.title }}</div>
            <div class="text-xs text-[#555555] mt-1">{{ session.npc_name }}</div>
          </button>
          <!-- 操作菜单按钮 (悬停显示) -->
          <div
            class="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              @click.stop="onOpenSessionMenu(session, $event)"
              class="p-1.5 text-[#444444] hover:text-[#00ff41] hover:bg-[#00ff41]/10 rounded transition-all duration-150 ease-out"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：设置按钮 -->
    <div class="p-4 border-t border-[#333333]">
      <button
        @click="$emit('open-settings')"
        class="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#00ff41] rounded flex items-center justify-center gap-2 transition-all duration-200 group"
      >
        <span class="text-lg group-hover:rotate-45 transition-transform duration-300">⚙️</span>
        <span class="text-sm font-medium text-gray-400 group-hover:text-[#00ff41]">设置</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Session } from '../api/game'

const props = defineProps<{
  sessions: Session[]
  currentSessionId: string
  loadingSessions: boolean
  selectSession: (sessionId: string) => void
  openSessionMenu: (session: Session, event: MouseEvent) => void
}>()

defineEmits<{
  (e: 'open-settings'): void
}>()

const onSelectSession = (sessionId: string) => {
  props.selectSession(sessionId)
}

const onOpenSessionMenu = (session: Session, event: MouseEvent) => {
  props.openSessionMenu(session, event)
}
</script>

