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
          <button
            v-for="session in sessions"
            :key="session.session_id"
            @click="selectSession(session.session_id)"
            class="w-full text-left p-3 rounded border transition-all"
            :class="currentSessionId === session.session_id
              ? 'bg-[#00ff41]/10 border-[#00ff41]/50 text-[#00ff41]'
              : 'bg-[#1a1a1a] border-transparent text-gray-400 hover:bg-[#252525] hover:text-[#00ff41]'"
          >
            <div class="text-sm font-medium truncate">{{ session.title }}</div>
            <div class="text-xs text-[#555555] mt-1">{{ session.npc_name }}</div>
          </button>
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
          <!-- 可滚动的消息区域 -->
          <div
            ref="chatContainer"
            class="absolute inset-0 overflow-y-auto p-4 space-y-4"
            :class="{ 'pr-[316px]': currentIllustrationUrl && !illustrationError }"
          >
            <!-- 历史消息 -->
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'user' ? 'justify-start' : 'justify-end'"
            >
              <!-- 玩家消息（左侧） -->
              <div v-if="msg.role === 'user'" class="flex items-start gap-3 max-w-[70%]">
                <div class="w-10 h-10 rounded-full bg-[#00ff41]/20 border border-[#00ff41]/50 flex items-center justify-center flex-shrink-0">
                  <span class="text-[#00ff41] text-xs">你</span>
                </div>
                <div class="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3">
                  <p class="text-gray-300 text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                </div>
              </div>

              <!-- NPC消息（右侧） -->
              <div v-else class="flex items-start gap-3 max-w-[70%]">
                <div class="bg-[#111111] border border-[#00ffff]/30 rounded-lg p-3">
                  <p class="text-[#00ffff] text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-[#555555] text-xs mt-1">{{ formatTime(msg.timestamp) }}</p>
                </div>
                <div class="w-14 h-14 rounded-full border-2 border-[#00ffff]/30 overflow-hidden flex-shrink-0 bg-[#0a0a0a]">
                  <img
                    :src="getAvatarUrl(currentSessionNpc)"
                    :alt="currentSessionNpc"
                    class="w-full h-full object-cover"
                    @error="handleAvatarError"
                  />
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

          <!-- NPC 立绘（固定在聊天内容区域右下角，宽度300px，最大高度600px） -->
          <div
            v-if="currentIllustrationUrl && !illustrationError"
            class="absolute bottom-0 right-0 w-[300px] h-[600px] pointer-events-none overflow-hidden flex items-end justify-center z-10"
          >
            <img
              :src="currentIllustrationUrl"
              :alt="currentSessionNpc"
              class="h-auto max-h-[600px] opacity-90"
              style="min-width: 100%; object-fit: cover; object-position: center bottom;"
              @error="handleIllustrationError"
            />
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
        <div v-if="hasCoreSettings" class="mb-8 p-4 bg-[#111111] border border-[#00ffff]/30 rounded max-w-md">
          <p class="text-[#00ffff] text-xs mb-1 font-mono uppercase">当前身份</p>
          <p class="text-[#00ff41] font-mono">{{ playerStore.playerIdentity }}</p>
        </div>

        <!-- 未配置提示 -->
        <div v-else class="mb-8 p-4 bg-[#111111] border border-[#ff0040]/50 rounded max-w-md">
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

          <div v-if="npcCandidates.length === 0" class="text-[#555555] text-sm italic">
            暂无通讯人员
          </div>

          <!-- 头像大小改为 150px，每行显示更多 -->
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            <button
              v-for="npc in npcCandidates.filter(n => !npcsWithFailedAvatar.has(n))"
              :key="npc"
              @click="openNewSessionModal(npc)"
              class="group flex flex-col items-center transition-all"
            >
              <!-- NPC 头像 150x150 -->
              <div class="w-[150px] h-[150px] rounded border border-[#333333] group-hover:border-[#00ff41] overflow-hidden bg-[#0a0a0a] transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                <img
                  :src="getAvatarUrl(npc)"
                  :alt="npc"
                  class="w-full h-full object-cover"
                  @error="(e) => handleAvatarError(e, npc)"
                />
              </div>
              <!-- NPC 名字 -->
              <p class="mt-2 text-center text-gray-400 group-hover:text-[#00ff41] font-mono text-sm truncate max-w-[150px] transition-colors">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { usePlayerStore } from '../stores/player'
import SettingsModal from '../components/SettingsModal.vue'
import NewSessionModal from '../components/NewSessionModal.vue'
import {
  getSessions,
  createSession,
  getSessionHistory,
  sendMessage,
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

// 记录头像加载失败的NPC（用于隐藏无头像的NPC）
const npcsWithFailedAvatar = ref<Set<string>>(new Set())

// 检查是否有核心设置
const hasCoreSettings = computed(() => {
  return playerStore.gender &&
         playerStore.progress
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

// 当前立绘 URL
const currentIllustrationUrl = computed(() => {
  if (!currentSessionNpc.value || illustrationError.value) return ''
  return `http://127.0.0.1:8000/api/assets/illustration/${encodeURIComponent(currentSessionNpc.value)}/${encodeURIComponent(currentEmotion.value)}`
})

// 获取头像 URL
const getAvatarUrl = (npcName: string) => {
  return `http://127.0.0.1:8000/api/assets/avatar/${encodeURIComponent(npcName)}`
}

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
    // 记录头像加载失败的NPC
    if (name && name !== '?') {
      npcsWithFailedAvatar.value.add(name)
    }
  }
}

// 立绘加载失败处理
const handleIllustrationError = () => {
  illustrationError.value = true
}

// 加载会话列表（带重试机制）
const loadSessions = async (isRetry: boolean = false) => {
  loadingSessions.value = true
  try {
    const data = await getSessions()

    // 检查返回数据是否为空（sessions 和 npc_candidates 都为空）
    const isEmpty = !data.sessions || data.sessions.length === 0

    if (isEmpty && !isRetry) {
      // 首次加载为空，5秒后重试
      console.log('初始化返回为空，5秒后重试...')
      setTimeout(() => {
        loadSessions(true)
      }, 5000)
      return
    }

    sessions.value = data.sessions
    npcCandidates.value = data.npc_candidates
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

  // 加载历史记录
  try {
    const history = await getSessionHistory(sessionId)
    chatMessages.value = history.messages
    if (history.messages.length > 0) {
      isFirstMessage.value = false
    }
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load history:', error)
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
    alert('创建会话失败，请检查网络连接')
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
      model_name: playerStore.model_name || null
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

    // 更新情绪（切换立绘）
    currentEmotion.value = response.emotion

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

// 应用加载时
onMounted(() => {
  // 加载会话列表
  loadSessions()

  // 如果核心项目为空，自动弹出设置弹窗
  if (!hasCoreSettings.value) {
    showSettings.value = true
  }
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
