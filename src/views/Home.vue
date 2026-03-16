<template>
  <div class="flex h-full w-full">
    <!-- 左侧边栏：会话列表 -->
    <SessionSidebar
      :sessions="sessions"
      :current-session-id="currentSessionId"
      :loading-sessions="loadingSessions"
      :select-session="selectSession"
      :open-session-menu="openSessionMenu"
      @open-settings="showSettings = true"
    />

    <!-- 右侧主区域 -->
    <main class="flex-1 bg-[#0a0a0a] relative overflow-hidden">
      <!-- 背景网格效果 -->
      <div class="absolute inset-0 opacity-5 pointer-events-none"
           style="background-image: linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px); background-size: 50px 50px;">
      </div>

      <!-- 聊天面板 -->
      <div v-if="currentSessionId" class="relative z-10 h-full flex flex-col">
        <ChatHeader
          :current-session-title="currentSessionTitle"
          :current-session-npc="currentSessionNpc"
          :favorability="favorability"
          :relationship-level="relationshipLevel"
          :show-favor-change="showFavorChange"
          :favor-change-value="favorChangeValue"
          @exit="exitSession"
        />

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

          <!-- 立绘拖动热区：仅右侧两种模式、右侧 300px 留出 6px 给滚动条，不遮挡滚动条 -->
          <div
            v-if="currentIllustrationUrl && !illustrationError && (illustrationMode === 'right-docked' || illustrationMode === 'right-center')"
            class="absolute bottom-0 right-[6px] w-[294px] h-[600px] z-20"
            :class="illustrationDragging ? 'cursor-grabbing' : 'cursor-grab'"
            @mousedown.prevent="onIllustrationDragStart"
          />

          <!-- NPC 立绘：在聊天下方 z-0，遮罩用于凸显对话、不遮挡聊天 -->
          <div
            v-if="currentIllustrationUrl && !illustrationError"
            class="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-200"
            :class="illustrationReady ? 'opacity-100' : 'opacity-0'"
          >
            <!-- 后台预加载新表情，不参与布局 -->
            <img
              v-if="illustrationPendingUrl"
              ref="illustrationPendingImgRef"
              :src="illustrationPendingUrl"
              class="absolute opacity-0 w-0 h-0 pointer-events-none"
              aria-hidden="true"
              @load="onPendingIllustrationLoad"
              @error="onPendingIllustrationError"
            />
            <div
              ref="illustrationContainerRef"
              class="absolute bottom-0 left-0 right-0 h-[600px] overflow-hidden"
            >
              <img
                ref="illustrationImgRef"
                :src="illustrationDisplayUrl"
                :alt="currentSessionNpc"
                class="absolute top-0 opacity-90"
                :style="illustrationImgStyle"
                @load="onDisplayIllustrationLoad"
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
            @scroll="onChatScroll"
          >
            <!-- 顶部：加载更早消息 -->
            <div
              v-if="hasMoreHistory || loadingMoreHistory"
              class="flex justify-center py-2"
            >
              <button
                v-if="!loadingMoreHistory"
                type="button"
                class="text-xs font-mono text-[#00ff41]/80 hover:text-[#00ff41] border border-[#00ff41]/40 hover:border-[#00ff41]/60 rounded px-3 py-1.5 transition-colors"
                @click="loadMoreHistory"
              >
                加载更早消息
              </button>
              <span v-else class="text-xs font-mono text-[#555555] animate-pulse">正在加载更早消息…</span>
            </div>
            <!-- 历史消息：按块渲染，单独成段的【】脱离气泡偏左/偏右 -->
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="flex flex-col gap-0.5"
            >
              <!-- 占位/加载中：整条为占位时只显示一条气泡，不拆块 -->
              <template v-if="isLoadingPlaceholder(msg.content)">
                <div class="flex" :class="msg.role === 'user' ? 'justify-start' : 'justify-end'">
                  <div class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                    <div class="relative">
                      <div
                        class="pointer-events-none absolute inset-0 -m-6 rounded-2xl opacity-80 blur-[14px]"
                        style="background: radial-gradient(circle at 100% 50%, rgba(0,0,0,0.7) 0%, rgba(5,5,5,0.58) 34%, rgba(5,5,5,0.3) 70%, transparent 100%);"
                      ></div>
                      <div class="relative bg-[#0b0b0b] border border-[#00ffff]/40 rounded-lg p-3">
                        <p class="text-sm whitespace-pre-wrap text-[#555555] animate-pulse">{{ msg.content }}</p>
                        <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                      </div>
                    </div>
                    <div class="relative flex-shrink-0">
                      <div
                        class="absolute inset-0 -m-8 rounded-full opacity-90 blur-[14px] pointer-events-none"
                        style="background: radial-gradient(circle, rgba(0,0,0,0.82) 0%, rgba(5,5,5,0.72) 35%, rgba(5,5,5,0.36) 70%, transparent 100%);"
                      ></div>
                      <div
                        class="absolute inset-0 -m-1 rounded-full opacity-70 blur-[3px] pointer-events-none"
                        style="background: radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(0,255,255,0.35) 35%, transparent 70%);"
                      ></div>
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
              </template>

              <!-- 正常消息：按块渲染 -->
              <template v-else>
                <template v-for="(block, blockIdx) in messageToBlocks(msg.content)" :key="blockIdx">
                  <!-- 单独成段的动作：与气泡左右对齐，上下居中留白，层级高于气泡光晕 -->
                  <div
                    v-if="block.type === 'standalone'"
                    class="flex mt-5 mb-1 relative z-10"
                    :class="msg.role === 'user' ? 'justify-start' : 'justify-end'"
                  >
                    <div class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                      <!-- 用户：头像占位 + 动作文字，与气泡左缘对齐 -->
                      <template v-if="msg.role === 'user'">
                        <div class="w-10 h-10 flex-shrink-0" aria-hidden="true" />
                        <div class="text-sm whitespace-pre-wrap min-w-0">
                          <span
                            v-for="(node, idx) in parseActionNodes(block.content)"
                            :key="idx"
                            :class="node.type === 'action'
                              ? 'message-standalone-action'
                              : 'text-gray-300 font-normal'"
                          >{{ node.content }}</span>
                        </div>
                      </template>
                      <!-- NPC：动作文字 + 头像占位，与气泡右缘对齐 -->
                      <template v-else>
                        <div class="text-sm whitespace-pre-wrap min-w-0">
                          <span
                            v-for="(node, idx) in parseActionNodes(block.content)"
                            :key="idx"
                            :class="node.type === 'action'
                              ? 'message-standalone-action message-standalone-action-npc'
                              : 'text-[#00ffff] font-normal'"
                          >{{ node.content }}</span>
                        </div>
                        <div class="w-14 h-14 flex-shrink-0" aria-hidden="true" />
                      </template>
                    </div>
                  </div>

                  <!-- 气泡段落 -->
                  <div
                    v-else-if="block.type === 'bubble' && block.content.trim()"
                    class="flex"
                    :class="msg.role === 'user' ? 'justify-start' : 'justify-end'"
                  >
                    <!-- 玩家消息（左侧） -->
                    <div v-if="msg.role === 'user'" class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                      <div class="w-10 h-10 rounded-full bg-[#00ff41]/20 border border-[#00ff41]/50 flex items-center justify-center flex-shrink-0">
                        <span class="text-[#00ff41] text-xs">你</span>
                      </div>
                      <div class="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3">
                        <p class="text-sm whitespace-pre-wrap">
                          <span
                            v-for="(node, idx) in parseActionNodes(block.content)"
                            :key="idx"
                            :class="node.type === 'action' ? 'message-action-text message-action-inline' : 'text-gray-300'"
                          >{{ node.content }}</span>
                        </p>
                        <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                      </div>
                    </div>

                    <!-- NPC消息（右侧） -->
                    <div v-else class="flex items-start gap-4" :class="chatBubbleMaxWidthClass">
                      <div class="relative">
                        <div
                          class="pointer-events-none absolute inset-0 -m-6 rounded-2xl opacity-80 blur-[14px]"
                          style="background: radial-gradient(circle at 100% 50%, rgba(0,0,0,0.7) 0%, rgba(5,5,5,0.58) 34%, rgba(5,5,5,0.3) 70%, transparent 100%);"
                        ></div>
                        <div class="relative bg-[#0b0b0b] border border-[#00ffff]/40 rounded-lg p-3">
                          <p class="text-sm whitespace-pre-wrap">
                            <span
                              v-for="(node, idx) in parseActionNodes(block.content)"
                              :key="idx"
                              :class="node.type === 'action' ? 'message-action-text message-action-text-npc message-action-inline' : 'text-[#00ffff]'"
                            >{{ node.content }}</span>
                          </p>
                          <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                        </div>
                      </div>
                      <div class="relative flex-shrink-0">
                        <div
                          class="absolute inset-0 -m-8 rounded-full opacity-90 blur-[14px] pointer-events-none"
                          style="background: radial-gradient(circle, rgba(0,0,0,0.82) 0%, rgba(5,5,5,0.72) 35%, rgba(5,5,5,0.36) 70%, transparent 100%);"
                        ></div>
                        <div
                          class="absolute inset-0 -m-1 rounded-full opacity-70 blur-[3px] pointer-events-none"
                          style="background: radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(0,255,255,0.35) 35%, transparent 70%);"
                        ></div>
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
                </template>
              </template>
            </div>

            <!-- Loading 状态：仅当「最后一条不是助手消息」时显示，避免与占位 NPC 消息重复成两条 -->
            <div v-if="isLoading && (chatMessages.length === 0 || chatMessages[chatMessages.length - 1]?.role !== 'assistant')" class="flex justify-end items-center gap-3">
              <div class="bg-[#111111] border border-[#00ffff]/30 rounded-lg p-3">
                <p class="text-[#555555] text-sm animate-pulse">
                  {{ isFirstMessage ? '[首次连接，等待终端加载...]' : '[正在链接终端...]' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 发送消息区域：仅主输入行占位；动作条悬浮在上方，不顶高布局 -->
        <div class="relative p-4 border-t border-[#333333] bg-[#111111]/50">
          <!-- 悬浮动作条：绝对定位在输入框上方，不占文档流 -->
          <div
            class="action-strip absolute left-4 z-20 flex items-center gap-2 transition-[width] duration-200"
            :class="actionInputExpanded ? 'w-[95%] max-w-[730px]' : ''"
          >
            <button
              type="button"
              class="action-toggle-btn flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#666666] hover:text-[#00ff41] transition-colors duration-200"
              :aria-label="actionInputExpanded ? '收起动作输入' : '展开动作输入'"
              @click="actionInputExpanded = !actionInputExpanded"
            >
              <svg
                class="w-4 h-4 transition-transform duration-300 ease-out"
                :class="actionInputExpanded ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <Transition name="action-input">
              <div v-show="actionInputExpanded" class="flex-1 min-w-0 relative flex items-center">
                <input
                  v-model="actionInput"
                  type="text"
                  placeholder="输入动作..."
                  maxlength="250"
                  class="action-floating-input w-full pr-[3.9rem] bg-[#0f0f0f]/95 text-[#888888] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00ff41]/50 placeholder-[#444444] shadow-lg"
                  :disabled="isLoading"
                  @keyup.enter="focusMainInput"
                />
                <span
                  v-show="actionInput.length >= 150"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555555] pointer-events-none tabular-nums"
                >{{ actionInput.length }}/250</span>
              </div>
            </Transition>
          </div>
          <div class="flex gap-3 items-center">
            <div class="flex-1 min-w-0 relative">
              <input
                ref="mainInputRef"
                v-model="inputMessage"
                type="text"
                placeholder="输入消息..."
                maxlength="500"
                class="w-full bg-[#1a1a1a] text-[#00ff41] border border-[#333333] rounded-lg pl-4 pr-[4.2rem] py-3 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
                :disabled="isLoading"
                @keyup.enter="sendChatMessage"
              />
              <span
                v-show="inputMessage.length >= 300"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555555] pointer-events-none tabular-nums"
              >{{ inputMessage.length }}/500</span>
            </div>
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
      <NpcCandidateView
        v-else
        :has-core-settings="hasCoreSettings"
        :player-identity="playerStore.playerIdentity"
        :loading-sessions="loadingSessions"
        :validating-npcs="validatingNpcs"
        :valid-npc-candidates="validNpcCandidates"
        :npcs-with-failed-avatar="npcsWithFailedAvatar"
        :handle-avatar-error="handleAvatarError"
        @open-settings="showSettings = true"
        @open-new-session="openNewSessionModal"
      />
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
import SessionSidebar from '../components/SessionSidebar.vue'
import ChatHeader from '../components/ChatHeader.vue'
import NpcCandidateView from '../components/NpcCandidateView.vue'
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
  sendMessageStream,
  getNPCFavorability,
  updateSessionTitle,
  deleteSession,
  type Session,
  type ChatMessage
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

// 历史记录分页懒加载：每页条数、已加载偏移、是否还有更早、是否正在加载更早
const HISTORY_PAGE_SIZE = 50
const historyOffset = ref(0)
const hasMoreHistory = ref(false)
const loadingMoreHistory = ref(false)

// 聊天相关状态
const chatMessages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const actionInputExpanded = ref(false)
const actionInput = ref('')
const mainInputRef = ref<HTMLInputElement | null>(null)
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
const illustrationPendingImgRef = ref<HTMLImageElement | null>(null)
// 立绘 img 实际渲染宽高（先按 y 缩到 600 后，若再被容器缩放则用于修正 centerPx/rightPx）
const illustrationImgRenderedWidth = ref(0)
// 等边界算完（或失败）后再显示立绘，避免错位闪现
const illustrationReady = ref(false)
// 当前真正显示出来的立绘 URL（仅在新图就绪后替换，避免先隐藏再显示导致闪烁）
const illustrationDisplayUrl = ref('')
// 正在后台加载的新表情 URL，加载并算完边界后再赋给 illustrationDisplayUrl
const illustrationPendingUrl = ref('')
// 立绘手动偏移（拖动后叠加在三种模式的位置上）；点三个模式按钮时重置为 0
const illustrationOffset = ref({ x: 0, y: 0 })
const illustrationDragging = ref(false)

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
  const ox = illustrationOffset.value.x
  const oy = illustrationOffset.value.y
  return {
    width: `${ILLUST_DISPLAY_WIDTH}px`,
    height: `${ILLUST_SCALED_HEIGHT}px`,
    minWidth: `${ILLUST_DISPLAY_WIDTH}px`,
    maxWidth: 'none',
    top: '0',
    left,
    transform: `translate(${ox}px, ${oy}px)`
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

// 可见立绘 img load：更新渲染尺寸；若尚无边界（如刷新后首帧直接显示）则用本图算边界
async function onDisplayIllustrationLoad(event: Event) {
  const img = event.target as HTMLImageElement
  const url = illustrationDisplayUrl.value
  if (img && url && !illustrationContentBounds.value) {
    const bounds = await getIllustrationContentBounds(img, url)
    if (bounds && illustrationDisplayUrl.value === url) {
      illustrationContentBounds.value = bounds
    }
  }
  nextTick(() => updateIllustrationImgRenderedSize())
}

// 后台预加载的新表情 load：算边界后赋给 displayUrl，再替换显示，避免先隐再显
async function onPendingIllustrationLoad() {
  const img = illustrationPendingImgRef.value
  const url = illustrationPendingUrl.value
  if (!img || !url || currentIllustrationUrl.value !== url) return
  const bounds = await getIllustrationContentBounds(img, url)
  if (currentIllustrationUrl.value !== url) return
  if (bounds) {
    illustrationContentBounds.value = bounds
  }
  illustrationDisplayUrl.value = url
  illustrationPendingUrl.value = ''
  illustrationReady.value = true
  nextTick(() => updateIllustrationImgRenderedSize())
}

// 后台预加载立绘失败（如 404）：标记当前 NPC+情绪 无效并隐藏立绘
function onPendingIllustrationError() {
  illustrationPendingUrl.value = ''
  handleIllustrationError()
}

// 切换立绘布局模式（同时重置手动偏移）
const setIllustrationMode = (mode: 'global-center' | 'right-docked' | 'right-center') => {
  illustrationMode.value = mode
  illustrationOffset.value = { x: 0, y: 0 }
}

// 立绘拖动：在 600px 容器上按下并移动时叠加偏移
function onIllustrationDragStart(e: MouseEvent) {
  if (!illustrationDisplayUrl.value) return
  e.preventDefault()
  illustrationDragging.value = true
  const startX = e.clientX
  const startY = e.clientY
  const start = { ...illustrationOffset.value }
  const onMove = (e2: MouseEvent) => {
    const dy = start.y + (e2.clientY - startY)
    // 向上最多移 10px，避免无下身立绘穿帮；向下不限制
    illustrationOffset.value = {
      x: start.x + (e2.clientX - startX),
      y: Math.max(-5, dy)
    }
  }
  const onUp = () => {
    illustrationDragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// 立绘 URL 变化：有缓存则直接切到 displayUrl；无缓存时若当前无显示则立即显示（避免依赖 pending load 偶发不触发），有显示则后台预加载再替换
watch(currentIllustrationUrl, (url) => {
  if (!url) {
    illustrationDisplayUrl.value = ''
    illustrationPendingUrl.value = ''
    illustrationContentBounds.value = null
    illustrationReady.value = false
    return
  }
  const cached = illustrationBoundsCache.get(url)
  if (cached) {
    illustrationContentBounds.value = cached
    illustrationDisplayUrl.value = url
    illustrationPendingUrl.value = ''
    illustrationReady.value = true
    return
  }
  if (illustrationDisplayUrl.value) {
    // 已有立绘：切表情时用 pending 预加载，就绪后再替换，不先隐藏
    illustrationPendingUrl.value = url
    return
  }
  // 无缓存且当前无显示（如刷新后首帧）：立即显示，用默认边界；可见 img load 后再算边界，避免依赖隐藏图 load 偶发不触发
  illustrationDisplayUrl.value = url
  illustrationPendingUrl.value = ''
  illustrationContentBounds.value = null
  illustrationReady.value = true
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

  // 加载历史记录（首页）和NPC好感度（并行）
  historyOffset.value = 0
  hasMoreHistory.value = false
  loadingMoreHistory.value = false
  try {
    const [history, favorabilityData] = await Promise.all([
      getSessionHistory(sessionId, HISTORY_PAGE_SIZE, 0),
      session ? getNPCFavorability(session.npc_name) : Promise.resolve(null)
    ])
    // 后端若返回时间正序（最早在前），直接使用；若返回倒序（最新在前），需 reverse。此处按正序展示（最早在上、最新在下）
    const raw = history.messages || []
    const first = raw.length > 0 ? raw[0] : undefined
    const last = raw.length > 0 ? raw[raw.length - 1] : undefined
    const firstBatch =
      first != null && last != null && first.timestamp >= last.timestamp
        ? raw.slice().reverse()
        : raw.slice()
    chatMessages.value = firstBatch
    historyOffset.value = firstBatch.length
    hasMoreHistory.value = firstBatch.length >= HISTORY_PAGE_SIZE
    if (history.messages.length > 0) {
      isFirstMessage.value = false
    }

    // 设置好感度信息
    if (favorabilityData) {
      favorability.value = favorabilityData.favorability
      relationshipLevel.value = favorabilityData.relationship_level
    }

    // 滚动到底部：等多帧布局完成后再滚，避免长列表未渲染完时 scrollHeight 不准
    await nextTick()
    scrollToBottom()
    if (firstBatch.length > 10) {
      setTimeout(scrollToBottom, 80)
    }
  } catch (error) {
    console.error('Failed to load session data:', error)
  }
}

// 加载更早的历史消息（滚动到顶时调用，不设总条数上限，由后端返回不足一页时结束）
const loadMoreHistory = async () => {
  if (!currentSessionId.value || loadingMoreHistory.value || !hasMoreHistory.value) return
  const nextOffset = historyOffset.value
  loadingMoreHistory.value = true
  const container = chatContainer.value
  const oldScrollHeight = container?.scrollHeight ?? 0
  const oldScrollTop = container?.scrollTop ?? 0
  try {
    const history = await getSessionHistory(currentSessionId.value, HISTORY_PAGE_SIZE, nextOffset)
    const rawOlder = history.messages || []
    const firstOlder = rawOlder.length > 0 ? rawOlder[0] : undefined
    const lastOlder = rawOlder.length > 0 ? rawOlder[rawOlder.length - 1] : undefined
    const olderBatch =
      firstOlder != null && lastOlder != null && firstOlder.timestamp >= lastOlder.timestamp
        ? rawOlder.slice().reverse()
        : rawOlder.slice()
    if (olderBatch.length === 0) {
      hasMoreHistory.value = false
      return
    }
    const currentOldestId = chatMessages.value[0]?.id
    const newOldestId = olderBatch[0]?.id
    if (currentOldestId !== undefined && newOldestId === currentOldestId) {
      hasMoreHistory.value = false
      return
    }
    chatMessages.value = [...olderBatch, ...chatMessages.value]
    historyOffset.value += olderBatch.length
    if (olderBatch.length < HISTORY_PAGE_SIZE) {
      hasMoreHistory.value = false
    }
    await nextTick()
    if (container) {
      const newScrollHeight = container.scrollHeight
      container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight)
    }
  } finally {
    loadingMoreHistory.value = false
  }
}

// 滚动到顶时触发加载更早消息（节流）
let scrollLoadMoreScheduled = false
const SCROLL_LOAD_MORE_THRESHOLD = 120
const onChatScroll = () => {
  const el = chatContainer.value
  if (!el || !hasMoreHistory.value || loadingMoreHistory.value) return
  if (scrollLoadMoreScheduled) return
  if (el.scrollTop > SCROLL_LOAD_MORE_THRESHOLD) return
  scrollLoadMoreScheduled = true
  loadMoreHistory().finally(() => {
    scrollLoadMoreScheduled = false
  })
}

// 退出会话
const exitSession = () => {
  currentSessionId.value = ''
  chatMessages.value = []
  favorability.value = null
  relationshipLevel.value = ''
  currentEmotion.value = '普通'
  illustrationError.value = false
  historyOffset.value = 0
  hasMoreHistory.value = false
  loadingMoreHistory.value = false
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

  const actionPart = actionInput.value.trim()
  const dialoguePart = inputMessage.value.trim()
  const message = actionPart ? `【${actionPart}】\n${dialoguePart}` : dialoguePart
  inputMessage.value = ''
  actionInput.value = ''
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

  // 一条占位 NPC 消息，先显示「正在链接终端...」，收到首段流式内容后在同一条里做打字机
  const placeholderText = isFirstMessage.value ? '[首次连接，等待终端加载...]' : '[正在链接终端...]'
  const npcMsg: ChatMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: placeholderText,
    timestamp: Math.floor(Date.now() / 1000)
  }
  chatMessages.value.push(npcMsg)
  const npcMsgIndex = chatMessages.value.length - 1

  try {
    const payload: Parameters<typeof sendMessageStream>[0] = {
      query: message,
      npc_name: currentSessionNpc.value,
      session_id: currentSessionId.value,
      player_identity: playerStore.playerIdentity || null,
      api_key: playerStore.api_key || null,
      api_base: playerStore.api_base || null,
      model_name: playerStore.model_name || null,
      proxy_url: playerStore.proxy_url || null,
      summarize_interval: playerStore.summarize_interval ?? null
    }
    if (currentEmotion.value?.trim()) {
      payload.current_emotion = currentEmotion.value.trim()
    }

    await sendMessageStream(payload, {
      onContent(delta) {
        const msg = chatMessages.value[npcMsgIndex]
        if (!msg) return
        // 第一次收到内容时用 delta 替换占位符，之后追加（打字机）
        if (msg.content === placeholderText) {
          msg.content = delta
        } else {
          msg.content += delta
        }
        nextTick().then(scrollToBottom)
      },
      onDone(data) {
        const msg = chatMessages.value[npcMsgIndex]
        // 仅当最终回复与当前内容不同时才更新，避免重复赋值导致闪烁
        if (msg && msg.content !== data.reply) {
          msg.content = data.reply
        }
        const prevFavor = favorability.value
        favorability.value = data.favorability
        relationshipLevel.value = data.relationship_level
        if (prevFavor !== null && data.favorability_change !== 0) {
          favorChangeValue.value = data.favorability_change
          showFavorChange.value = true
          setTimeout(() => {
            showFavorChange.value = false
          }, 2000)
        }
        currentEmotion.value = data.emotion
        illustrationError.value = false
        isFirstMessage.value = false
        nextTick().then(scrollToBottom)
      },
      onError(error) {
        const msg = chatMessages.value[npcMsgIndex]
        if (msg) msg.content = `[系统] ${error}`
        nextTick().then(scrollToBottom)
      }
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    const msg = chatMessages.value[npcMsgIndex]
    if (msg) {
      msg.content = '[系统] 连接终端失败，请检查网络或API配置'
    } else {
      chatMessages.value.push({
        id: Date.now() + 2,
        role: 'assistant',
        content: '[系统] 连接终端失败，请检查网络或API配置',
        timestamp: Math.floor(Date.now() / 1000)
      })
    }
    nextTick().then(scrollToBottom)
  } finally {
    isLoading.value = false
  }
}

// 是否为「等待终端」占位文案（用于在气泡上显示加载动画）
const isLoadingPlaceholder = (content: string) =>
  content === '[首次连接，等待终端加载...]' || content === '[正在链接终端...]'

// 流式/静态消息解析：【】内为动作描写，方括号不显示，仅内容用 action 样式
type ContentNode = { type: 'action' | 'text'; content: string }
const parseActionNodes = (text: string): ContentNode[] => {
  if (!text) return []
  const nodes: ContentNode[] = []
  let isAction = false
  let currentBuffer = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '【') {
      if (currentBuffer) {
        nodes.push({ type: isAction ? 'action' : 'text', content: currentBuffer })
        currentBuffer = ''
      }
      isAction = true
      // 不把【加入 content
    } else if (char === '】') {
      nodes.push({ type: 'action', content: currentBuffer })
      currentBuffer = ''
      isAction = false
      // 不把】加入 content
    } else {
      currentBuffer += char
    }
  }
  if (currentBuffer) {
    nodes.push({ type: isAction ? 'action' : 'text', content: currentBuffer })
  }
  return nodes
}

const focusMainInput = () => {
  mainInputRef.value?.focus()
}

// 将消息内容拆成「单独成段动作」与「气泡内段落」；以【开头的行在】后强制分段，】后内容进气泡
type MessageBlock = { type: 'standalone' | 'bubble'; content: string }
const messageToBlocks = (content: string): MessageBlock[] => {
  if (!content) return [{ type: 'bubble', content: '' }]
  const lines = content.split('\n')
  const blocks: MessageBlock[] = []
  let bubbleBuffer = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmedStart = line.trimStart()
    if (trimmedStart.startsWith('【')) {
      if (bubbleBuffer) {
        blocks.push({ type: 'bubble', content: bubbleBuffer })
        bubbleBuffer = ''
      }
      const closeIdx = line.indexOf('】')
      if (closeIdx >= 0) {
        blocks.push({ type: 'standalone', content: line.slice(0, closeIdx + 1) })
        const rest = line.slice(closeIdx + 1).trim()
        if (rest) bubbleBuffer = rest
      } else {
        blocks.push({ type: 'standalone', content: line })
      }
    } else {
      if (bubbleBuffer) bubbleBuffer += '\n' + line
      else bubbleBuffer = line
    }
  }
  if (bubbleBuffer) blocks.push({ type: 'bubble', content: bubbleBuffer })
  return blocks.length ? blocks : [{ type: 'bubble', content: '' }]
}

// 滚动到底部：使用双 RAF 确保在浏览器完成新内容布局后再滚动，避免上移不足一屏
const scrollToBottom = () => {
  if (!chatContainer.value) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  })
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

/* 悬浮动作条：绝对定位在输入行上方，不占文档流、不顶高布局 */
.action-strip {
  bottom: 100%;
  margin-bottom: 6px;
  transition: opacity 0.2s ease;
}
.action-floating-input {
  backdrop-filter: blur(6px);
}
/* 动作输入框展开/收起动画 */
.action-input-enter-active,
.action-input-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.action-input-enter-from,
.action-input-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 动作/心理/神态描写：灰色、斜体、略小，与对话区分；【】不显示，由 parseActionNodes 已剥离 */
.message-action-text {
  color: #888;
  font-style: italic;
  font-size: 0.9em;
}
/* 段落中间的动作与前后文字留出间距 */
.message-action-inline {
  margin-left: 0.55em;
  margin-right: 0.55em;
}
/* NPC 气泡内的动作描写：保持与主题一致的低饱和度 */
.message-action-text-npc {
  color: #6ab7b7;
}
/* 单独成段的动作行：脱离气泡，偏左/偏右；z-index 高于气泡光晕，便于被光晕衬托 */
.message-standalone-action {
  color: #888;
  font-style: italic;
  font-size: 0.85em;
  padding: 2px 0;
}
.message-standalone-action-npc {
  color: #6ab7b7;
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
