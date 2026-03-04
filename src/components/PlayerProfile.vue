<template>
  <div class="bg-gray-800 border border-green-500 rounded-lg p-6 mb-6">
    <h3 class="text-xl font-bold mb-4 text-green-400">佣兵档案</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium mb-1 text-green-300">性别</label>
        <select
          v-model="playerStore.gender"
          @change="playerStore.saveToLocalStorage"
          class="bg-gray-900 text-green-400 border border-green-600 rounded px-3 py-2 w-full"
        >
          <option :value="Gender.MALE">男</option>
          <option :value="Gender.FEMALE">女</option>
          <option :value="Gender.UNKNOWN">未知性别</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-green-300">当前进度</label>
        <select
          v-model="playerStore.progress"
          @change="playerStore.saveToLocalStorage"
          class="bg-gray-900 text-green-400 border border-green-600 rounded px-3 py-2 w-full"
        >
          <option :value="Progress.WASTED_CITY">废城</option>
          <option :value="Progress.FALLEN_CITY">堕落城</option>
          <option :value="Progress.WARLORD">军阀</option>
          <option :value="Progress.BLACK_IRON_HQ">黑铁会总堂</option>
          <option :value="Progress.NOAH">诺亚</option>
          <option :value="Progress.SNOW_MOUNTAIN">雪山</option>
        </select>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-1 text-green-300">一句话介绍</label>
      <input
        v-model="playerStore.bio"
        @input="playerStore.saveToLocalStorage"
        type="text"
        maxlength="20"
        placeholder="可不填，上限20字"
        class="bg-gray-900 text-green-400 border border-green-600 rounded px-3 py-2 w-full"
      />
    </div>

    <div class="bg-gray-900 p-4 rounded border border-red-600 mb-4">
      <h4 class="font-medium text-red-400 mb-2">API 配置</h4>
      <div class="space-y-2">
        <div>
          <label class="block text-xs font-medium mb-1 text-green-300">模型名称</label>
          <input
            v-model="playerStore.model_name"
            @input="handleModelNameChange"
            type="text"
            placeholder="如: gemini-pro, deepseek-chat, kimi"
            class="bg-gray-800 text-green-400 border border-green-600 rounded px-3 py-2 w-full text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-green-300">API Base URL (自动推导或手动输入)</label>
          <input
            v-model="playerStore.api_base"
            @input="playerStore.saveToLocalStorage"
            type="text"
            placeholder="如未设置，需在后端.env文件配置"
            class="bg-gray-800 text-green-400 border border-green-600 rounded px-3 py-2 w-full text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-green-300">API Key</label>
          <input
            v-model="playerStore.api_key"
            @input="playerStore.saveToLocalStorage"
            type="password"
            placeholder="可不填，但不填时提醒可能无法使用对话"
            class="bg-gray-800 text-green-400 border border-green-600 rounded px-3 py-2 w-full text-sm"
          />
        </div>
      </div>
    </div>

    <div class="bg-gray-900 p-4 rounded border border-cyan-600">
      <h4 class="font-medium text-cyan-400 mb-2">佣兵身份</h4>
      <p class="text-cyan-300 text-sm">{{ playerStore.playerIdentity }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore, Gender, Progress } from '../stores/player'

const playerStore = usePlayerStore()

const handleModelNameChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  playerStore.updateModelName(target.value)
  playerStore.saveToLocalStorage()
}
</script>
