import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const Gender = {
  MALE: '男' as const,
  FEMALE: '女' as const,
  UNKNOWN: '未知性别' as const
}

export const Progress = {
  WASTED_CITY: '废城' as const,
  FALLEN_CITY: '堕落城' as const,
  WARLORD: '军阀' as const,
  BLACK_IRON_HQ: '黑铁会总堂' as const,
  NOAH: '诺亚' as const,
  SNOW_MOUNTAIN: '雪山' as const
}

type GenderType = typeof Gender[keyof typeof Gender]
type ProgressType = typeof Progress[keyof typeof Progress]

export const PROGRESS_TO_IDENTITY: Record<ProgressType, string> = {
  [Progress.WASTED_CITY]: '新人',
  [Progress.FALLEN_CITY]: '中坚',
  [Progress.WARLORD]: '精锐',
  [Progress.BLACK_IRON_HQ]: '高手',
  [Progress.NOAH]: '顶级',
  [Progress.SNOW_MOUNTAIN]: '元老级'
}

export function inferApiBase(modelName: string): string | undefined {
  if (!modelName) return undefined;

  const lowerModel = modelName.toLowerCase();

  // 1. Precise Match / StartsWith (避免误伤的短前缀)
  if (lowerModel.startsWith('gpt-') || /^o[13](-[a-z0-9]+)?$/.test(lowerModel)) {
    return 'https://api.openai.com/v1';
  }
  if (lowerModel.startsWith('ep-')) {
    // 字节火山引擎 (Volcengine Ark) 的模型推理接入点通常以 ep- 开头
    return 'https://ark.cn-beijing.volces.com/api/v3';
  }
  if (lowerModel.startsWith('step-')) {
    // 阶跃星辰
    return 'https://api.stepfun.com/v1';
  }
  if (lowerModel.startsWith('yi-')) {
    // 零一万物
    return 'https://api.lingyiwanwu.com/v1';
  }

  // 2. Includes Match (包含关键字即匹配)
  const rules = [
    { match: 'gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai' },
    { match: 'deepseek', base: 'https://api.deepseek.com/v1' },
    { match: 'kimi', base: 'https://api.moonshot.cn/v1' },
    { match: 'qwen', base: 'https://api.qwen.com/v1' },
    { match: 'zhipu', base: 'https://open.bigmodel.cn/api/paas/v4' },
    { match: 'glm', base: 'https://open.bigmodel.cn/api/paas/v4' },
    { match: 'mistral', base: 'https://api.mistral.ai/v1' },
    { match: 'mixtral', base: 'https://api.mistral.ai/v1' },
    { match: 'groq', base: 'https://api.groq.com/openai' },
    { match: 'silicon', base: 'https://api.siliconflow.cn/v1' },
    { match: 'baichuan', base: 'https://api.baichuan-ai.com/v1/baichuan' }, // Check
    { match: 'abab', base: 'https://api.abab.com/v1' },
    { match: 'minimax', base: 'https://api.minimax.chat/v1' } // check
    // { match: 'openrouter', base: 'https://openrouter.ai/api/v1' }, // OpenRouter is not directly compatible
    // { match: 'together', base: 'https://api.together.xyz/v1' }, // Together is not directly compatible
  ];
  for (const rule of rules) {
    if (lowerModel.includes(rule.match)) {
      return rule.base;
    }
  }

  return undefined;
}

export const usePlayerStore = defineStore('player', () => {
  // State
  const gender = ref<GenderType>(Gender.UNKNOWN)
  const progress = ref<ProgressType>(Progress.WASTED_CITY)
  const bio = ref<string>('')
  const api_key = ref<string>('')
  const api_base = ref<string>('')
  const model_name = ref<string>('')
  const hasConfigured = ref<boolean>(false) // 标记用户是否已保存过配置

  // Getters
  const playerIdentity = computed(() => {
    const identity = PROGRESS_TO_IDENTITY[progress.value]
    const genderText = gender.value === Gender.UNKNOWN ? '' : gender.value
    const bioText = bio.value ? `，${bio.value}` : ''

    return `一名A兵团${identity}${genderText}佣兵${bioText}。`
  })

  // Actions
  const updateModelName = (newModelName: string) => {
    model_name.value = newModelName

    // 如果 api_base 为空，则尝试自动推导
    if (!api_base.value) {
      const inferredBase = inferApiBase(newModelName)
      if (inferredBase) {
        api_base.value = inferredBase
      }
    }
  }

  // 持久化到 localStorage
  const saveToLocalStorage = () => {
    hasConfigured.value = true
    const data = {
      gender: gender.value,
      progress: progress.value,
      bio: bio.value,
      api_key: api_key.value,
      api_base: api_base.value,
      model_name: model_name.value,
      hasConfigured: true
    }
    localStorage.setItem('player-settings', JSON.stringify(data))
  }

  // 从 localStorage 加载
  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('player-settings')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        gender.value = data.gender || Gender.UNKNOWN
        progress.value = data.progress || Progress.WASTED_CITY
        bio.value = data.bio || ''
        api_key.value = data.api_key || ''
        api_base.value = data.api_base || ''
        model_name.value = data.model_name || ''
        hasConfigured.value = data.hasConfigured || false
      } catch (error) {
        console.error('Failed to load player settings from localStorage:', error)
      }
    }
  }

  // 初始化时加载
  loadFromLocalStorage()

  // 监听变化并自动保存
  const setupAutoSave = () => {
    // 使用 watchEffect 来自动追踪依赖并保存
    // 这里我们手动调用 saveToLocalStorage 来持久化
  }

  setupAutoSave()

  return {
    // State
    gender,
    progress,
    bio,
    api_key,
    api_base,
    model_name,
    hasConfigured,

    // Getters
    playerIdentity,

    // Actions
    updateModelName,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
