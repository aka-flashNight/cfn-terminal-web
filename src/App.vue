<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from './stores/player'

const playerStore = usePlayerStore()

// 应用加载时从 localStorage 恢复设置
onMounted(() => {
  playerStore.loadFromLocalStorage()
})
</script>

<template>
  <div class="w-full h-full bg-[#0a0a0a] text-gray-300">
    <router-view />
  </div>
</template>

<style scoped>
</style>
