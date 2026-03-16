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

      <!-- 按阵营分组展示 -->
      <div v-else class="space-y-8">
        <section
          v-for="group in npcGroups"
          :key="group.factionLabel"
          class="space-y-4"
        >
          <!-- 阵营标题：无阵营时不显示或显示为「未设置」 -->
          <h3
            v-if="group.factionLabel !== FACTION_NONE"
            class="text-xs font-bold text-[#00ffff] uppercase tracking-wider font-mono flex items-center gap-2"
          >
            <span class="w-1 h-3 bg-[#00ffff]"></span>
            {{ getFactionDisplayLabel(group.factionLabel) }}
          </h3>
          <h3
            v-else
            class="text-xs font-bold text-[#666666] uppercase tracking-wider font-mono flex items-center gap-2"
          >
            <span class="w-1 h-3 bg-[#666666]"></span>
            未设置
          </h3>
          <!-- 头像网格 150px -->
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            <button
              v-for="npc in group.npcs.filter(n => !npcsWithFailedAvatar.has(n.npc_name))"
              :key="npc.npc_name"
              @click="$emit('open-new-session', npc.npc_name)"
              class="group flex flex-col items-center transition-all"
            >
              <div class="w-[150px] h-[150px] rounded border border-[#333333] group-hover:border-[#00ff41] overflow-hidden bg-[#0a0a0a] transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] relative">
                <img
                  :src="getAvatarUrl(npc.npc_name)"
                  :alt="npc.npc_name"
                  class="w-full h-full object-cover relative z-10"
                  @error="(e) => handleAvatarError(e, npc.npc_name)"
                />
              </div>
              <p class="mt-2 text-center text-gray-400 group-hover:text-[#00ff41] font-mono text-sm truncate w-full px-2 transition-colors">
                {{ npc.npc_name }}
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getAvatarUrl } from '../api/assets'
import type { NpcCandidateItem } from '../api/game'

const FACTION_ELDER = 'A兵团元老'
const FACTION_A = 'A兵团'
const FACTION_ROCK = '摇滚公园'
const FACTION_EGG = '彩蛋'
const FACTION_MEMBER = '成员'
const FACTION_NONE = '无'

/** 阵营排序权重：越小越靠前；彩蛋、成员放最后 */
function getFactionSortKey(label: string): number {
  if (label === FACTION_ELDER) return 0
  if (label === FACTION_A) return 1
  if (label === FACTION_ROCK) return 2
  if (label === FACTION_EGG) return 998
  if (label === FACTION_MEMBER) return 999
  if (label === FACTION_NONE) return 1000
  return 3 // 其他阵营排在 A兵团 之后、彩蛋/成员 之前，同权重按名称稳定排序
}

/** 阵营显示名映射：支持把后端原始值换成更友好的文案 */
function getFactionDisplayLabel(label: string): string {
  if (label === FACTION_EGG) return '???'
  if (label === FACTION_A) return 'A兵团成员'
  return label
}

const props = defineProps<{
  hasCoreSettings: boolean
  playerIdentity: string
  loadingSessions: boolean
  validatingNpcs: boolean
  validNpcCandidates: NpcCandidateItem[]
  npcsWithFailedAvatar: Set<string>
  handleAvatarError: (event: Event, npcName?: string) => void
}>()

defineEmits<{
  (e: 'open-settings'): void
  (e: 'open-new-session', npcName: string): void
}>()

/** 按阵营分组并排序：A兵团元老 → A兵团 → 其他 → 彩蛋 → 成员 → 无 */
const npcGroups = computed(() => {
  const raw = props.validNpcCandidates
  const map = new Map<string, NpcCandidateItem[]>()
  const norm = (f: string | null) => (f === null || f === '') ? FACTION_NONE : f
  for (const item of raw) {
    const label = norm(item.faction)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  const factions = Array.from(map.entries())
  factions.sort(([a], [b]) => {
    const ka = getFactionSortKey(a)
    const kb = getFactionSortKey(b)
    if (ka !== kb) return ka - kb
    return a.localeCompare(b)
  })
  return factions.map(([factionLabel, npcs]) => ({ factionLabel, npcs }))
})
</script>

