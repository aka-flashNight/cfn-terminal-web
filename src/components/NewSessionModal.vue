<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="relative w-full max-w-md bg-[#0a0a0a]/95 border border-[#00ff41]/50 rounded-lg shadow-2xl shadow-[#00ff41]/10 overflow-hidden">
        <!-- 头部 -->
        <div class="p-4 border-b border-[#00ff41]/30">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#00ff41] font-mono flex items-center gap-2">
              <span>+</span>
              <span>> 新建会话</span>
            </h2>
            <button
              @click="$emit('update:modelValue', false)"
              class="text-[#555555] hover:text-[#ff0040] text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <!-- 内容 -->
        <div class="p-6">
          <div class="flex items-center gap-4 mb-6">
            <!-- NPC 头像 -->
            <div class="w-16 h-16 rounded border border-[#333333] overflow-hidden flex-shrink-0">
              <img
                :src="avatarUrl"
                :alt="npcName"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
            <div>
              <p class="text-[#888888] text-xs font-mono mb-1">目标 NPC</p>
              <p class="text-[#00ffff] text-lg font-mono">{{ npcName }}</p>
            </div>
          </div>

          <!-- 会话标题输入 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-[#00ff41] font-mono">
              > 会话标题 <span class="text-[#ff0040]">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="输入会话标题"
              class="w-full bg-[#111111] text-[#00ff41] border border-[#333333] rounded px-3 py-2 focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all placeholder-[#444444]"
              @keyup.enter="handleConfirm"
            />
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="p-4 border-t border-[#333333] flex justify-end gap-3 bg-[#111111]/50">
          <button
            type="button"
            @click="$emit('update:modelValue', false)"
            class="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#444444] hover:border-[#ff0040] text-gray-400 hover:text-[#ff0040] text-sm font-medium rounded transition-all"
          >
            [取消]
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="!title.trim() || loading"
            class="px-6 py-2 border text-sm font-medium rounded transition-all flex items-center gap-2"
            :class="loading
              ? 'bg-[#00ff41]/10 border-[#00ff41]/50 text-[#00ff41]/50 cursor-not-allowed'
              : 'bg-[#00ff41]/20 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/30'"
          >
            <span v-if="loading" class="animate-pulse">创建中...</span>
            <span v-else>确定</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAvatarUrl, markAvatarInvalid } from '../api/assets'

const props = defineProps<{
  modelValue: boolean
  npcName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', title: string): void
}>()

const title = ref('')
const avatarUrl = ref('')

// 计算头像 URL
watch(() => props.npcName, (name) => {
  if (name) {
    avatarUrl.value = getAvatarUrl(name)
  }
}, { immediate: true })

// 弹窗打开时初始化标题
watch(() => props.modelValue, (visible) => {
  if (visible && props.npcName) {
    title.value = `和 ${props.npcName} 的对话`
  } else if (!visible) {
    title.value = ''
  }
})

// 处理图片加载失败
const handleImageError = () => {
  // 标记该NPC头像无效，避免后续重复请求
  markAvatarInvalid(props.npcName)
  // 使用默认占位图
  avatarUrl.value = ''
}

const handleConfirm = () => {
  if (!title.value.trim() || props.loading) return
  emit('confirm', title.value.trim())
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
