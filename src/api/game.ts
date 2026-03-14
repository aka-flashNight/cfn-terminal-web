import request from '../utils/request'

export interface Session {
  session_id: string
  npc_name: string
  title: string
  created_at: number
}

export interface SessionsResponse {
  sessions: Session[]
  npc_candidates: string[]
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
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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

// 获取会话历史记录
export function getSessionHistory(sessionId: string, limit: number = 50): Promise<SessionHistoryResponse> {
  return request.get(`/api/game/history/${sessionId}`, { params: { limit } }).then(res => res.data)
}

// 发送消息
export function sendMessage(data: NPCChatRequest): Promise<NPCChatResponse> {
  return request.post('/api/game/ask', data).then(res => res.data)
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
