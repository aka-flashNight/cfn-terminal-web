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
