<template>
  <!-- 默认视图：NPC 候选列表 -->
  <div class="relative z-10 h-full overflow-y-auto p-6">
    <!-- 标题 -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-[#00ff41] mb-2 text-glow-green font-mono">CFN TERMINAL</h1>
      <p class="text-[#888888] text-sm font-mono">通讯终端</p>
    </div>

    <!-- 佣兵身份预览 -->
    <div v-if="hasCoreSettings" class="mb-8 p-4 bg-[#111111] border border-[#00ffff]/30 rounded max-w-xl">
      <p class="text-[#00ffff] text-xs mb-1 font-mono uppercase">当前身份</p>
      <p class="text-[#00ff41] font-mono">{{ playerIdentity }}</p>
    </div>

    <!-- 未配置提示 -->
    <div v-else class="mb-8 p-4 bg-[#111111] border border-[#ff0040]/50 rounded max-w-xl">
      <p class="text-[#ff0040] text-sm font-mono">[WARNING] 请先完成佣兵档案配置</p>
      <button
        @click="$emit('open-settings')"
        class="mt-3 px-4 py-2 bg-[#ff0040]/20 border border-[#ff0040] text-[#ff0040] text-sm rounded hover:bg-[#ff0040]/30 transition-all"
      >
        立即配置
      </button>
    </div>

    <!-- NPC 候选列表 -->
    <div v-if="!loadingSessions">
      <h2 class="text-sm font-bold text-[#00ff41] uppercase tracking-wider mb-4 font-mono flex items-center gap-2">
        <span class="w-1 h-4 bg-[#00ff41]"></span>
        可通讯人员
      </h2>

      <!-- 头像验证加载中状态 -->
      <div v-if="validatingNpcs" class="flex items-center gap-3 text-[#555555] text-sm font-mono py-8">
        <div class="w-4 h-4 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin"></div>
        <span>[SYSTEM] 正在扫描通讯录并建立安全连接...</span>
      </div>

      <!-- 验证完毕，但列表为空 -->
      <div v-else-if="validNpcCandidates.length === 0" class="text-[#555555] text-sm italic font-mono py-8">
        [WARNING] 暂无可用通讯人员
      </div>

      <!-- 头像大小改为 150px，每行显示更多 -->
      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <!-- 直接遍历 validNpcCandidates，不需要再过滤 -->
        <button
          v-for="npc in validNpcCandidates.filter(n => !npcsWithFailedAvatar.has(n))"
          :key="npc"
          @click="$emit('open-new-session', npc)"
          class="group flex flex-col items-center transition-all"
        >
          <!-- NPC 头像 150x150 -->
          <div class="w-[150px] h-[150px] rounded border border-[#333333] group-hover:border-[#00ff41] overflow-hidden bg-[#0a0a0a] transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] relative">
            <img
              :src="getAvatarUrl(npc)"
              :alt="npc"
              class="w-full h-full object-cover relative z-10"
              @error="(e) => handleAvatarError(e, npc)"
            />
          </div>
          <!-- NPC 名字 -->
          <p class="mt-2 text-center text-gray-400 group-hover:text-[#00ff41] font-mono text-sm truncate w-full px-2 transition-colors">
            {{ npc }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAvatarUrl } from '../api/assets'

defineProps<{
  hasCoreSettings: boolean
  playerIdentity: string
  loadingSessions: boolean
  validatingNpcs: boolean
  validNpcCandidates: string[]
  npcsWithFailedAvatar: Set<string>
  handleAvatarError: (event: Event, npcName?: string) => void
}>()

defineEmits<{
  (e: 'open-settings'): void
  (e: 'open-new-session', npcName: string): void
}>()
</script>

