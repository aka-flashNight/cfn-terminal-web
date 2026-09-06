# cfn-terminal-web 长期项目约定

## 立绘显示：必须用固定源尺寸方案（勿改成动态尺寸）

- 立绘按 SWF 导出源图 **4096×2304** 的固定坐标系处理：`ILLUST_SCALE = 600/1600 = 0.375`，
  显示尺寸固定 **1536×864**，与后端实际返回的 PNG 尺寸**无关**。
- X 边界用 alpha 扫描，采样画布固定 2048×1152，只扫 `y ∈ [ILLUST_CONTENT_TOP_Y(100), ILLUST_CONTENT_BOTTOM_Y(1600)]`，
  结果按 `ILLUST_SOURCE_WIDTH / 2048` 换算回 4096 坐标系；失败用 `ILLUST_DEFAULT_BOUNDS = {left:200,right:2300,centerX:1250}`。
- **教训**：2026-09-06 曾改为「读 naturalWidth/naturalHeight 动态缩放到 600px 高」，后端立绘换小图后立绘明显变小且跑偏到中间，
  已回退。用户明确表示「按原来的逻辑就行」。以后不要再用图片真实尺寸动态计算立绘几何。

## 构建与交付

- 构建：`npx vue-tsc -b --force` 通过后再 `npx vite build`。
- 交付：先清空 `E:\program\cfn-rag-backend\dist` 内旧文件（assets/、index.html、两个 svg），再 `cp -r dist/.` 复制过去。
- 后端静态托管该 dist，改完前端必须重新构建并同步，否则后端页面仍是旧包。

## 有用的工程前提

- 本项目是 git 仓库且有完整历史，改坏了可以用 `git show <commit>:<path>` 提取旧版逐段回退，
  并用 `git diff <old-commit> -- <path> | grep -i <关键词>` 验证只剩预期差异。
- 后端 v3 契约文档：`E:\program\cfn-rag-backend\docs\v3-developer\09-前端适配说明.md`（SSE 事件以 `services/orchestrator/events.py` 为实现权威）。
