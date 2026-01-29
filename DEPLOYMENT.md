# 部署指南 / Deployment Guide

## 🔒 API Key 安全保护

本项目使用 **Vercel Serverless Functions** 作为后端代理，确保 API key 永远不会暴露给客户端。

### 架构说明

```
前端 (Browser) 
  ↓ 调用 /api/llm-proxy
Vercel Serverless Function (服务器端)
  ↓ 使用服务器端环境变量中的 API key
LLM API (Gemini)
```

**优势：**
- ✅ API key 只存储在服务器端，永远不会暴露给客户端
- ✅ 客户端无法通过查看源代码或网络请求获取 API key
- ✅ 符合安全最佳实践

---

## 📦 本地开发设置

1. **复制环境变量模板：**
   ```bash
   cp .env.example .env
   ```

2. **编辑 `.env` 文件，填入你的 API key：**
   ```bash
   LLM_API_KEY=your-actual-api-key-here
   LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   LLM_MODEL=vibe-coding-app-gemini
   ```

3. **启动开发服务器：**
   ```bash
   npm run dev
   ```

4. **测试 API 代理：**
   - 开发服务器会自动处理 `/api/llm-proxy` 路由
   - 确保所有 LLM 功能正常工作

---

## 🚀 Vercel 部署设置

### 步骤 1: 推送代码到 Git 仓库

确保代码已推送到 GitHub/GitLab/Bitbucket 等 Git 托管平台。

### 步骤 2: 在 Vercel 中导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 Git 仓库

### 步骤 3: 配置环境变量

在 Vercel 项目设置中添加以下**服务器端环境变量**：

1. 进入项目 → Settings → Environment Variables
2. 添加以下变量（**不要使用 `VITE_` 前缀**）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `LLM_API_KEY` | `your-actual-api-key` | **必需** - 你的 LLM API key |
| `LLM_BASE_URL` | `https://hyperecho-proxy.aelf.dev/v1` | 可选 - 默认值已设置 |
| `LLM_MODEL` | `vibe-coding-app-gemini` | 可选 - 默认值已设置 |

3. **重要：** 确保这些变量应用于所有环境（Production, Preview, Development）

### 步骤 4: 部署

Vercel 会自动检测到项目并开始部署。部署完成后：

1. 访问你的 Vercel URL
2. 测试 LLM 功能（上传医疗记录、与陪伴角色对话等）
3. 检查浏览器开发者工具 → Network，确认：
   - 请求发送到 `/api/llm-proxy`
   - **没有**在请求头或响应中看到 API key

---

## 🔍 验证安全性

### 检查 API key 是否暴露

1. **查看构建后的代码：**
   ```bash
   npm run build
   grep -r "LLM_API_KEY\|hy-iAce" dist/
   ```
   应该**没有**任何结果

2. **检查浏览器网络请求：**
   - 打开浏览器开发者工具 → Network
   - 触发一个 LLM API 调用
   - 检查请求头：**不应该**看到 `Authorization: Bearer ...` 包含 API key
   - 请求应该发送到 `/api/llm-proxy`，而不是直接到 LLM API

3. **查看源代码：**
   - 在浏览器中查看页面源代码
   - 搜索 API key：**不应该**找到任何 API key

---

## 🛠️ 故障排除

### 问题：API 调用返回 500 错误

**可能原因：** 环境变量未正确配置

**解决方案：**
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保 `LLM_API_KEY` 已设置
3. 重新部署项目

### 问题：本地开发时 API 调用失败

**可能原因：** `.env` 文件未正确配置

**解决方案：**
1. 确保 `.env` 文件存在于项目根目录
2. 检查 `.env` 文件中的 `LLM_API_KEY` 是否正确
3. 重启开发服务器

### 问题：Vercel 部署后 API 不工作

**可能原因：** Serverless Function 路由配置问题

**解决方案：**
1. 检查 `vercel.json` 中的 rewrites 配置
2. 确保 `/api/*` 路由不会被重写到 `/index.html`
3. 查看 Vercel 部署日志中的错误信息

---

## 📝 文件结构

```
项目根目录/
├── api/
│   └── llm-proxy.ts          # Vercel Serverless Function (后端代理)
├── src/
│   └── services/
│       ├── llmService.ts      # 前端服务（调用 /api/llm-proxy）
│       └── companionService.ts # 前端服务（调用 /api/llm-proxy）
├── .env                       # 本地开发环境变量（不提交到 Git）
├── .env.example              # 环境变量模板（可提交到 Git）
└── vercel.json               # Vercel 部署配置
```

---

## 🔐 安全最佳实践

1. ✅ **永远不要**将 `.env` 文件提交到 Git
2. ✅ **永远不要**在前端代码中使用 `VITE_LLM_API_KEY`
3. ✅ **永远不要**在文档或注释中硬编码 API key
4. ✅ 定期轮换 API key
5. ✅ 在 API 提供商处设置使用限制（如域名白名单、请求频率限制）

---

## 📚 相关文档

- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
