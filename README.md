# CFN Terminal

一个与游戏 NPC 进行沉浸式对话的前端终端界面，配合 RAG 检索后端实现智能 NPC 交互。

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## 功能特性

- **沉浸式终端界面** - 赛博朋克风格的聊天界面，支持 NPC 头像与动态立绘展示
- **智能 NPC 对话** - 基于 RAG 检索增强的 NPC 回复，提供上下文感知的交互体验；支持**流式回复**（打字机效果）
- **动作与情绪** - 可输入动作/心理描写，消息中 `【】` 内内容以动作样式展示；支持情绪继承与 NPC 情绪立绘切换
- **好感度系统** - 实时显示 NPC 好感度变化与关系等级，可查询指定 NPC 的好感度接口
- **会话管理** - 多会话并行、切换；支持**删除会话**、**重命名会话**
- **立绘展示** - 立绘布局模式（全局居中 / 右侧对齐 / 右侧居中），支持拖动微调位置
- **角色设定** - 可配置玩家身份（性别、游戏进度等），影响 NPC 对话内容
- **AI 模型与代理** - 自定义 API Key、Base URL、模型名称；可选填代理服务器地址以访问 AI 服务
- **立绘与知识库** - 设置内可补充/重新生成立绘（含从 SWF 导出），可重置知识库（重新生成向量库）

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia
- **样式方案**: Tailwind CSS
- **HTTP 客户端**: Axios

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发时前端会将 `/api` 代理到 `http://127.0.0.1:7077`（可在 `vite.config.ts` 中修改），立绘导出等长耗时请求已配置较长超时。

### 构建生产版本

```bash
npm run build
```

## 后端对接

本项目前端默认配套的后端实现为 **CrazyFlashNight** 项目（闪客快打7重置版服务端与工具集），代码仓库地址见：[FlashNightModReborn/CrazyFlashNight](https://github.com/FlashNightModReborn/CrazyFlashNight)。

本项目需要配合 RAG 检索后端使用，后端需提供以下 API：

**会话与对话**

- `GET /api/game/sessions` - 获取会话列表和 NPC 候选
- `POST /api/game/sessions` - 创建新会话
- `DELETE /api/game/sessions/:sessionId` - 删除会话
- `PUT /api/game/sessions/:sessionId/title` - 重命名会话（请求体 `{ "title": "新标题" }`）
- `GET /api/game/history/:sessionId` - 获取会话历史记录
- `POST /api/game/ask` - 发送消息并获取 NPC 回复（非流式）
- `POST /api/game/ask?stream=true` - 流式发送消息（SSE：`content` / `done` / `error` 事件）

**NPC 与资源**

- `GET /api/game/npc/:npcName/favorability` - 获取指定 NPC 的好感度与关系等级
- `GET /api/assets/avatar/:npcName` - 获取 NPC 头像
- `GET /api/assets/illustration/:npcName/:emotion` - 获取 NPC 立绘
- `POST /api/assets/export-illustrations` - 导出/生成立绘（请求体 `{ "overwrite": boolean }`，从 SWF 导出可能需数分钟）

**知识库**

- `POST /api/game/knowledge-base/reset` - 重置知识库（强制重新生成向量库）

## 配置说明

首次使用需在设置面板中配置：

- **玩家身份** - 设置性别和游戏进度，影响 NPC 对你的称呼和对话内容
- **AI 模型** - 配置 API Key、Base URL 和模型名称（如 OpenAI、Claude 等）
- **代理服务器** - 可选；若需通过代理访问 AI 服务，可填写代理地址，留空则使用系统代理或不使用代理
- **立绘管理** - 可「补充缺失立绘」或「重新生成全部立绘」；立绘可从 illustration.zip 解压或从 SWF 导出（后者需较长时间）
- **重置知识库** - 可强制后端重新生成向量库（如文档或设定变更后）

## 截图

![alt text](image.png)

## License

[MIT](LICENSE)
