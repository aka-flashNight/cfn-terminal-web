/**
 * 游戏内嵌集成状态（W2-1）：`GET /api/integration/status` 的读取与绑定条文案。
 *
 * - 仅在 embedded 模式消费（standalone 不发请求、不显示绑定条，保持零变化）；
 * - 拉取失败返回 null（best-effort，静默跳过，不影响任何现有流程）。
 */
import request from './request'

/** `GET /api/integration/status` 响应（字段同后端 IntegrationStatusResponse） */
export interface IntegrationStatus {
  mode: string
  launch_mode: string
  bound_slot: string | null
  character: { name?: string } | null
  /** 场景投影（stageFlag/stageName/entrance/inCombat；展示暂不消费） */
  scene: Record<string, unknown> | null
  /** 玩家段投影（开放段，此处仅声明展示用字段） */
  player: IntegrationPlayer | null
  /** 后端由绑定存档推导的阶段索引（1-7）；不可判定＝null */
  stage: number | null
  /** 阶段名（废城/堕落城/…；不可判定＝null） */
  stage_name: string | null
}

/** 玩家段投影中前端展示消费的字段（投影实际更宽，其余字段按需扩展） */
export interface IntegrationPlayer {
  gender?: string
  level?: number
  title?: { equip?: string; byKills?: string; final?: string }
}

/** 拉取集成状态快照；失败返回 null。 */
export async function fetchIntegrationStatus(): Promise<IntegrationStatus | null> {
  try {
    const res = await request.get('/api/integration/status')
    return res.data as IntegrationStatus
  } catch {
    return null
  }
}

/** 绑定条文案「姓名，身份一句话」；未绑定返回空串（身份串由 playerStore 随存档投影对齐后给出）。 */
export function formatBoundLabel(status: IntegrationStatus | null, identity: string): string {
  const slot = (status?.bound_slot ?? '').trim()
  if (!slot) return ''
  const name = (status?.character?.name ?? '').trim() || '未知角色'
  return identity ? `${name}，${identity}` : `${name}。`
}

/** 存档档案五项（embedded 设置面板只读展示）：名字/性别/阶段/称号/等级。 */
export interface SaveCardFields {
  name: string
  gender: string
  stage: string
  title: string
  level: string
}

/** 从集成状态提取存档档案五项；缺失项展示占位「—」。 */
export function formatSaveCard(status: IntegrationStatus | null): SaveCardFields {
  const dash = '—'
  const level = status?.player?.level
  return {
    name: (status?.character?.name ?? '').trim() || dash,
    gender: (status?.player?.gender ?? '').trim() || dash,
    stage: (status?.stage_name ?? '').trim() || dash,
    title: (status?.player?.title?.final ?? '').trim() || dash,
    level: typeof level === 'number' && level > 0 ? String(level) : dash,
  }
}
