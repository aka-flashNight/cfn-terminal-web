import { BASE_URL } from '../utils/request'

/**
 * 获取NPC头像URL
 * @param npcName NPC名称
 * @returns 头像图片URL
 */
export function getAvatarUrl(npcName: string): string {
  return `${BASE_URL}/api/assets/avatar/${encodeURIComponent(npcName)}`
}

/**
 * 获取NPC立绘URL
 * @param npcName NPC名称
 * @param emotion 情绪状态
 * @returns 立绘图片URL
 */
export function getIllustrationUrl(npcName: string, emotion: string): string {
  return `${BASE_URL}/api/assets/illustration/${encodeURIComponent(npcName)}/${encodeURIComponent(emotion)}`
}
