/**
 * 游戏内嵌（embedded）模式判定与握手（开发计划 W1-1）。
 *
 * - 判定：URL 携带 `?embedded=1`（游戏面板 iframe 由 Host 以该参数装载）；
 * - 握手：页面加载后向父面板 postMessage `{type:"ragchat-ready"}`，
 *   父面板未应答不影响任何功能（纯通知，无应答等待）。
 */

export const isEmbedded = (() => {
  try {
    return new URLSearchParams(window.location.search).get('embedded') === '1'
  } catch {
    return false
  }
})()

export function announceEmbeddedReady(): void {
  if (!isEmbedded) return
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ragchat-ready' }, '*')
    }
  } catch {
    /* 跨窗口环境异常时静默：握手不是功能依赖 */
  }
}
