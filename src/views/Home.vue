<template>
  <div class="flex h-full w-full">
    <!-- 左侧边栏 -->
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
              @click="selectSession(session.session_id)"
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
                @click.stop="openSessionMenu(session, $event)"
                class="p-1.5 text-[#444444] hover:text-[#00ff41] hover:bg-[#00ff41]/10 rounded transition-all duration-150 ease-out"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <circle cx="12" cy="6" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="18" r="1.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部：设置按钮 -->
      <div class="p-4 border-t border-[#333333]">
        <button
          @click="showSettings = true"
          class="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#00ff41] rounded flex items-center justify-center gap-2 transition-all duration-200 group"
        >
          <span class="text-lg group-hover:rotate-45 transition-transform duration-300">⚙️</span>
          <span class="text-sm font-medium text-gray-400 group-hover:text-[#00ff41]">设置</span>
        </button>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <main class="flex-1 bg-[#0a0a0a] relative overflow-hidden">
      <!-- 背景网格效果 -->
      <div class="absolute inset-0 opacity-5 pointer-events-none"
           style="background-image: linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px); background-size: 50px 50px;">
      </div>

      <!-- 聊天面板 -->
      <div v-if="currentSessionId" class="relative z-10 h-full flex flex-col">
        <!-- 聊天面板头部 -->
        <div class="p-4 border-b border-[#333333] flex items-center justify-between bg-[#111111]/50">
          <div class="flex items-center gap-3">
            <button
              @click="exitSession"
              class="text-[#555555] hover:text-[#ff0040] transition-colors text-sm font-mono"
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

        <!-- 聊天内容区域 -->
        <div class="flex-1 relative min-h-0">
          <!-- 立绘布局模式切换按钮：放在聊天区域右上角，仅在有立绘时显示 -->
          <div
            v-if="currentIllustrationUrl && !illustrationError"
            class="absolute top-3 right-4 z-20 flex items-center gap-1 text-xs"
          >
            <!-- 全局居中：左按钮，抽象的三叉平衡图形 -->
            <button
              class="w-7 h-7 flex items-center justify-center transition-colors"
              :class="illustrationMode === 'global-center'
                ? 'text-[#00ff41]'
                : 'text-[#666666] hover:text-[#00ff41]'"
              @click="setIllustrationMode('global-center')"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <g transform="translate(24,0) scale(-1,1)">
                  <path d="M4 7h6l3 5-3 5H4l3-5z" />
                  <path d="M15 5l5 7-5 7" />
                </g>
              </svg>
            </button>
            <!-- 右侧展开：中按钮，向右展开的蜂巢箭头感 -->
            <button
              class="w-7 h-7 flex items-center justify-center transition-colors"
              :class="illustrationMode === 'right-docked'
                ? 'text-[#00ff41]'
                : 'text-[#666666] hover:text-[#00ff41]'"
              @click="setIllustrationMode('right-docked')"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <path d="M4 12h16" />
                <path d="M12 4v16" />
                <path d="M8 6l4-3 4 3" />
                <path d="M8 18l4 3 4-3" />
              </svg>
            </button>
            <!-- 右侧 300 区域居中：右按钮，右侧窗口中段高亮的感觉 -->
            <button
              class="w-7 h-7 flex items-center justify-center transition-colors"
              :class="illustrationMode === 'right-center'
                ? 'text-[#00ff41]'
                : 'text-[#666666] hover:text-[#00ff41]'"
              @click="setIllustrationMode('right-center')"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7h6l3 5-3 5H4l3-5z" />
                <path d="M15 5l5 7-5 7" />
              </svg>
            </button>
          </div>

          <!-- NPC 立绘：算完边界后再显示，避免错位闪现；用已加载 img 算边界，不发起跨域请求 -->
          <div
            v-if="currentIllustrationUrl && !illustrationError"
            class="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-200"
            :class="illustrationReady ? 'opacity-100' : 'opacity-0'"
          >
            <div
              ref="illustrationContainerRef"
              class="absolute bottom-0 left-0 right-0 h-[600px] overflow-hidden"
            >
              <img
                ref="illustrationImgRef"
                :src="currentIllustrationUrl"
                :alt="currentSessionNpc"
                class="absolute top-0 opacity-90"
                :style="illustrationImgStyle"
                @load="onIllustrationLoad($event, currentIllustrationUrl)"
                @error="handleIllustrationError"
              />
            </div>
            <!-- 从立绘左侧边界向左，逐渐加深遮罩；右侧区域在右侧模式下为 300px 不遮挡 -->
            <div
              class="absolute inset-y-0 left-0 pointer-events-none"
              :style="illustrationOverlayStyle"
            ></div>
          </div>

          <!-- 可滚动的消息区域 -->
          <div
            ref="chatContainer"
            class="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 z-10"
            :class="{ 'pr-[316px]': currentIllustrationUrl && !illustrationError && illustrationMode !== 'global-center' }"
          >
            <!-- 历史消息 -->
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'user' ? 'justify-start' : 'justify-end'"
            >
              <!-- 玩家消息（左侧） -->
              <div v-if="msg.role === 'user'" class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                <div class="w-10 h-10 rounded-full bg-[#00ff41]/20 border border-[#00ff41]/50 flex items-center justify-center flex-shrink-0">
                  <span class="text-[#00ff41] text-xs">你</span>
                </div>
                <div class="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3">
                  <p class="text-gray-300 text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                </div>
              </div>

              <!-- NPC消息（右侧） -->
              <div v-else class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                <!-- NPC 对话气泡的大范围暗色晕光：右侧（靠近立绘一侧）更黑，向左逐渐过渡到透明，整体比头像晕光更淡一些 -->
                <div class="relative">
                  <div
                    class="pointer-events-none absolute inset-0 -m-6 rounded-2xl opacity-80 blur-[14px]"
                    style="background: radial-gradient(circle at 100% 50%, rgba(0,0,0,0.7) 0%, rgba(5,5,5,0.58) 34%, rgba(5,5,5,0.3) 70%, transparent 100%);"
                  ></div>
                  <div class="relative bg-[#0b0b0b] border border-[#00ffff]/40 rounded-lg p-3">
                    <p class="text-[#00ffff] text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                    <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                  </div>
                </div>
                <!-- NPC 头像：增加内圈霓虹光环 + 更大范围暗色晕光，和立绘之间做多层过渡 -->
                <div class="relative flex-shrink-0">
                  <!-- 外圈大范围暗色晕光（覆盖头像周围更大区域，越近越暗、越远越透明） -->
                  <div
                    class="absolute inset-0 -m-8 rounded-full opacity-90 blur-[14px] pointer-events-none"
                    style="background: radial-gradient(circle, rgba(0,0,0,0.82) 0%, rgba(5,5,5,0.72) 35%, rgba(5,5,5,0.36) 70%, transparent 100%);"
                  ></div>
                  <!-- 外层发光环（比头像略大，做柔和过渡） -->
                  <div
                    class="absolute inset-0 -m-1 rounded-full opacity-70 blur-[3px] pointer-events-none"
                    style="background: radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(0,255,255,0.35) 35%, transparent 70%);"
                  ></div>
                  <!-- 实际头像容器 -->
                  <div
                    class="relative w-14 h-14 rounded-full border-2 border-[#00ffff]/60 overflow-hidden bg-[#020202]/95 shadow-[0_0_12px_rgba(0,255,255,0.45)]"
                  >
                    <img
                      :src="getAvatarUrl(currentSessionNpc)"
                      :alt="currentSessionNpc"
                      class="w-full h-full object-cover"
                      @error="handleAvatarError"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading 状态 -->
            <div v-if="isLoading" class="flex justify-end items-center gap-3">
              <div class="bg-[#111111] border border-[#00ffff]/30 rounded-lg p-3">
                <p class="text-[#555555] text-sm animate-pulse">
                  {{ isFirstMessage ? '[首次连接，等待终端加载...]' : '[正在链接终端...]' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 发送消息区域 -->
        <div class="p-4 border-t border-[#333333] bg-[#111111]/50">
          <div class="flex gap-3">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="输入消息..."
              class="flex-1 bg-[#1a1a1a] text-[#00ff41] border border-[#333333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
              :disabled="isLoading"
              @keyup.enter="sendChatMessage"
            />
            <button
              @click="sendChatMessage"
              :disabled="!inputMessage.trim() || isLoading"
              class="px-6 py-3 bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <!-- 默认视图：NPC 候选列表 -->
      <div v-else class="relative z-10 h-full overflow-y-auto p-6">
        <!-- 标题 -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-[#00ff41] mb-2 text-glow-green font-mono">CFN TERMINAL</h1>
          <p class="text-[#888888] text-sm font-mono">通讯终端</p>
        </div>

        <!-- 佣兵身份预览 -->
        <div v-if="hasCoreSettings" class="mb-8 p-4 bg-[#111111] border border-[#00ffff]/30 rounded max-w-xl">
          <p class="text-[#00ffff] text-xs mb-1 font-mono uppercase">当前身份</p>
          <p class="text-[#00ff41] font-mono">{{ playerStore.playerIdentity }}</p>
        </div>

        <!-- 未配置提示 -->
        <div v-else class="mb-8 p-4 bg-[#111111] border border-[#ff0040]/50 rounded max-w-xl">
          <p class="text-[#ff0040] text-sm font-mono">[WARNING] 请先完成佣兵档案配置</p>
          <button
            @click="showSettings = true"
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
              @click="openNewSessionModal(npc)"
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
    </main>

    <!-- 设置弹窗 -->
    <SettingsModal v-model="showSettings" />

    <!-- 新建会话弹窗 -->
    <NewSessionModal
      v-model="showNewSessionModal"
      :npc-name="selectedNpc"
      :loading="creatingSession"
      @confirm="createNewSession"
    />

    <!-- 会话操作菜单弹窗（独立组件） -->
    <SessionActionMenu
      v-model="showSessionMenu"
      :session="selectedSession"
      :position="menuPosition"
      @rename="openRenameModal"
      @delete="openDeleteConfirm"
    />

    <!-- 重命名会话弹窗（独立组件） -->
    <RenameSessionModal
      v-model="showRenameModal"
      :initial-title="selectedSession?.title || ''"
      :loading="renamingSession"
      @confirm="confirmRename"
    />

    <!-- 删除确认弹窗（独立组件） -->
    <DeleteSessionConfirmModal
      v-model="showDeleteConfirm"
      :session-title="selectedSession?.title"
      :loading="deletingSession"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import SettingsModal from '../components/SettingsModal.vue'
import NewSessionModal from '../components/NewSessionModal.vue'
import SessionActionMenu from '../components/SessionActionMenu.vue'
import RenameSessionModal from '../components/RenameSessionModal.vue'
import DeleteSessionConfirmModal from '../components/DeleteSessionConfirmModal.vue'
import {
  getAvatarUrl,
  getIllustrationUrl,
  markAvatarInvalid,
  isAvatarValid,
  markIllustrationInvalid,
  isIllustrationValid
} from '../api/assets'
import {
  getSessions,
  createSession,
  getSessionHistory,
  sendMessage,
  getNPCFavorability,
  updateSessionTitle,
  deleteSession,
  type Session,
  type ChatMessage,
  type NPCChatResponse
} from '../api/game'

const playerStore = usePlayerStore()
const showSettings = ref(false)

// 会话相关状态
const sessions = ref<Session[]>([])
const npcCandidates = ref<string[]>([])
const currentSessionId = ref<string>('')
const loadingSessions = ref(false)
const showNewSessionModal = ref(false)
const selectedNpc = ref('')
const creatingSession = ref(false)

// 聊天相关状态
const chatMessages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isFirstMessage = ref(true)
const favorability = ref<number | null>(null)
const relationshipLevel = ref('')
const currentEmotion = ref('普通')
const illustrationError = ref(false)
const showFavorChange = ref(false)
const favorChangeValue = ref(0)
const chatContainer = ref<HTMLDivElement>()
// 立绘布局模式：'global-center' 全局居中；'right-docked' 右侧对齐展开；'right-center' 右侧 300px 区域内居中（默认）
const illustrationMode = ref<'global-center' | 'right-docked' | 'right-center'>('right-center')

// SWF 导出立绘的源图与有效区域（4096×2304，有效区域约 (200,1600)..(3500,100)，底边 y=1600 对齐）
const ILLUST_SOURCE_WIDTH = 4096
const ILLUST_SOURCE_HEIGHT = 2304
const ILLUST_CONTENT_TOP_Y = 100
const ILLUST_CONTENT_BOTTOM_Y = 1600
// 未正确算到非透明边界时使用的默认有效 X 范围（大部分立绘在 200–2300）
const ILLUST_DEFAULT_BOUNDS = { left: 200, right: 2300, centerX: 1250 }
const ILLUST_DISPLAY_HEIGHT = 600
const ILLUST_SCALE = ILLUST_DISPLAY_HEIGHT / ILLUST_CONTENT_BOTTOM_Y // 0.375
const ILLUST_DISPLAY_WIDTH = Math.round(ILLUST_SOURCE_WIDTH * ILLUST_SCALE)
const ILLUST_SCALED_HEIGHT = Math.round(ILLUST_SOURCE_HEIGHT * ILLUST_SCALE)

// 立绘内容在 X 方向上的边界（由非透明像素计算，在 y∈[0,1600] 内），用于居中和右对齐
const illustrationContentBounds = ref<{ left: number; right: number; centerX: number } | null>(null)
const illustrationBoundsCache = new Map<string, { left: number; right: number; centerX: number }>()
const illustrationContainerRef = ref<HTMLDivElement | null>(null)
const illustrationContainerWidth = ref(0)
const illustrationImgRef = ref<HTMLImageElement | null>(null)
// 立绘 img 实际渲染宽高（先按 y 缩到 600 后，若再被容器缩放则用于修正 centerPx/rightPx）
const illustrationImgRenderedWidth = ref(0)
// 等边界算完（或失败）后再显示立绘，避免错位闪现
const illustrationReady = ref(false)

// 记录头像加载失败的NPC（用于隐藏无头像的NPC）
const npcsWithFailedAvatar = ref<Set<string>>(new Set())

// 记录有效头像的NPC
const validNpcCandidates = ref<string[]>([]) // 有效头像的NPC
const validatingNpcs = ref(false) // 是否正在验证头像

// 会话操作菜单相关状态
const showSessionMenu = ref(false)
const selectedSession = ref<Session | null>(null)
const menuPosition = ref({ x: 0, y: 0 })

// 重命名相关状态
const showRenameModal = ref(false)
const renamingSession = ref(false)

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const deletingSession = ref(false)

// --- 3. 新增预检查头像函数（带本页缓存）---
const verifyAvatar = (npcName: string): Promise<boolean> => {
  // 如果本次页面启动期间已判定为无效头像，直接返回 false，避免重复请求
  if (!isAvatarValid(npcName)) {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)   // 加载成功
    img.onerror = () => {
      // 一旦加载失败，标记为无效，后续不再请求
      markAvatarInvalid(npcName)
      resolve(false)
    }
    img.src = getAvatarUrl(npcName)
  })
}

// 检查是否已配置（用户是否保存过设置）
const hasCoreSettings = computed(() => {
  return playerStore.hasConfigured
})

// 当前会话信息
const currentSession = computed(() => {
  return sessions.value.find(s => s.session_id === currentSessionId.value)
})

const currentSessionTitle = computed(() => {
  return currentSession.value?.title || ''
})

const currentSessionNpc = computed(() => {
  return currentSession.value?.npc_name || ''
})

// 当前立绘 URL（按 NPC + 情绪 维度做本页缓存）
const currentIllustrationUrl = computed(() => {
  if (!currentSessionNpc.value || illustrationError.value) return ''
  // 如果当前 NPC+情绪 已经被判定为无效立绘，则直接返回空字符串，避免重复请求
  if (!isIllustrationValid(currentSessionNpc.value, currentEmotion.value)) {
    return ''
  }
  return getIllustrationUrl(currentSessionNpc.value, currentEmotion.value)
})

// 无立绘或全局居中时缩小气泡最大宽度，避免负边距晕光导致横向滚动条
const chatBubbleMaxWidthClass = computed(() => {
  const noRightColumn = !currentIllustrationUrl.value || illustrationError.value || illustrationMode.value === 'global-center'
  return noRightColumn ? 'max-w-[65%]' : 'max-w-[70%]'
})

// 立绘遮罩样式：根据布局模式决定是否为右侧预留 300px 不遮挡区域
const illustrationOverlayStyle = computed(() => {
  if (!currentIllustrationUrl.value || illustrationError.value) {
    return {}
  }
  const right = illustrationMode.value === 'global-center' ? '0px' : '300px'
  return {
    right,
    background: 'linear-gradient(to left, transparent 0%, rgba(5,5,5,0.72) 35%, rgba(5,5,5,0.94) 100%)'
  }
})

// 立绘图片样式：y 方向按 1600→600 缩放，x 方向同比例；偏移按「实际渲染宽度/1536」再乘一遍，避免被容器二次缩放时错位
const illustrationImgStyle = computed(() => {
  if (!currentIllustrationUrl.value || illustrationError.value) return {}
  const b = illustrationContentBounds.value
  const centerX = b ? b.centerX : ILLUST_DEFAULT_BOUNDS.centerX
  const contentRight = b ? b.right : ILLUST_DEFAULT_BOUNDS.right
  const scale = ILLUST_SCALE
  const nominalCenterPx = centerX * scale
  const nominalRightPx = contentRight * scale
  const renderedW = illustrationImgRenderedWidth.value
  const ratio = renderedW > 0 ? renderedW / ILLUST_DISPLAY_WIDTH : 1
  const centerPx = Math.round(nominalCenterPx * ratio)
  const rightPx = Math.round(nominalRightPx * ratio)
  let left: string
  if (illustrationMode.value === 'global-center') {
    left = `calc(50% - ${centerPx}px)`
  } else if (illustrationMode.value === 'right-center') {
    left = `calc(100% - 150px - ${centerPx}px)`
  } else {
    left = `calc(100% - ${rightPx}px)`
  }
  return {
    width: `${ILLUST_DISPLAY_WIDTH}px`,
    height: `${ILLUST_SCALED_HEIGHT}px`,
    top: '0',
    left
  }
})

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 头像加载失败处理
const handleAvatarError = (event: Event, npcName?: string) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    const name = npcName || target.alt || '?'
    const placeholder = document.createElement('div')
    placeholder.className = 'w-full h-full flex items-center justify-center text-[#333333] text-3xl font-mono'
    placeholder.textContent = name.charAt(0).toUpperCase()
    parent.appendChild(placeholder)
    // 记录头像加载失败的NPC，并在本次页面启动期间标记其头像无效
    if (name && name !== '?') {
      npcsWithFailedAvatar.value.add(name)
      markAvatarInvalid(name)
    }
  }
}

// 立绘加载失败处理
const handleIllustrationError = () => {
  illustrationError.value = true
  illustrationContentBounds.value = null
  // 标记当前 NPC+情绪 的立绘无效，避免本次页面生命周期内重复请求
  if (currentSessionNpc.value && currentEmotion.value) {
    markIllustrationInvalid(currentSessionNpc.value, currentEmotion.value)
  }
}

// 用已加载的立绘 img（不新建请求，避免 CORS）在 y∈[100,1600] 对应区域算 X 左右边界与中点，返回 4096 源图坐标
function getIllustrationContentBounds(img: HTMLImageElement, imgSrc: string): Promise<{ left: number; right: number; centerX: number } | null> {
  const cached = illustrationBoundsCache.get(imgSrc)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    try {
      const sampleW = 2048
      const sampleH = 1152
      const canvas = document.createElement('canvas')
      canvas.width = sampleW
      canvas.height = sampleH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0, sampleW, sampleH)
      const data = ctx.getImageData(0, 0, sampleW, sampleH).data
      const alphaThreshold = 20
      const contentTopSampleY = Math.floor((ILLUST_CONTENT_TOP_Y / ILLUST_SOURCE_HEIGHT) * sampleH)
      const contentBottomSampleY = Math.floor((ILLUST_CONTENT_BOTTOM_Y / ILLUST_SOURCE_HEIGHT) * sampleH)
      let left = sampleW
      let right = 0
      for (let y = contentTopSampleY; y <= contentBottomSampleY; y++) {
        for (let x = 0; x < sampleW; x++) {
          const a = data[(y * sampleW + x) * 4 + 3]
          if (a && a > alphaThreshold) {
            if (x < left) left = x
            if (x > right) right = x
          }
        }
      }
      if (left > right) {
        resolve(null)
        return
      }
      const scaleToSource = ILLUST_SOURCE_WIDTH / sampleW
      const result = {
        left: Math.round(left * scaleToSource),
        right: Math.round(right * scaleToSource),
        centerX: Math.round((left + right) * 0.5 * scaleToSource)
      }
      illustrationBoundsCache.set(imgSrc, result)
      resolve(result)
    } catch {
      resolve(null)
    }
  })
}

// 根据立绘 img 实际渲染宽度更新（y 缩到 600 后若再被容器缩放，需按此比例修正 centerPx/rightPx）
function updateIllustrationImgRenderedSize() {
  const el = illustrationImgRef.value
  illustrationImgRenderedWidth.value = el ? Math.round(el.getBoundingClientRect().width) : 0
}

// 立绘图片加载成功：用当前 img 算边界（不发起新请求，避免 CORS），算完后再显示
async function onIllustrationLoad(event: Event, imgSrc: string) {
  const img = event.target as HTMLImageElement
  if (!img || currentIllustrationUrl.value !== imgSrc) return
  const bounds = await getIllustrationContentBounds(img, imgSrc)
  if (bounds && currentIllustrationUrl.value === imgSrc) {
    illustrationContentBounds.value = bounds
  }
  nextTick(() => updateIllustrationImgRenderedSize())
  if (currentIllustrationUrl.value === imgSrc) {
    illustrationReady.value = true
  }
}

// 切换立绘布局模式
const setIllustrationMode = (mode: 'global-center' | 'right-docked' | 'right-center') => {
  illustrationMode.value = mode
}

// 立绘 URL 变化时清空边界并隐藏，等新图 load 且边界算完后再显示
watch(currentIllustrationUrl, (url) => {
  if (!url) {
    illustrationContentBounds.value = null
    illustrationReady.value = false
  } else {
    illustrationReady.value = false
  }
})

// 立绘容器出现时更新宽度并挂载 ResizeObserver；消失时断开
watch(
  () => !!(currentIllustrationUrl.value && !illustrationError.value),
  (hasIllustration) => {
    if (!hasIllustration) {
      illustrationResizeObserver?.disconnect()
      illustrationResizeObserver = null
      return
    }
    nextTick(() => {
      const el = illustrationContainerRef.value
      if (el) {
        illustrationContainerWidth.value = el.clientWidth
        illustrationResizeObserver?.disconnect()
        illustrationResizeObserver = new ResizeObserver(() => updateIllustrationContainerWidth())
        illustrationResizeObserver.observe(el)
      }
    })
  }
)

// 更新立绘容器宽度与立绘 img 实际渲染宽度（用于水平定位与偏移比例）
function updateIllustrationContainerWidth() {
  const el = illustrationContainerRef.value
  illustrationContainerWidth.value = el ? el.clientWidth : 0
  updateIllustrationImgRenderedSize()
}

// 加载会话列表（带重试机制）
const loadSessions = async (isRetry: boolean = false) => {
  loadingSessions.value = true
  try {
    // 传入代理配置，让后端可以初始化代理设置
    const data = await getSessions({
      proxy_url: playerStore.proxy_url || null
    })

    // 检查返回数据是否为空（sessions 和 npc_candidates 都为空才认为是后端未就绪）
    const isSessionsEmpty = !data.sessions || data.sessions.length === 0
    const isCandidatesEmpty = !data.npc_candidates || data.npc_candidates.length === 0
    const isEmpty = isSessionsEmpty && isCandidatesEmpty

    if (isEmpty && !isRetry) {
      // 首次加载为空，5秒后重试
      console.log('初始化返回为空，5秒后重试...')
      setTimeout(() => {
        loadSessions(true)
      }, 5000)
      return
    }

    sessions.value = data.sessions
    npcCandidates.value = data.npc_candidates || []
    
    // --- 开始验证 NPC 头像 ---
    validatingNpcs.value = true
    // 并发验证所有NPC的头像
    const validationPromises = npcCandidates.value.map(async (npc) => {
      const isValid = await verifyAvatar(npc)
      return { npc, isValid }
    })
    
    const results = await Promise.all(validationPromises)
    // 过滤出有头像的 NPC
    validNpcCandidates.value = results.filter(r => r.isValid).map(r => r.npc)
    
  } catch (error) {
    console.error('Failed to load sessions:', error)

    // 如果首次调用失败，5秒后重试一次
    if (!isRetry) {
      console.log('初始化失败，5秒后重试...')
      setTimeout(() => {
        loadSessions(true)
      }, 5000)
    }
  } finally {
    loadingSessions.value = false
    validatingNpcs.value = false // 验证结束
  }
}

// 选择会话
const selectSession = async (sessionId: string) => {
  currentSessionId.value = sessionId
  // 重置聊天状态
  chatMessages.value = []
  favorability.value = null
  relationshipLevel.value = ''
  currentEmotion.value = '普通'
  illustrationError.value = false
  isFirstMessage.value = true

  // 获取当前会话信息
  const session = sessions.value.find(s => s.session_id === sessionId)

  // 加载历史记录和NPC好感度（并行）
  try {
    const [history, favorabilityData] = await Promise.all([
      getSessionHistory(sessionId),
      session ? getNPCFavorability(session.npc_name) : Promise.resolve(null)
    ])

    chatMessages.value = history.messages
    if (history.messages.length > 0) {
      isFirstMessage.value = false
    }

    // 设置好感度信息
    if (favorabilityData) {
      favorability.value = favorabilityData.favorability
      relationshipLevel.value = favorabilityData.relationship_level
    }

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load session data:', error)
  }
}

// 退出会话
const exitSession = () => {
  currentSessionId.value = ''
  chatMessages.value = []
  favorability.value = null
  relationshipLevel.value = ''
  currentEmotion.value = '普通'
  illustrationError.value = false
}

// 打开新建会话弹窗
const openNewSessionModal = (npcName: string) => {
  selectedNpc.value = npcName
  showNewSessionModal.value = true
}

// 创建新会话
const createNewSession = async (title: string) => {
  if (!selectedNpc.value || !title) return

  creatingSession.value = true
  try {
    const newSession = await createSession({
      npc_name: selectedNpc.value,
      title
    })

    // 添加到列表
    sessions.value.unshift(newSession)

    // 关闭弹窗并选中该会话
    showNewSessionModal.value = false
    await selectSession(newSession.session_id)
  } catch (error) {
    console.error('Failed to create session:', error)
    alert('创建会话失败，请检查网络连接或关闭浏览器插件')
  } finally {
    creatingSession.value = false
  }
}

// 发送消息
const sendChatMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || !currentSessionId.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true

  // 添加用户消息到列表（临时）
  const tempUserMsg: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: message,
    timestamp: Math.floor(Date.now() / 1000)
  }
  chatMessages.value.push(tempUserMsg)

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    const response: NPCChatResponse = await sendMessage({
      query: message,
      npc_name: currentSessionNpc.value,
      session_id: currentSessionId.value,
      player_identity: playerStore.playerIdentity || null,
      api_key: playerStore.api_key || null,
      api_base: playerStore.api_base || null,
      model_name: playerStore.model_name || null,
      proxy_url: playerStore.proxy_url || null
    })

    // 添加 NPC 回复
    const npcMsg: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response.reply,
      timestamp: Math.floor(Date.now() / 1000)
    }
    chatMessages.value.push(npcMsg)

    // 更新好感度和关系
    const prevFavor = favorability.value
    favorability.value = response.favorability
    relationshipLevel.value = response.relationship_level

    // 显示好感度变化动画
    if (prevFavor !== null && response.favorability_change !== 0) {
      favorChangeValue.value = response.favorability_change
      showFavorChange.value = true
      setTimeout(() => {
        showFavorChange.value = false
      }, 2000)
    }

    // 更新情绪（切换立绘），并在情绪变化时重置错误标记
    currentEmotion.value = response.emotion
    illustrationError.value = false

    isFirstMessage.value = false

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
    // 添加错误提示
    const errorMsg: ChatMessage = {
      id: Date.now() + 2,
      role: 'assistant',
      content: '[系统] 连接终端失败，请检查网络或API配置',
      timestamp: Math.floor(Date.now() / 1000)
    }
    chatMessages.value.push(errorMsg)
  } finally {
    isLoading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// 打开会话操作菜单
const openSessionMenu = (session: Session, event: MouseEvent) => {
  selectedSession.value = session
  const target = event.currentTarget as HTMLElement | null
  if (target) {
    const rect = target.getBoundingClientRect()
    // 让菜单左上角与按钮右下角大致对齐，稍微增加一点间距
    menuPosition.value = {
      x: rect.right + 4,
      y: rect.bottom + 4
    }
  } else {
    menuPosition.value = { x: event.clientX, y: event.clientY }
  }
  showSessionMenu.value = true
}

// 关闭会话操作菜单
const closeSessionMenu = () => {
  showSessionMenu.value = false
}

// 打开重命名弹窗
const openRenameModal = () => {
  if (selectedSession.value) {
    showRenameModal.value = true
    closeSessionMenu()
  }
}

// 确认重命名
const confirmRename = async (newTitle: string) => {
  if (!selectedSession.value || !newTitle.trim()) return

  renamingSession.value = true
  try {
    const response = await updateSessionTitle(selectedSession.value.session_id, {
      title: newTitle.trim()
    })

    // 更新本地会话列表中的标题
    const session = sessions.value.find(s => s.session_id === response.session_id)
    if (session) {
      session.title = response.title
    }

    // 如果当前正在查看这个会话，同步更新显示（currentSession 是 computed，会自动更新）
    if (currentSessionId.value === response.session_id) {
      // no-op
    }

    showRenameModal.value = false
  } catch (error) {
    console.error('Failed to rename session:', error)
    alert('重命名失败，请稍后重试')
  } finally {
    renamingSession.value = false
  }
}

// 打开删除确认弹窗
const openDeleteConfirm = () => {
  showDeleteConfirm.value = true
  closeSessionMenu()
}

// 关闭删除确认弹窗
const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false
}

// 确认删除
const confirmDelete = async () => {
  if (!selectedSession.value) return

  deletingSession.value = true
  try {
    await deleteSession(selectedSession.value.session_id)

    // 从本地列表中移除
    const index = sessions.value.findIndex(s => s.session_id === selectedSession.value!.session_id)
    if (index > -1) {
      sessions.value.splice(index, 1)
    }

    // 如果删除的是当前正在查看的会话，退出该会话
    if (currentSessionId.value === selectedSession.value.session_id) {
      exitSession()
    }

    closeDeleteConfirm()
    selectedSession.value = null
  } catch (error) {
    console.error('Failed to delete session:', error)
    alert('删除失败，请稍后重试')
  } finally {
    deletingSession.value = false
  }
}

// 应用加载时
let illustrationResizeObserver: ResizeObserver | null = null

onMounted(() => {
  loadSessions()
  if (!hasCoreSettings.value) {
    showSettings.value = true
  }
  window.addEventListener('resize', updateIllustrationContainerWidth)
})

onUnmounted(() => {
  illustrationResizeObserver?.disconnect()
  illustrationResizeObserver = null
  window.removeEventListener('resize', updateIllustrationContainerWidth)
})
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #111111;
}

::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00ff41;
}

/* 好感度变化飘字动画 */
.float-enter-active {
  transition: all 0.3s ease-out;
}

.float-leave-active {
  transition: all 0.5s ease-in;
}

.float-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.float-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
