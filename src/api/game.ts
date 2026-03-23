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
   * 前端专用：当本条 assistant 仅有 `{...}` 系统块、气泡内无正文时，气泡里显示的占位文案
   * （优先来自最后一次 tool_status，否则为默认「连接终端」类提示）
   */
  bubblePlaceholder?: string
}

// 历史记录响应
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
   * 关闭后 ask 走无 Agent 路径，调用与 token 通常更低。
   */
  agent_enabled?: boolean | null
  /** 精确短期记忆长度档位：10/30/100/500，对应后端 SUMMARIZE_INTERVAL */
  summarize_interval?: number | null
  /** 剧情进度阶段：废城→雪山 对应 1→6，已通关为第 7 阶段 */
  progress_stage?: number | null
}

// 发送消息响应
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

// 初始化配置请求
export interface InitConfigRequest {
  proxy_url?: string | null
}

// 获取会话列表和 NPC 候选列表（可传入初始化配置）
export function getSessions(config?: InitConfigRequest): Promise<SessionsResponse> {
  return request.get('/api/game/sessions', { params: config }).then(res => res.data)
}

// 创建新会话
export function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  return request.post('/api/game/sessions', data).then(res => res.data)
}

// 获取会话历史记录（后端按时间倒序返回，即 messages[0] 为最新）
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

/** 流式 ask 的回调：content 为打字机增量，done 为最终元数据，error 为错误或「回复未完成」 */
export interface SendMessageStreamCallbacks {
  onContent(delta: string): void
  onDone(data: NPCChatResponse): void
  onToolStatus(text: string, tool_name: string | null): void
  onSystem(text: string, draft_id?: string | null, task_id?: string | null): void
  onError(error: string): void
  onCancelled?(): void
}

/**
 * 流式发送消息：POST /ask?stream=true，按 SSE 解析 content / done / error，
 * 通过回调推送 delta、最终 NPCChatResponse 或错误信息。
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
      callbacks.onError(text || `请求失败 ${response.status}`)
      return
    }

    reader = response.body?.getReader() ?? null
    if (!reader) {
      callbacks.onError('无法读取响应流')
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
        let dataLine = ''
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5).trim()
          }
        }
        if (!dataLine) continue

        try {
          const data = JSON.parse(dataLine) as Record<string, unknown>
          if (eventType === 'content') {
            const delta = typeof data.delta === 'string' ? data.delta : ''
            if (delta) callbacks.onContent(delta)
          } else if (eventType === 'tool_status') {
            const text = typeof data.text === 'string' ? data.text : ''
            const tool_name = typeof data.tool_name === 'string' ? data.tool_name : null
            callbacks.onToolStatus(text, tool_name)
          } else if (eventType === 'system') {
            const text = typeof data.text === 'string' ? data.text : ''
            const draft_id = typeof data.draft_id === 'string' ? data.draft_id : null
            const task_id = typeof data.task_id === 'string' ? data.task_id : null
            callbacks.onSystem(text, draft_id, task_id)
          } else if (eventType === 'done') {
            doneReceived = true
            callbacks.onDone(data as unknown as NPCChatResponse)
          } else if (eventType === 'error') {
            const err = typeof data.error === 'string' ? data.error : '未知错误'
            callbacks.onError(err)
            return
          }
        } catch (_) {
          // 忽略单条解析失败
        }
      }
    }

    if (!doneReceived) callbacks.onError('回复未完成')
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

/**
 * 获取NPC好感度信息
 * 根据NPC名称获取当前好感度、关系等级和情绪状态
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
 * - 参数:
 *   - session_id (路径参数) - 会话ID
 *   - title (请求体) - 新的会话标题
 * - 返回: UpdateSessionTitleResponse
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
 * - 参数: session_id (路径参数) - 会话ID
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
