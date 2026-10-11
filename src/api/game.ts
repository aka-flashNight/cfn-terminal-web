import request from '../utils/request'
import { BASE_URL } from '../utils/request'

export interface Session {
  session_id: string
  npc_name: string
  title: string
  created_at: number
}

/** GET /sessions 返回的 NPC 候选项 */
export interface NpcCandidateItem {
  npc_name: string
  faction: string | null
}

export interface SessionsResponse {
  sessions: Session[]
  npc_candidates: NpcCandidateItem[]
}

export interface CreateSessionRequest {
  npc_name: string
  title: string
}

export interface CreateSessionResponse {
  session_id: string
  npc_name: string
  title: string
  created_at: number
}

// 聊天消息
export interface ChatMessage {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  /**
   * 流式专用：状态等待占位（tool_status / agent_status 的提示文案）。
   * 非空表示该气泡是纯等待提示（不承载正文），省略号由动态省略号统一补
   */
  waitingStatusText?: string
}

// 历史记录响应（后端按时间正序返回，messages[0] 为最早一条）
export interface SessionHistoryResponse {
  session_id: string
  messages: ChatMessage[]
}

// 发送消息请求
export interface NPCChatRequest {
  query: string
  npc_name: string
  session_id: string
  /** 当前情绪（上一轮或初始），供后端/AI 做连贯回复与情绪过渡 */
  current_emotion?: string | null
  player_identity?: string | null
  api_key?: string | null
  api_base?: string | null
  model_name?: string | null
  proxy_url?: string | null
  /**
   * 是否启用 Agent 能力（工具调用、任务发布等）。
   * 关闭后走无 Agent 路径，调用与 token 通常更低。
   */
  agent_enabled?: boolean | null
  /**
   * 是否启用跨对话长期记忆。
   * 游戏内嵌（embedded）时后端恒定启用、不受理本字段的关闭；非游戏打开时按本字段生效。
   */
  long_term_memory_enabled?: boolean | null
  /** 精确短期记忆长度档位：10/30/100/500 */
  summarize_interval?: number | null
  /** 剧情进度阶段：废城→雪山 对应 1→6，已通关为第 7 阶段 */
  progress_stage?: number | null
}

// 发送消息响应（stream=false 时的非流式形态）
export interface NPCChatResponse {
  reply: string
  npc_name: string
  favorability: number
  relationship_level: string
  favorability_change: number
  emotion: string
}

// NPC好感度信息响应
export interface NPCFavorabilityResponse {
  npc_name: string
  favorability: number
  relationship_level: string
}

// 更新会话标题请求
export interface UpdateSessionTitleRequest {
  title: string
}

// 更新会话标题响应
export interface UpdateSessionTitleResponse {
  session_id: string
  title: string
}

// ---------------------------------------------------------------------------
// SSE v3 事件契约（实现权威：后端 services/orchestrator/events.py）
// ---------------------------------------------------------------------------

/** meta：每回合有且仅有一次、必先于一切 content；情绪/好感终态以此为准 */
export interface MetaEventData {
  emotion: string
  favorability_change: number
  favorability: number
  relationship_level: string
}

/** tool_status：后端工具进度 */
export interface ToolStatusEventData {
  tool: string
  status: 'running' | 'success' | 'failed'
  /** ≤12 字的界面提示（如「发布委托」「取消委托」） */
  ui_hint: string
}

/** agent_status：后台工作进度（任务拟定 / 检索），等待体验的关键 */
export interface AgentStatusEventData {
  agent: 'task' | 'search'
  phase: 'drafting' | 'repairing' | 'searching' | 'done' | 'failed'
  ui_hint: string
}

/** done：回合结束。usage 为本会话累计 token 消耗，无统计的极端路径下可省略 */
export interface UsageData {
  prompt_tokens?: number
  completion_tokens?: number
  cached_tokens?: number
  total_tokens?: number
}

export interface DoneEventData {
  session_id: string
  usage?: UsageData
}

/** error：不可恢复错误。retryable=false 时提示用户检查配置 */
export interface ErrorEventData {
  code: string
  message: string
  retryable: boolean
}

/** 流式 ask 的回调（v3 事件契约） */
export interface SendMessageStreamCallbacks {
  /** 情绪/好感/关系等级的回合终态：切立绘、更新好感条 */
  onMeta(data: MetaEventData): void
  /** NPC 台词增量（纯台词，无系统消息、无工具残渣） */
  onContent(delta: string): void
  onToolStatus(data: ToolStatusEventData): void
  /** 后台工作进度：done/failed 阶段后状态条应消失 */
  onAgentStatus(data: AgentStatusEventData): void
  /** 系统消息（草案已拟定/委托已发布/错误说明等），按系统样式渲染 */
  onSystemNotice(text: string): void
  /** 回合结束：只做收尾，正文以 onContent 累积结果为准，data 不再携带 reply */
  onDone(data: DoneEventData): void
  onError(data: ErrorEventData): void
  onCancelled?(): void
}

/** 后端在 SSE 响应头给出的契约版本（X-CFN-Version: 3.0.0） */
const REQUIRED_SSE_MAJOR_VERSION = 3

/**
 * 流式发送消息：POST /ask?stream=true，按 SSE v3 解析
 * meta / content / tool_status / agent_status / system_notice / done / error 事件，
 * 自动跳过 keep-alive 注释帧。
 */
export async function sendMessageStream(
  data: NPCChatRequest,
  callbacks: SendMessageStreamCallbacks,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const url = `${BASE_URL || ''}/api/game/ask?stream=true`
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: options?.signal
    })

    if (!response.ok) {
      const text = await response.text()
      callbacks.onError({
        code: `http_${response.status}`,
        message: text || `请求失败 ${response.status}`,
        retryable: false
      })
      return
    }

    // 版本配套检查（09 §4）：响应头声明了旧版本时提示升级后端
    const versionHeader = response.headers.get('X-CFN-Version')?.trim()
    if (versionHeader && !versionHeader.startsWith(`${REQUIRED_SSE_MAJOR_VERSION}.`)) {
      callbacks.onError({
        code: 'version_mismatch',
        message: `后端版本 ${versionHeader} 与本前端（v3 事件契约）不匹配，请升级后端`,
        retryable: false
      })
      return
    }

    reader = response.body?.getReader() ?? null
    if (!reader) {
      callbacks.onError({ code: 'no_stream', message: '无法读取响应流', retryable: false })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let doneReceived = false

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const raw of parts) {
        let eventType = ''
        const dataLines: string[] = []
        for (const rawLine of raw.split('\n')) {
          const line = rawLine.replace(/\r$/, '')
          // SSE 注释帧（: keep-alive 保活帧）按规范跳过
          if (!line || line.startsWith(':')) continue
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart())
          }
        }
        if (!dataLines.length) continue

        try {
          const payload = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
          switch (eventType) {
            case 'meta':
              callbacks.onMeta({
                emotion: typeof payload.emotion === 'string' ? payload.emotion : '普通',
                favorability_change:
                  typeof payload.favorability_change === 'number' ? payload.favorability_change : 0,
                favorability: typeof payload.favorability === 'number' ? payload.favorability : 0,
                relationship_level:
                  typeof payload.relationship_level === 'string' ? payload.relationship_level : ''
              })
              break
            case 'content': {
              const delta = typeof payload.delta === 'string' ? payload.delta : ''
              if (delta) callbacks.onContent(delta)
              break
            }
            case 'tool_status':
              callbacks.onToolStatus({
                tool: typeof payload.tool === 'string' ? payload.tool : '',
                status:
                  payload.status === 'success' || payload.status === 'failed'
                    ? payload.status
                    : 'running',
                ui_hint: typeof payload.ui_hint === 'string' ? payload.ui_hint : ''
              })
              break
            case 'agent_status':
              callbacks.onAgentStatus({
                agent: payload.agent === 'search' ? 'search' : 'task',
                phase:
                  payload.phase === 'repairing' ||
                  payload.phase === 'searching' ||
                  payload.phase === 'done' ||
                  payload.phase === 'failed'
                    ? payload.phase
                    : 'drafting',
                ui_hint: typeof payload.ui_hint === 'string' ? payload.ui_hint : ''
              })
              break
            case 'system_notice': {
              const text = typeof payload.text === 'string' ? payload.text : ''
              if (text) callbacks.onSystemNotice(text)
              break
            }
            case 'done': {
              doneReceived = true
              callbacks.onDone({
                session_id: typeof payload.session_id === 'string' ? payload.session_id : '',
                usage: isRecord(payload.usage) ? (payload.usage as UsageData) : undefined
              })
              break
            }
            case 'error':
              callbacks.onError({
                code: typeof payload.code === 'string' ? payload.code : 'unknown',
                message: typeof payload.message === 'string' ? payload.message : '未知错误',
                retryable: payload.retryable === true
              })
              return
            default:
              // keep_alive 等无 data 帧 / 未知事件：忽略
              break
          }
        } catch (_) {
          // 忽略单条解析失败
        }
      }
    }

    if (!doneReceived) {
      callbacks.onError({ code: 'stream_incomplete', message: '回复未完成', retryable: true })
    }
  } catch (error: unknown) {
    // AbortController 取消：不当成系统错误展示给用户
    if ((error as any)?.name === 'AbortError') {
      callbacks.onCancelled?.()
      return
    }
    throw error
  } finally {
    reader?.releaseLock()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// 获取会话列表和 NPC 候选列表
export function getSessions(): Promise<SessionsResponse> {
  return request.get('/api/game/sessions').then(res => res.data)
}

// 创建新会话
export function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  return request.post('/api/game/sessions', data).then(res => res.data)
}

// 获取会话历史记录（后端按时间正序返回，messages[0] 为最早）
// offset: 跳过条数，用于分页；0 表示从最新开始取 limit 条，50 表示跳过最新 50 条再取 limit 条（更早的消息）
export function getSessionHistory(
  sessionId: string,
  limit: number = 50,
  offset?: number
): Promise<SessionHistoryResponse> {
  const params: { limit: number; offset?: number } = { limit }
  if (offset !== undefined && offset > 0) params.offset = offset
  return request.get(`/api/game/history/${sessionId}`, { params }).then(res => res.data)
}

// 发送消息（非流式）
export function sendMessage(data: NPCChatRequest): Promise<NPCChatResponse> {
  return request.post('/api/game/ask', data).then(res => res.data)
}

/**
 * 获取NPC好感度信息
 *
 * 后端接口说明：
 * - 方法: GET
 * - 路径: /api/game/npc/:npc_name/favorability
 * - 参数: npc_name (路径参数) - NPC名称
 * - 返回: NPCFavorabilityResponse
 * - 错误: 404 - NPC不存在
 */
export function getNPCFavorability(npcName: string): Promise<NPCFavorabilityResponse> {
  return request.get(`/api/game/npc/${encodeURIComponent(npcName)}/favorability`).then(res => res.data)
}

/**
 * 更新会话标题（重命名）
 *
 * 后端接口说明：
 * - 方法: PUT
 * - 路径: /api/game/sessions/:session_id/title
 * - 错误: 404 - 会话不存在, 400 - 标题为空或过长
 */
export function updateSessionTitle(
  sessionId: string,
  data: UpdateSessionTitleRequest
): Promise<UpdateSessionTitleResponse> {
  return request.put(`/api/game/sessions/${sessionId}/title`, data).then(res => res.data)
}

/**
 * 删除会话
 *
 * 后端接口说明：
 * - 方法: DELETE
 * - 路径: /api/game/sessions/:session_id
 * - 返回: 204 No Content (删除成功)
 * - 错误: 404 - 会话不存在
 */
export function deleteSession(sessionId: string): Promise<void> {
  return request.delete(`/api/game/sessions/${sessionId}`).then(res => res.data)
}

/** 重置知识库响应（后端强制重新生成向量库） */
export interface ResetKnowledgeBaseResponse {
  success: boolean
  message?: string
}

/**
 * 重置知识库：强制后端重新生成向量库
 *
 * 后端接口说明：
 * - 方法: POST
 * - 路径: /api/game/knowledge-base/reset
 * - 返回: ResetKnowledgeBaseResponse
 */
export function resetKnowledgeBase(): Promise<ResetKnowledgeBaseResponse> {
  return request.post('/api/game/knowledge-base/reset').then(res => res.data)
}
