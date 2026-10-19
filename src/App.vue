<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from './stores/player'
import { announceEmbeddedReady, isEmbedded } from './utils/embedded'

const playerStore = usePlayerStore()

// 应用加载时从 localStorage 恢复设置
onMounted(() => {
  playerStore.loadFromLocalStorage()
  // 与后端配置对齐：游戏内配置小窗保存的值也会出现在终端设置里
  void playerStore.syncLlmConfigFromBackend()
  // 游戏内嵌面板：通知父面板 iframe 已就绪（无应答依赖）
  announceEmbeddedReady()
})
</script>

<template>
  <div class="w-full h-full bg-[#0a0a0a] text-gray-300" :class="isEmbedded ? 'embedded-mode' : ''">
    <router-view />
  </div>
</template>

<style scoped>
</style>
