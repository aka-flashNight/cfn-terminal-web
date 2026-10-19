<template>
  <div class="config-window">
    <header class="config-titlebar">
      <div class="config-title">
        <span class="config-title-mark">&gt;</span>
        配置模型 API
      </div>
      <button type="button" class="config-close" aria-label="关闭" @click="handleCancel">×</button>
    </header>

    <div v-if="!ready" class="config-splash">正在读取终端配置…</div>

    <form v-else class="config-body" @submit.prevent="handleSave">
      <p class="config-hint">
        与通讯终端「佣兵档案配置」共用同一份本地配置；保存后对话输入立即解锁。
      </p>

      <label class="config-label">&gt; 模型名称</label>
      <div class="config-field">
        <input
          v-model="form.model_name"
          type="text"
          class="config-input"
          placeholder="例如：deepseek-v4-flash-vision-exp, kimi-k2.5"
          autocomplete="off"
          spellcheck="false"
          @blur="handleModelBlur"
        />
        <button
          v-if="form.model_name"
          type="button"
          class="config-clear"
          aria-label="清空模型名称"
          @click="form.model_name = ''"
        >×</button>
      </div>
      <p class="config-tip">[建议] 推荐使用 deepseek-v4-flash-vision-exp（支持图像识别，NPC 立绘可参与对话）。</p>

      <label class="config-label">&gt; API Base（兼容 OpenAI 格式）</label>
      <div class="config-field">
        <input
          v-model="form.api_base"
          type="text"
          class="config-input"
          placeholder="留空时按模型名自动识别"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          v-if="form.api_base"
          type="button"
          class="config-clear"
          aria-label="清空 API Base"
          @click="form.api_base = ''"
        >×</button>
      </div>
      <label class="config-sub-label">快速选择：</label>
      <select v-model="selectedPlatform" class="config-select" @change="handlePlatformChange">
        <option value="">-- 请选择服务平台 --</option>
        <option v-for="platform in platforms" :key="platform.value" :value="platform.value">
          {{ platform.label }}
        </option>
      </select>

      <label class="config-label">&gt; API Key</label>
      <div class="config-field">
        <input
          v-model="form.api_key"
          :type="showKey ? 'text' : 'password'"
          class="config-input config-key"
          placeholder="请填写 API Key"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="button" class="config-show" @click="showKey = !showKey">
          {{ showKey ? '隐藏' : '显示' }}
        </button>
      </div>

      <label class="config-remember">
        <input v-model="form.remember" type="checkbox" />
        记住 API Key
      </label>
      <p class="config-tip">
        {{ form.remember
          ? '[安全提示] API Key 将保存到浏览器本地存储；公共电脑上请勿勾选。'
          : '[安全提示] API Key 仅在本次会话有效，关闭终端后将被清除。' }}
      </p>

      <p v-if="error" class="config-error">{{ error }}</p>

      <div class="config-actions">
        <button type="button" class="config-button" :disabled="saving" @click="handleCancel">取消</button>
        <button type="submit" class="config-button config-primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  COMMON_PLATFORMS,
  getPlatformByValue,
  inferApiBase,
  inferPlatformFromApiBase,
  normalizeApiBase,
  usePlayerStore
} from '../stores/player'

interface HostBridge {
  postMessage: (message: unknown) => void
}

const router = useRouter()
const playerStore = usePlayerStore()
const params = new URLSearchParams(window.location.search)
const isPopup = params.get('popup') === '1'
const mode = params.get('mode') === 'auto' ? 'auto' : 'edit'

const ready = ref(false)
const saving = ref(false)
const showKey = ref(false)
const error = ref('')
const platforms = Object.values(COMMON_PLATFORMS)
const selectedPlatform = ref('')
const form = reactive({
  model_name: playerStore.model_name,
  api_base: playerStore.api_base,
  api_key: playerStore.api_key,
  remember: playerStore.remember_api_key
})

const postHost = (message: unknown) => {
  const bridge = (window as unknown as { chrome?: { webview?: HostBridge } }).chrome?.webview
  if (!bridge) return
  try {
    bridge.postMessage(message)
  } catch {
    /* 独立浏览器打开时没有宿主桥，忽略 */
  }
}

const syncFormFromStore = () => {
  form.model_name = playerStore.model_name
  form.api_base = playerStore.api_base
  form.api_key = playerStore.api_key
  form.remember = playerStore.remember_api_key
  const platform = inferPlatformFromApiBase(form.api_base)
  selectedPlatform.value = platform ?? ''
}

const handleModelBlur = () => {
  if (form.model_name && !form.api_base) {
    const inferred = inferApiBase(form.model_name)
    if (inferred) form.api_base = inferred
  }
}

const handlePlatformChange = () => {
  if (!selectedPlatform.value) return
  const platform = getPlatformByValue(selectedPlatform.value)
  if (platform) form.api_base = platform.baseUrl
}

const validate = (): string => {
  if (!form.model_name.trim()) return '请填写模型名称'
  if (!form.api_key.trim()) return '请填写 API Key'
  const base = normalizeApiBase(form.api_base) || inferApiBase(form.model_name)
  if (!base) return '无法从模型名识别 API Base，请手动填写'
  form.api_base = base
  return ''
}

const handleSave = async () => {
  if (saving.value) return
  const message = validate()
  if (message) {
    error.value = message
    return
  }
  error.value = ''
  saving.value = true
  const ok = await playerStore.persistLlmConfig(
    form.api_key.trim(),
    form.api_base,
    form.model_name.trim(),
    form.remember
  )
  saving.value = false
  if (!ok) {
    error.value = '保存失败：无法连接聊天后端，请确认通讯终端已启动'
    return
  }
  postHost({ type: 'llm-config-saved' })
  if (!isPopup) router.push('/')
}

const handleCancel = () => {
  postHost({ type: 'llm-config-cancel' })
  if (!isPopup) router.push('/')
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.isComposing) return
  event.preventDefault()
  handleCancel()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  // 设置页保存的配置在 iframe 的存储里；先读本地，再以后端内存为准补齐。
  playerStore.loadFromLocalStorage()
  await playerStore.syncLlmConfigFromBackend()
  syncFormFromStore()

  let configured = !!playerStore.api_key.trim()
  if (configured) configured = await playerStore.pushLlmConfigToBackend()
  postHost({ type: 'llm-config-ready', configured })
  if (mode === 'auto' && configured) return
  ready.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.config-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background: #0a0a0a;
  color: #d9e8ee;
  border: 1px solid rgba(0, 255, 65, 0.38);
  font-family: 'Microsoft YaHei', 'Microsoft YaHei UI', sans-serif;
  overflow: hidden;
}

.config-titlebar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 46px;
  padding: 0 12px 0 14px;
  background: #101510;
  border-bottom: 1px solid #1f3b2a;
}

.config-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00ff41;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.config-title-mark {
  color: #00ffff;
}

.config-close {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #2a3a2f;
  border-radius: 3px;
  background: #161b16;
  color: #7f9987;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.config-close:hover {
  color: #ff0040;
  border-color: #ff0040;
}

.config-splash {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8ba3ad;
  font-size: 13px;
}

.config-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 16px 16px;
}

.config-hint {
  margin: 0 0 4px;
  color: #8ba3ad;
  font-size: 11px;
  line-height: 1.5;
}

.config-label {
  margin-top: 3px;
  color: #00ff41;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
}

.config-sub-label {
  color: #888888;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
}

.config-field {
  position: relative;
  display: flex;
  align-items: center;
}

.config-input,
.config-select {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 34px 8px 10px;
  border: 1px solid #2f2f2f;
  border-radius: 3px;
  background: #111111;
  color: #00ff41;
  font-family: Consolas, 'Microsoft YaHei UI', monospace;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.config-key {
  color: #ffaa00;
  padding-right: 60px;
}

.config-input:focus,
.config-select:focus {
  border-color: #00ff41;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.16);
}

.config-input::placeholder {
  color: #444444;
}

.config-select {
  padding: 8px 10px;
  color: #00ffff;
  cursor: pointer;
}

.config-clear {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #555555;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.config-clear:hover {
  color: #ff0040;
}

.config-show {
  position: absolute;
  right: 8px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #8ba3ad;
  font-size: 11px;
  cursor: pointer;
}

.config-show:hover {
  color: #00ffff;
}

.config-tip {
  margin: 0;
  color: #555555;
  font-size: 11px;
  line-height: 1.5;
}

.config-remember {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  color: #aaaaaa;
  font-size: 11px;
  cursor: pointer;
}

.config-error {
  margin: 2px 0 0;
  color: #e2806c;
  font-size: 11px;
}

.config-actions {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid #222222;
}

.config-button {
  min-width: 76px;
  padding: 7px 18px;
  border: 1px solid #00ff41;
  border-radius: 3px;
  background: rgba(0, 255, 65, 0.12);
  color: #00ff41;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.config-button:hover {
  background: rgba(0, 255, 65, 0.22);
}

.config-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.config-primary {
  color: #06210f;
  background: #00ff41;
}

.config-primary:hover {
  background: #41ff72;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #0f0f0f;
}

::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00ff41;
}
</style>
