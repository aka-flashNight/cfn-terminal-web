<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"

    >
    <!-- @click.self="$emit('update:modelValue', false)" -->
      <!-- 扫描线背景效果 -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="scanline-overlay"></div>
      </div>

      <div
        class="relative w-full max-w-2xl bg-[#0a0a0a]/95 border rounded-lg shadow-2xl overflow-hidden"
        :class="isFirstLoad ? 'border-[#ff0040] shadow-[#ff0040]/20' : 'border-[#00ff41]/50 shadow-[#00ff41]/10'"
      >
        <!-- 头部 -->
        <div class="p-6 border-b"
             :class="isFirstLoad ? 'border-[#ff0040]/50' : 'border-[#00ff41]/30'"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold flex items-center gap-3 font-mono"
                 :class="isFirstLoad ? 'text-[#ff0040]' : 'text-[#00ff41]'"
            >
              <span class="text-2xl">⚙️</span>
              <span>> 佣兵档案配置</span>
              <span
                v-if="isFirstLoad"
                class="text-xs bg-[#ff0040]/20 text-[#ff0040] px-2 py-1 rounded border border-[#ff0040]/50 animate-pulse"
              >
                [首次使用需配置]
              </span>
            </h2>
            <button
              @click="$emit('update:modelValue', false)"
              class="text-[#555555] hover:text-[#ff0040] text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <!-- 内容 -->
        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <form @submit.prevent="handleSave" class="space-y-5">
            <!-- 性别 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > 性别 <span class="text-[#ff0040]">*</span>
              </label>
              <div class="flex gap-4">
                <label class="flex items-center cursor-pointer group">
                  <input
                    v-model="formData.gender"
                    type="radio"
                    :value="Gender.MALE"
                    class="mr-2 accent-[#00ff41]"
                  />
                  <span class="text-gray-400 group-hover:text-[#00ff41] transition-colors">男</span>
                </label>
                <label class="flex items-center cursor-pointer group">
                  <input
                    v-model="formData.gender"
                    type="radio"
                    :value="Gender.FEMALE"
                    class="mr-2 accent-[#00ff41]"
                  />
                  <span class="text-gray-400 group-hover:text-[#00ff41] transition-colors">女</span>
                </label>
                <label class="flex items-center cursor-pointer group">
                  <input
                    v-model="formData.gender"
                    type="radio"
                    :value="Gender.UNKNOWN"
                    class="mr-2 accent-[#00ff41]"
                  />
                  <span class="text-gray-500 group-hover:text-[#00ff41] transition-colors">未知性别</span>
                </label>
              </div>
            </div>

            <!-- 当前进度 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > 当前进度 <span class="text-[#ff0040]">*</span>
              </label>
              <select
                v-model="formData.progress"
                class="w-full bg-[#111111] text-[#00ff41] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all"
              >
                <option :value="Progress.WASTED_CITY">废城</option>
                <option :value="Progress.FALLEN_CITY">堕落城</option>
                <option :value="Progress.WARLORD">军阀</option>
                <option :value="Progress.BLACK_IRON_HQ">黑铁会总堂</option>
                <option :value="Progress.NOAH">诺亚</option>
                <option :value="Progress.SNOW_MOUNTAIN">雪山</option>
                <option :value="Progress.CLEARED">已通关</option>
              </select>
            </div>

            <!-- 一句话介绍 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > 一句话介绍
              </label>
              <input
                v-model="formData.bio"
                type="text"
                maxlength="30"
                placeholder="可不填，上限 30 字"
                class="w-full bg-[#111111] text-[#00ffff] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all placeholder-[#444444]"
              />
              <div class="text-right text-xs text-[#555555] mt-1">
                {{ formData.bio.length }}/30
              </div>
            </div>

            <!-- 分隔区域：系统配置 -->
            <div class="pt-4 border-t border-[#333333]">
              <h3 class="text-xs font-medium text-[#888888] mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                <span class="w-4 h-[1px] bg-[#555555]"></span>
                系统配置
                <span class="w-4 h-[1px] bg-[#555555]"></span>
              </h3>
            </div>

            <!-- 模型名称 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > 模型名称
                <span class="text-xs text-[#555555] ml-2">(即model的值。填写后，若API Base为空，将自动推导官方 API Base。非官网模型请手动修改)</span>
              </label>
              <div class="relative">
                <input
                  v-model="formData.model_name"
                  type="text"
                  placeholder="例如：deepseek-v4-flash-vision-exp, kimi-k2.5"
                  @blur="handleModelNameBlur"
                  class="w-full bg-[#111111] text-[#00ff41] border border-[#333333] rounded px-3 py-2 pr-10 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
                />
                <button
                  v-if="formData.model_name"
                  type="button"
                  @click="formData.model_name = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#ff0040] text-lg font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              <p class="text-[#555555] text-xs font-mono mt-2">
                [建议] 推荐使用 deepseek-v4-flash-vision-exp（支持图像识别，NPC 立绘可参与对话）。
              </p>
            </div>

            <!-- API Base -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > API Base(兼容 OpenAI 格式)
              </label>
              <div class="relative">
                <input
                  v-model="formData.api_base"
                  type="text"
                  placeholder="请填写API Base，或在后端.env 文件配置，"
                  class="w-full bg-[#111111] text-[#888888] border border-[#333333] rounded px-3 py-2 pr-10 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
                />
                <button
                  v-if="formData.api_base"
                  type="button"
                  @click="formData.api_base = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#ff0040] text-lg font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              <!-- 常见平台快速选择（附属选项） -->
              <div class="mt-3 space-y-2">
                <label class="block text-xs text-[#888888] font-mono">
                  快速选择：
                </label>
                <select
                  v-model="selectedPlatform"
                  @change="handlePlatformChange"
                  class="w-full bg-[#111111] text-[#00ffff] border border-[#333333] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all"
                >
                  <option value="">-- 请选择服务平台 --</option>
                  <option
                    v-for="platform in commonPlatforms"
                    :key="platform.value"
                    :value="platform.value"
                  >
                    {{ platform.label }}
                  </option>
                </select>
                <p class="text-[#555555] text-xs font-mono">
                  [提示] 选择平台后将自动切换 API Base，也可手动修改
                </p>
              </div>
            </div>

            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > API Key
              </label>
              <div class="relative">
                <input
                  v-model="formData.api_key"
                  type="password"
                  placeholder="请填写API Key，或在后端.env 文件配置，否则无法使用对话。"
                  class="w-full bg-[#111111] text-[#ffaa00] border border-[#333333] rounded px-3 py-2 pr-10 focus:outline-none focus:border-[#ffaa00] focus:shadow-[0_0_10px_rgba(255,170,0,0.2)] transition-all placeholder-[#444444]"
                />
                <button
                  v-if="formData.api_key"
                  type="button"
                  @click="formData.api_key = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#ff0040] text-lg font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              <!-- 是否存储 API Key -->
              <div class="mt-3 space-y-2">
                <label class="flex items-center cursor-pointer group">
                  <input
                    v-model="formData.remember_api_key"
                    type="checkbox"
                    class="mr-2 accent-[#00ff41] w-4 h-4"
                  />
                  <span class="text-gray-400 group-hover:text-[#00ff41] transition-colors text-sm">
                    记住 API Key
                  </span>
                </label>

                <!-- 公共电脑警告 -->
                <div
                  v-if="!formData.remember_api_key"
                  class="bg-[#555555]/10 border border-[#555555]/30 rounded p-2"
                >
                  <p class="text-[#888888] text-xs font-mono">
                    [安全提示] API Key 仅在本次会话有效，关闭浏览器后将被清除。
                  </p>
                </div>
                <div
                  v-else
                  class="bg-[#555555]/10 border border-[#555555]/30 rounded p-2"
                >
                  <p class="text-[#888888] text-xs font-mono">
                    [安全提示] API Key 将被保存到浏览器本地存储。在公共电脑上请勿勾选此项。
                  </p>
                </div>
              </div>
            </div>


            <!-- 代理服务器 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > 代理服务器地址
              </label>
              <input
                v-model="formData.proxy_url"
                type="text"
                placeholder="可选，如：http://127.0.0.1:10809"
                class="w-full bg-[#111111] text-[#00ffff] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all placeholder-[#444444]"
              />
              <p class="text-[#555555] text-xs font-mono mt-2">
                [提示] 如需要使用代理访问 AI 服务，可在此填写代理地址；留空则不使用代理或使用系统全局代理
              </p>
            </div>

            <!-- Token 用量（v3 done 事件上报的本会话累计值，可选展示） -->
            <div v-if="lastTurnUsageText">
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > Token 用量（本会话累计）
              </label>
              <p class="text-[#888888] text-sm font-mono">{{ lastTurnUsageText }}</p>
              <p class="text-[#555555] text-xs font-mono mt-2">
                [提示] 来自最近一次对话回合结束时后端上报的累计值；切换会话或刷新页面后重新累计。
              </p>
            </div>

            <!-- 资源管理 -->
            <div class="pt-4 border-t border-[#333333]">
              <h3 class="text-xs font-medium text-[#888888] mb-2 font-mono uppercase tracking-wider flex items-center gap-2">
                <span class="w-4 h-[1px] bg-[#555555]"></span>
                资源管理
                <span class="w-4 h-[1px] bg-[#555555]"></span>
              </h3>
              <p class="text-[#555555] text-xs font-mono mb-3">
                [提示] NPC 立绘已由游戏对话立绘资源体系提供，无需手动生成；重置知识库需消耗数分钟，且对设备硬件占用率较高，非特殊情况下无需重置。
              </p>
              <div class="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  :disabled="resetKnowledgeBaseLoading"
                  @click="runResetKnowledgeBase"
                  class="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#00ff41] text-gray-400 hover:text-[#00ff41] text-sm font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重置知识库
                </button>
              </div>
              <p v-if="resetKnowledgeBaseLoading" class="text-[#00ff41] text-xs font-mono mt-2">
                正在重置知识库，请稍候…
              </p>
              <div
                v-else-if="resetKnowledgeBaseMessage"
                class="mt-2 p-2 rounded text-xs font-mono"
                :class="resetKnowledgeBaseSuccess
                  ? 'bg-[#00ff41]/10 border border-[#00ff41]/50 text-[#00ff41]'
                  : resetKnowledgeBaseDocsIncomplete
                    ? 'bg-amber-500/10 border border-amber-500/50 text-amber-400'
                    : 'bg-[#ff0040]/10 border border-[#ff0040]/50 text-[#ff0040]'"
              >
                {{ resetKnowledgeBaseMessage }}
              </div>
              <div
                v-else-if="resetKnowledgeBaseError"
                class="mt-2 p-2 rounded text-xs font-mono bg-[#ff0040]/10 border border-[#ff0040]/50 text-[#ff0040]"
              >
                {{ resetKnowledgeBaseError }}
              </div>
            </div>

            <!-- 提示信息 -->
            <div
              v-if="isFirstLoad"
              class="bg-[#ff0040]/10 border border-[#ff0040]/50 rounded p-3"
            >
              <p class="text-[#ff0040] text-sm font-mono">
                [WARNING] 您需要填写必要信息才能正常使用对话功能，或在后端.env 文件进行 api 相关配置
              </p>
            </div>

            <!-- 预览 -->
            <div class="bg-[#111111] border border-[#00ffff]/50 rounded p-4">
              <h3 class="text-xs font-medium text-[#00ffff] mb-2 font-mono uppercase tracking-wider">身份预览</h3>
              <p class="text-[#00ff41] text-sm font-mono">{{ previewIdentity }}</p>
            </div>
          </form>
        </div>

        <!-- 底部按钮 -->
        <div class="p-6 border-t border-[#333333] flex justify-end gap-3 bg-[#111111]/50">
          <button
            type="button"
            @click="$emit('update:modelValue', false)"
            class="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#ff0040] text-gray-400 hover:text-[#ff0040] text-sm font-medium rounded transition-all"
          >
            [取消]
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-6 py-2 border text-sm font-medium rounded transition-all flex items-center gap-2"
            :class="isFirstLoad
              ? 'bg-[#ff0040]/20 border-[#ff0040] text-[#ff0040] hover:bg-[#ff0040]/30'
              : 'bg-[#00ff41]/20 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/30'"
          >
            <span v-if="isFirstLoad" class="text-xs animate-pulse">[首次配置]</span>
            <span>保存配置</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlayerStore, Gender, Progress, inferApiBase, PROGRESS_TO_IDENTITY, COMMON_PLATFORMS, getPlatformByValue, inferPlatformFromApiBase } from '../stores/player'
import { resetKnowledgeBase } from '../api/game'
import type { AxiosError } from 'axios'

type GenderType = typeof Gender[keyof typeof Gender]
type ProgressType = typeof Progress[keyof typeof Progress]

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const playerStore = usePlayerStore()

const formData = ref({
  gender: playerStore.gender as GenderType,
  progress: playerStore.progress as ProgressType,
  bio: playerStore.bio,
  api_key: playerStore.api_key,
  api_base: playerStore.api_base,
  model_name: playerStore.model_name,
  proxy_url: playerStore.proxy_url,
  remember_api_key: playerStore.remember_api_key
})

/** 最近一次 done 事件上报的本会话累计 token 用量（无统计时不显示） */
const lastTurnUsageText = computed(() => {
  const usage = playerStore.lastTurnUsage
  if (!usage) return ''
  const parts: string[] = []
  if (typeof usage.prompt_tokens === 'number') parts.push(`输入 ${usage.prompt_tokens}`)
  if (typeof usage.completion_tokens === 'number') parts.push(`输出 ${usage.completion_tokens}`)
  if (typeof usage.cached_tokens === 'number' && usage.cached_tokens > 0) parts.push(`缓存命中 ${usage.cached_tokens}`)
  if (typeof usage.total_tokens === 'number') parts.push(`合计 ${usage.total_tokens}`)
  return parts.join(' / ')
})

const isFirstLoad = ref(false)

// 重置知识库状态（success === false 且 message 含「数据文档不全」时视为文档不全类错误，单独样式）
const resetKnowledgeBaseLoading = ref(false)
const resetKnowledgeBaseMessage = ref('')
const resetKnowledgeBaseSuccess = ref(false)
const resetKnowledgeBaseDocsIncomplete = ref(false)
const resetKnowledgeBaseError = ref('')

// 常见平台列表（排除默认的 empty 选项）
const commonPlatforms = Object.values(COMMON_PLATFORMS)

// 选中的平台
const selectedPlatform = ref('')

// 根据当前 API Base 初始化平台选择
const initPlatformSelection = () => {
  if (formData.value.api_base) {
    const platformValue = inferPlatformFromApiBase(formData.value.api_base)
    if (platformValue) {
      selectedPlatform.value = platformValue
    }
  }
}

// 处理平台变化
const handlePlatformChange = () => {
  if (selectedPlatform.value) {
    const platform = getPlatformByValue(selectedPlatform.value)
    if (platform) {
      formData.value.api_base = platform.baseUrl
    }
  }
}

const previewIdentity = computed(() => {
  const identity = PROGRESS_TO_IDENTITY[formData.value.progress as ProgressType]
  const genderText = formData.value.gender === Gender.UNKNOWN ? '' : formData.value.gender
  const bioText = formData.value.bio ? `，${formData.value.bio}` : ''

  // 只对指定阶段强化“佣兵”后的称号
  const powerDescriptorByProgress: Partial<Record<ProgressType, string>> = {
    [Progress.SNOW_MOUNTAIN]: '，顶级强者',
    [Progress.NOAH]: '，知名强者',
    [Progress.CLEARED]: '，绝世高手'
  }
  const powerText = powerDescriptorByProgress[formData.value.progress as ProgressType] ?? ''

  return `一名 A 兵团${identity}${genderText}佣兵${powerText}${bioText}。`
})

const handleModelNameBlur = () => {
  if (formData.value.model_name && !formData.value.api_base) {
    const inferredBase = inferApiBase(formData.value.model_name)
    if (inferredBase) {
      formData.value.api_base = inferredBase
    }
  }
}

const handleSave = () => {
  // 验证必填项
  if (!formData.value.gender || !formData.value.progress ) {
    alert('请填写必填项（带 * 的项目）')
    return
  }

  // 保存到 store
  playerStore.gender = formData.value.gender
  playerStore.progress = formData.value.progress
  playerStore.bio = formData.value.bio
  playerStore.api_key = formData.value.api_key
  playerStore.api_base = formData.value.api_base
  playerStore.model_name = formData.value.model_name
  playerStore.proxy_url = formData.value.proxy_url
  playerStore.remember_api_key = formData.value.remember_api_key

  // 保存到 localStorage（内部会再规整一次 api_base）
  playerStore.saveToLocalStorage()

  // 关闭弹窗
  emit('update:modelValue', false)
  isFirstLoad.value = false
}

const DOCS_INCOMPLETE_MARKER = '数据文档不全'

const runResetKnowledgeBase = async () => {
  resetKnowledgeBaseError.value = ''
  resetKnowledgeBaseMessage.value = ''
  resetKnowledgeBaseDocsIncomplete.value = false
  resetKnowledgeBaseLoading.value = true
  try {
    const data = await resetKnowledgeBase()
    resetKnowledgeBaseSuccess.value = !!data.success
    resetKnowledgeBaseDocsIncomplete.value = !data.success && !!data.message?.includes(DOCS_INCOMPLETE_MARKER)
    resetKnowledgeBaseMessage.value = data.message ?? (data.success ? '知识库已重置并重新生成。' : '重置失败。')
  } catch (err: unknown) {
    const axiosErr = err as AxiosError<{ detail?: string; success?: boolean; message?: string }>
    const body = axiosErr.response?.data
    const msg = body?.message ?? body?.detail ?? axiosErr.message ?? '重置知识库失败，请稍后重试。'
    const isDocsIncomplete = body?.success === false && typeof body?.message === 'string' && body.message.includes(DOCS_INCOMPLETE_MARKER)
    if (isDocsIncomplete) {
      resetKnowledgeBaseMessage.value = msg
      resetKnowledgeBaseSuccess.value = false
      resetKnowledgeBaseDocsIncomplete.value = true
    } else {
      resetKnowledgeBaseError.value = msg
    }
  } finally {
    resetKnowledgeBaseLoading.value = false
  }
}

// 检查是否是首次加载（根据用户是否保存过配置）
onMounted(() => {
  isFirstLoad.value = !playerStore.hasConfigured
  initPlatformSelection()
})
</script>

<style scoped>
/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 扫描线效果 */
.scanline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(0, 255, 65, 0.02) 50%
  );
  background-size: 100% 4px;
  animation: scanline 8s linear infinite;
}

@keyframes scanline {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100vh);
  }
}

/* 单选框样式 */
input[type="radio"]:checked {
  accent-color: #00ff41;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00ff41;
}
</style>
