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

/** 槽位短码：长键截断展示（cf7_xxx… → cf7_xxxxxxxx…），短键原样。 */
export function shortSlotLabel(slot: string): string {
  return slot.length <= 15 ? slot : `${slot.slice(0, 12)}…`
}

/** 绑定条文案「角色名（短码）」；无绑定返回空串。 */
export function formatBoundLabel(status: IntegrationStatus | null): string {
  const slot = (status?.bound_slot ?? '').trim()
  if (!slot) return ''
  const name = (status?.character?.name ?? '').trim() || '未知角色'
  return `${name}（${shortSlotLabel(slot)}）`
}
