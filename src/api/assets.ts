// 资源 URL 一律用相对路径 /api/...，由当前页所在端口（开发 5173 / 打包后 7078）代理到后端 7077，保证同源以便 canvas 读像素
const API_BASE = ''

// 缓存没有头像的NPC名称（本次页面启动期间有效）
const invalidAvatarCache = new Set<string>()

// 缓存没有立绘的 NPC+情绪 组合（本次页面启动期间有效）
const invalidIllustrationCache = new Set<string>()

/**
 * 标记NPC头像无效
 * @param npcName NPC名称
 */
export function markAvatarInvalid(npcName: string): void {
  invalidAvatarCache.add(npcName)
}

/**
 * 检查NPC头像是否有效
 * @param npcName NPC名称
 * @returns 是否有效
 */
export function isAvatarValid(npcName: string): boolean {
  return !invalidAvatarCache.has(npcName)
}

/**
 * 获取NPC头像URL
 * @param npcName NPC名称
 * @returns 头像图片URL，如果头像无效则返回空字符串
 */
export function getAvatarUrl(npcName: string): string {
  // 检查缓存，如果头像无效则返回空字符串
  if (invalidAvatarCache.has(npcName)) {
    return ''
  }
  return `${API_BASE}/api/assets/avatar/${encodeURIComponent(npcName)}`
}

/**
 * 标记 NPC 某个情绪的立绘无效
 * @param npcName NPC 名称
 * @param emotion 情绪状态
 */
export function markIllustrationInvalid(npcName: string, emotion: string): void {
  const key = `${npcName}::${emotion}`
  invalidIllustrationCache.add(key)
}

/**
 * 检查 NPC 某个情绪的立绘是否有效
 * @param npcName NPC 名称
 * @param emotion 情绪状态
 * @returns 是否有效
 */
export function isIllustrationValid(npcName: string, emotion: string): boolean {
  const key = `${npcName}::${emotion}`
  return !invalidIllustrationCache.has(key)
}

/**
 * 获取NPC立绘URL
 * 相对路径 /api/...，由前端所在端口代理到后端，同源以便 canvas 读像素算有效区域
 */
export function getIllustrationUrl(npcName: string, emotion: string): string {
  if (!isIllustrationValid(npcName, emotion)) {
    return ''
  }
  return `${API_BASE}/api/assets/illustration/${encodeURIComponent(npcName)}/${encodeURIComponent(emotion)}`
}
