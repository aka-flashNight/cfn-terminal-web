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
  SNOW_MOUNTAIN: '雪山' as const,
  CLEARED: '已通关' as const
}

type GenderType = typeof Gender[keyof typeof Gender]
type ProgressType = typeof Progress[keyof typeof Progress]

export const PROGRESS_TO_IDENTITY: Record<ProgressType, string> = {
  [Progress.WASTED_CITY]: '新人',
  [Progress.FALLEN_CITY]: '中坚',
  [Progress.WARLORD]: '精锐',
  [Progress.BLACK_IRON_HQ]: '高手',
  [Progress.NOAH]: '顶级',
  [Progress.SNOW_MOUNTAIN]: '元老级',
  [Progress.CLEARED]: '最强'
}

// 从废城到雪山对应 1–6 阶段，已通关为第 7 阶段
export const PROGRESS_TO_STAGE_INDEX: Record<ProgressType, number> = {
  [Progress.WASTED_CITY]: 1,
  [Progress.FALLEN_CITY]: 2,
  [Progress.WARLORD]: 3,
  [Progress.BLACK_IRON_HQ]: 4,
  [Progress.NOAH]: 5,
  [Progress.SNOW_MOUNTAIN]: 6,
  [Progress.CLEARED]: 7
}

// 常见平台 API Base 配置映射（包含中转站、云平台、官方等）
// 用于用户手动选择平台时快速切换 API Base
export const COMMON_PLATFORMS = {
  // 中转站 / 聚合平台
  MODELSCOPE: {
    label: 'ModelScope (魔搭社区)',
    value: 'modelscope',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    isOfficial: false
  },
  SILICONFLOW: {
    label: 'SiliconFlow (硅基流动)',
    value: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    isOfficial: false
  },
  // 官方平台（当 inferApiBase 未覆盖时使用）
  OPENAI: {
    label: 'OpenAI (官方)',
    value: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    isOfficial: true
  },
  GEMINI: {
    label: 'Gemini (Google)',
    value: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    isOfficial: true
  },
  DEEPSEEK: {
    label: 'DeepSeek',
    value: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    isOfficial: true
  },
  MOONSHOT: {
    label: 'Moonshot (Kimi)',
    value: 'moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    isOfficial: true
  },
  QWEN: {
    label: 'Qwen (通义千问)',
    value: 'qwen',
    baseUrl: 'https://api.qwen.com/v1',
    isOfficial: true
  },
  ZHIPU: {
    label: 'Zhipu (智谱 AI)',
    value: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    isOfficial: true
  },
  BAICHUAN: {
    label: 'Baichuan (百川智能)',
    value: 'baichuan',
    baseUrl: 'https://api.baichuan-ai.com/v1/baichuan',
    isOfficial: true
  },
  MINIMAX: {
    label: 'MiniMax',
    value: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    isOfficial: true
  },
  STEPFUN: {
    label: 'StepFun (阶跃星辰)',
    value: 'stepfun',
    baseUrl: 'https://api.stepfun.com/v1',
    isOfficial: true
  },
  VOLCENGINE: {
    label: 'Volcengine (火山引擎)',
    value: 'volcengine',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    isOfficial: true
  },
  MISTRAL: {
    label: 'Mistral AI',
    value: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    isOfficial: true
  },
  GROQ: {
    label: 'Groq',
    value: 'groq',
    baseUrl: 'https://api.groq.com/openai',
    isOfficial: true
  },
  YI: {
    label: 'Yi (零一万物)',
    value: 'yi',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    isOfficial: true
  }
} as const

export type CommonPlatformValue = typeof COMMON_PLATFORMS[keyof typeof COMMON_PLATFORMS]['value']

export function getPlatformByValue(value: CommonPlatformValue | string) {
  return Object.values(COMMON_PLATFORMS).find(platform => platform.value === value)
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
    { match: 'baichuan', base: 'https://api.baichuan-ai.com/v1/baichuan' },
    { match: 'abab', base: 'https://api.abab.com/v1' },
    { match: 'minimax', base: 'https://api.minimax.chat/v1' }
  ];
  for (const rule of rules) {
    if (lowerModel.includes(rule.match)) {
      return rule.base;
    }
  }

  return undefined;
}

// 根据 API Base URL 反向推断平台
export function inferPlatformFromApiBase(apiBase: string): CommonPlatformValue | undefined {
  if (!apiBase) return undefined;

  const normalizedBase = apiBase.toLowerCase().trim();

  for (const platform of Object.values(COMMON_PLATFORMS)) {
    if (normalizedBase === platform.baseUrl.toLowerCase()) {
      return platform.value as CommonPlatformValue;
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
  const proxy_url = ref<string>('') // 代理服务器地址
  /** 是否启用 Agent（工具调用、任务发布等），默认开启；关闭可降低 API 频率与 token */
  const agent_enabled = ref<boolean>(true)
  /** 历史记录长度档位：10=短 30=中 100=长 500=几乎无限，对应 ask 的 summarize_interval，history 的 limit = 此值 * 5 */
  const summarize_interval = ref<number>(30)
  const hasConfigured = ref<boolean>(false) // 标记用户是否已保存过配置
  const remember_api_key = ref<boolean>(true) // 默认记住 API Key

  // Getters
  const playerIdentity = computed(() => {
    const identity = PROGRESS_TO_IDENTITY[progress.value]
    const genderText = gender.value === Gender.UNKNOWN ? '' : gender.value
    const bioText = bio.value ? `，${bio.value}` : ''

    // 只对指定阶段强化“佣兵”后的称号
    const powerDescriptorByProgress: Partial<Record<ProgressType, string>> = {
      [Progress.NOAH]: '，知名强者',
      [Progress.SNOW_MOUNTAIN]: '，顶级强者',
      [Progress.CLEARED]: '，绝世高手'
    }
    const powerText = powerDescriptorByProgress[progress.value] ?? ''

    return `一名 A 兵团${identity}${genderText}佣兵${powerText}${bioText}。`
  })

  // 数值型剧情进度阶段：废城→雪山 对应 1→6，已通关为 7
  const storyProgressStage = computed(() => PROGRESS_TO_STAGE_INDEX[progress.value] ?? 1)

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

  // 持久化到 localStorage 或 sessionStorage
  const saveToLocalStorage = () => {
    hasConfigured.value = true

    // 基础配置（总是保存到 localStorage）
    const persistentData = {
      gender: gender.value,
      progress: progress.value,
      bio: bio.value,
      api_base: api_base.value,
      model_name: model_name.value,
      proxy_url: proxy_url.value,
      agent_enabled: agent_enabled.value,
      summarize_interval: summarize_interval.value,
      hasConfigured: true,
      remember_api_key: remember_api_key.value
    }
    localStorage.setItem('player-settings', JSON.stringify(persistentData))

    // API Key 根据用户选择决定存储位置
    if (remember_api_key.value) {
      localStorage.setItem('player-api-key', api_key.value)
      sessionStorage.removeItem('player-api-key')
    } else {
      sessionStorage.setItem('player-api-key', api_key.value)
      localStorage.removeItem('player-api-key')
    }
  }

  // 从 localStorage 和 sessionStorage 加载
  const loadFromLocalStorage = () => {
    // 加载基础配置
    const savedData = localStorage.getItem('player-settings')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        gender.value = data.gender || Gender.UNKNOWN
        progress.value = data.progress || Progress.WASTED_CITY
        bio.value = data.bio || ''
        api_base.value = data.api_base || ''
        model_name.value = data.model_name || ''
        proxy_url.value = data.proxy_url || ''
        agent_enabled.value = data.agent_enabled !== false
        summarize_interval.value = [10, 30, 100, 500].includes(Number(data.summarize_interval))
          ? Number(data.summarize_interval)
          : 30
        hasConfigured.value = data.hasConfigured || false
        remember_api_key.value = data.remember_api_key !== false // 默认为 true
      } catch (error) {
        console.error('Failed to load player settings from localStorage:', error)
      }
    }

    // 加载 API Key（优先从 sessionStorage，其次是 localStorage）
    const sessionApiKey = sessionStorage.getItem('player-api-key')
    const localApiKey = localStorage.getItem('player-api-key')

    if (sessionApiKey !== null) {
      api_key.value = sessionApiKey
      remember_api_key.value = false
    } else if (localApiKey !== null) {
      api_key.value = localApiKey
      remember_api_key.value = true
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
    proxy_url,
    agent_enabled,
    summarize_interval,
    hasConfigured,
    remember_api_key,

    // Getters
    playerIdentity,
    storyProgressStage,

    // Actions
    updateModelName,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
