# 本地开发指南

## 🚨 重要：本地开发需要使用 `vercel dev`

由于本项目使用 Vercel Serverless Functions (`/api/llm-proxy`)，在本地开发时需要使用 `vercel dev` 命令，而不是普通的 `vite` 命令。

---

## ✅ 正确的本地开发方法

### 方法 1：使用 Vercel CLI（推荐）

```bash
# 1. 确保已安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel（如果还没有）
vercel login

# 3. 在项目根目录运行
npm run dev
# 或者直接运行
vercel dev
```

**优势：**
- ✅ 完全模拟 Vercel 生产环境
- ✅ 自动处理 `/api/` 路由
- ✅ 自动读取 `.env` 文件中的环境变量
- ✅ 支持热重载

---

### 方法 2：使用 Vite（不推荐，API 路由不会工作）

如果你只是想测试前端 UI（不测试 LLM 功能），可以使用：

```bash
npm run dev:vite
```

**注意：**
- ❌ `/api/llm-proxy` 路由会返回 404
- ❌ LLM 功能无法正常工作
- ✅ 前端 UI 可以正常显示

---

## 🔧 故障排除

### 问题 1：`vercel dev` 命令找不到

**解决方案：**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 或者使用 npx（不需要全局安装）
npx vercel dev
```

### 问题 2：`vercel dev` 提示需要登录

**解决方案：**
```bash
vercel login
```

### 问题 3：环境变量未读取

**检查：**
1. 确保 `.env` 文件在项目根目录
2. 确保 `.env` 文件格式正确（没有 `VITE_` 前缀）：
   ```bash
   LLM_API_KEY=your-api-key-here
   LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   LLM_MODEL=vibe-coding-app-gemini
   ```

3. 重启 `vercel dev` 服务器

### 问题 4：端口冲突

如果端口 3000 已被占用，`vercel dev` 会自动使用其他端口（如 3001）。

---

## 📝 开发流程

1. **启动开发服务器：**
   ```bash
   npm run dev
   ```

2. **访问应用：**
   - 通常会在 `http://localhost:3000` 打开
   - 如果端口不同，查看终端输出

3. **测试 API 代理：**
   - 打开浏览器开发者工具 → Network
   - 触发一个 LLM 功能（如上传医疗记录）
   - 应该看到请求发送到 `/api/llm-proxy`
   - 不应该看到 404 错误

---

## 🆚 两种开发模式对比

| 特性 | `vercel dev` | `vite` |
|------|-------------|--------|
| `/api/` 路由 | ✅ 支持 | ❌ 不支持（404） |
| LLM 功能 | ✅ 正常工作 | ❌ 无法工作 |
| 前端 UI | ✅ 正常工作 | ✅ 正常工作 |
| 热重载 | ✅ 支持 | ✅ 支持 |
| 环境变量 | ✅ 自动读取 `.env` | ✅ 自动读取 `.env` |
| 模拟生产环境 | ✅ 完全模拟 | ❌ 不模拟 |

---

## 💡 为什么需要 `vercel dev`？

Vercel Serverless Functions（`/api/` 目录下的文件）只在 Vercel 部署时才会被处理。在本地开发时：

- **普通 Vite 服务器**：只处理前端文件，不知道如何处理 `/api/` 路由
- **Vercel CLI (`vercel dev`)**：会启动一个本地服务器，模拟 Vercel 的环境，包括：
  - 处理 `/api/` 路由
  - 运行 Serverless Functions
  - 读取环境变量
  - 模拟 Vercel 的路由规则

这就是为什么需要使用 `vercel dev` 的原因！
