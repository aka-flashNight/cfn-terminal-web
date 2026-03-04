# CFN Terminal

一个与游戏 NPC 进行沉浸式对话的前端终端界面，配合 RAG 检索后端实现智能 NPC 交互。

![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## 功能特性

- **沉浸式终端界面** - 赛博朋克风格的聊天界面，支持 NPC 头像与动态立绘展示
- **智能 NPC 对话** - 基于 RAG 检索增强的 NPC 回复，提供上下文感知的交互体验
- **好感度系统** - 实时显示 NPC 好感度变化与关系等级
- **会话管理** - 支持多会话并行，可随时切换不同的 NPC 对话
- **角色设定** - 可配置玩家身份（性别、游戏进度等），影响 NPC 对话内容
- **AI 模型配置** - 支持自定义 API Key、Base URL 和模型名称，灵活对接不同 LLM 服务

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

### 构建生产版本

```bash
npm run build
```

## 后端对接

本项目需要配合 RAG 检索后端使用，后端需提供以下 API：

- `GET /api/game/sessions` - 获取会话列表和 NPC 候选
- `POST /api/game/sessions` - 创建新会话
- `GET /api/game/history/:sessionId` - 获取会话历史记录
- `POST /api/game/ask` - 发送消息并获取 NPC 回复
- `GET /api/assets/avatar/:npcName` - 获取 NPC 头像
- `GET /api/assets/illustration/:npcName/:emotion` - 获取 NPC 立绘

## 配置说明

首次使用需要在设置面板中配置：

- **玩家身份** - 设置性别和游戏进度，影响 NPC 对你的称呼和对话内容
- **AI 模型** - 配置 API Key、Base URL 和模型名称（如 OpenAI、Claude 等）

## 截图

![alt text](image.png)

## License

[MIT](LICENSE)
