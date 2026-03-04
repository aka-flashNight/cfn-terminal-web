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
                maxlength="20"
                placeholder="可不填，上限20字"
                class="w-full bg-[#111111] text-[#00ffff] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all placeholder-[#444444]"
              />
              <div class="text-right text-xs text-[#555555] mt-1">
                {{ formData.bio.length }}/20
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
                <span class="text-xs text-[#555555] ml-2">(填写后时自动推导 API Base)</span>
              </label>
              <input
                v-model="formData.model_name"
                type="text"
                placeholder="例如: gemini-2.5-flash, kimi-k2.5"
                @blur="handleModelNameBlur"
                class="w-full bg-[#111111] text-[#00ff41] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
              />
            </div>

            <!-- API Base -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > API Base(兼容OpenAI格式)
              </label>
              <input
                v-model="formData.api_base"
                type="text"
                placeholder="也可后端.env文件配置"
                class="w-full bg-[#111111] text-[#888888] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
              />
            </div>

            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
                > API Key
              </label>
              <input
                v-model="formData.api_key"
                type="password"
                placeholder="可不填，但不填时可能无法使用对话。也可后端.env文件配置"
                class="w-full bg-[#111111] text-[#ffaa00] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#ffaa00] focus:shadow-[0_0_10px_rgba(255,170,0,0.2)] transition-all placeholder-[#444444]"
              />

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

            <!-- 提示信息 -->
            <div
              v-if="isFirstLoad"
              class="bg-[#ff0040]/10 border border-[#ff0040]/50 rounded p-3"
            >
              <p class="text-[#ff0040] text-sm font-mono">
                [WARNING] 您需要填写必要信息才能正常使用对话功能，或在后端.env文件进行api相关配置
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
import { usePlayerStore, Gender, Progress, inferApiBase, PROGRESS_TO_IDENTITY } from '../stores/player'

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
  remember_api_key: playerStore.remember_api_key
})

const isFirstLoad = ref(false)

const previewIdentity = computed(() => {
  const identity = PROGRESS_TO_IDENTITY[formData.value.progress as ProgressType]
  const genderText = formData.value.gender === Gender.UNKNOWN ? '' : formData.value.gender
  const bioText = formData.value.bio ? `，${formData.value.bio}` : ''

  return `一名A兵团${identity}${genderText}佣兵${bioText}。`
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
  playerStore.remember_api_key = formData.value.remember_api_key

  // 保存到 localStorage
  playerStore.saveToLocalStorage()

  // 关闭弹窗
  emit('update:modelValue', false)
  isFirstLoad.value = false
}

// 检查是否是首次加载（根据用户是否保存过配置）
onMounted(() => {
  isFirstLoad.value = !playerStore.hasConfigured
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
