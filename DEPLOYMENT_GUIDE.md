# 部署指南 - 支持任何平台

本项目提供了灵活的部署方案，支持 **Vercel**、**Netlify**、**Railway**、**Render**、**Fly.io** 或任何其他平台。

---

## 🏗️ 架构说明

```
前端应用 (静态文件)
  ↓ 调用 /api/llm-proxy
后端代理服务器 (保护 API key)
  ↓ 使用服务器端环境变量中的 API key
LLM API (Gemini)
```

**关键点：**
- ✅ API key 只存储在服务器端，永远不会暴露给客户端
- ✅ 前端和代理服务器可以部署在不同的平台
- ✅ 支持多种部署方案

---

## 📦 方案 1：Vercel（推荐，最简单）

如果你使用 Vercel，不需要额外配置，直接使用内置的 Serverless Functions。

### 部署步骤：

1. **推送代码到 Git 仓库**

2. **在 Vercel 中导入项目**
   - 访问 https://vercel.com/dashboard
   - 点击 "Add New Project"
   - 导入你的 Git 仓库

3. **配置环境变量**
   - Settings → Environment Variables
   - 添加 `LLM_API_KEY`（不要使用 `VITE_` 前缀）

4. **部署**
   - Vercel 会自动检测并部署
   - `/api/llm-proxy` 路由会自动工作（使用 `api/llm-proxy.ts`）

---

## 📦 方案 2：Netlify

Netlify 也支持 Serverless Functions，但需要稍微不同的配置。

### 部署步骤：

1. **创建 `netlify/functions/llm-proxy.ts`**（如果需要）

2. **在 Netlify Dashboard 配置环境变量**
   - Site settings → Environment variables
   - 添加 `LLM_API_KEY`

3. **部署**
   - 连接 Git 仓库或手动部署

---

## 📦 方案 3：独立代理服务器 + 静态前端

这是最灵活的方案，可以在任何平台部署。

### 架构：

- **前端**：部署到任何静态托管（Vercel、Netlify、Cloudflare Pages、GitHub Pages 等）
- **代理服务器**：部署到任何 Node.js 平台（Railway、Render、Fly.io、Heroku 等）

### 步骤 A：部署代理服务器

#### Railway（推荐）

1. **创建新项目**
   - 访问 https://railway.app
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"

2. **配置环境变量**
   - Variables → Add Variable
   - `LLM_API_KEY`: 你的 API key
   - `LLM_BASE_URL`: `https://hyperecho-proxy.aelf.dev/v1`（可选）
   - `LLM_MODEL`: `vibe-coding-app-gemini`（可选）

3. **设置启动命令**
   - Settings → Deploy
   - Start Command: `node server/proxy-server.js`

4. **获取代理服务器 URL**
   - 部署完成后，Railway 会提供一个 URL
   - 例如：`https://your-app.railway.app`

#### Render

1. **创建新 Web Service**
   - 访问 https://render.com
   - 点击 "New +" → "Web Service"
   - 连接你的 Git 仓库

2. **配置**
   - Build Command: `npm install`
   - Start Command: `node server/proxy-server.js`
   - Environment Variables:
     - `LLM_API_KEY`: 你的 API key

3. **获取代理服务器 URL**

#### Fly.io

1. **安装 Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **创建应用**
   ```bash
   fly launch
   ```

3. **设置环境变量**
   ```bash
   fly secrets set LLM_API_KEY=your-api-key
   ```

4. **部署**
   ```bash
   fly deploy
   ```

### 步骤 B：部署前端并配置代理 URL

1. **构建前端**
   ```bash
   npm run build
   ```

2. **配置代理 URL**
   
   在部署平台的环境变量中设置：
   ```bash
   VITE_PROXY_URL=https://your-proxy-server.railway.app/api/llm-proxy
   ```
   
   或者在构建时设置：
   ```bash
   VITE_PROXY_URL=https://your-proxy-server.railway.app/api/llm-proxy npm run build
   ```

3. **部署静态文件**
   - 将 `dist/` 目录部署到任何静态托管平台
   - Vercel、Netlify、Cloudflare Pages 等都支持

---

## 🖥️ 本地开发

### 方法 1：使用独立代理服务器（推荐，通用）

```bash
# 终端 1：启动代理服务器
npm run dev:proxy

# 终端 2：启动前端开发服务器
npm run dev:vite
```

或者使用一个命令同时启动两个服务器：

```bash
npm run dev
```

### 方法 2：使用 Vercel CLI（仅限 Vercel 用户）

```bash
npm run dev:vercel
```

---

## 🔧 环境变量配置

### 代理服务器需要的环境变量：

```bash
LLM_API_KEY=your-api-key-here          # 必需
LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1  # 可选
LLM_MODEL=vibe-coding-app-gemini       # 可选
PROXY_PORT=3001                        # 可选，默认 3001
```

### 前端需要的环境变量（可选）：

```bash
VITE_PROXY_URL=https://your-proxy-server.com/api/llm-proxy  # 如果代理服务器在不同域名
```

如果不设置 `VITE_PROXY_URL`，前端会使用相对路径 `/api/llm-proxy`（适用于同域部署）。

---

## 📝 不同平台的配置文件

### Railway

创建 `railway.json`（可选）：
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server/proxy-server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Render

创建 `render.yaml`（可选）：
```yaml
services:
  - type: web
    name: llm-proxy
    env: node
    buildCommand: npm install
    startCommand: node server/proxy-server.js
    envVars:
      - key: LLM_API_KEY
        sync: false
```

### Fly.io

创建 `fly.toml`：
```toml
app = "your-app-name"
primary_region = "iad"

[build]

[env]
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory_mb = 256
```

---

## ✅ 验证部署

1. **检查代理服务器**
   ```bash
   curl https://your-proxy-server.com/health
   ```
   应该返回：`{"status":"ok","message":"LLM Proxy Server is running","hasApiKey":true}`

2. **测试 LLM 代理**
   ```bash
   curl -X POST https://your-proxy-server.com/api/llm-proxy \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
   ```

3. **检查前端**
   - 访问你的前端应用
   - 打开浏览器开发者工具 → Network
   - 触发 LLM 功能
   - 应该看到请求发送到配置的代理 URL

---

## 🔐 安全最佳实践

1. ✅ **永远不要**在前端代码中暴露 API key
2. ✅ **永远不要**将 `.env` 文件提交到 Git
3. ✅ 使用 HTTPS 部署代理服务器
4. ✅ 在代理服务器中添加 CORS 限制（如果需要）
5. ✅ 考虑添加速率限制和身份验证

---

## 🆘 故障排除

### 问题：代理服务器返回 500 错误

**检查：**
1. 环境变量 `LLM_API_KEY` 是否已设置
2. 查看服务器日志
3. 测试 `/health` 端点

### 问题：前端无法连接到代理服务器

**检查：**
1. `VITE_PROXY_URL` 是否正确配置
2. 代理服务器是否正在运行
3. CORS 设置是否正确
4. 网络连接是否正常

### 问题：CORS 错误

**解决方案：** 代理服务器已经配置了 CORS，如果还有问题，检查：
1. 代理服务器的 CORS 设置
2. 前端请求的域名是否正确

---

## 📚 相关文档

- [Railway 文档](https://docs.railway.app)
- [Render 文档](https://render.com/docs)
- [Fly.io 文档](https://fly.io/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com)
