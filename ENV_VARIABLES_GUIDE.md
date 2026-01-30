# 环境变量存储位置说明

## 📍 服务器端环境变量的具体位置

### 1. **代码中如何读取**（`api/llm-proxy.ts`）

```typescript
// 第 22 行：从服务器端环境变量读取 API key
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://hyperecho-proxy.aelf.dev/v1';
const LLM_MODEL = process.env.LLM_MODEL || 'vibe-coding-app-gemini';
```

**关键点：**
- 使用 `process.env.LLM_API_KEY`（**不是** `import.meta.env.VITE_LLM_API_KEY`）
- `process.env` 是 Node.js 的服务器端环境变量
- 这些变量**只在服务器端**（Vercel Serverless Function）可用
- **永远不会**被打包到前端代码中

---

### 2. **本地开发时** - 存储在 `.env` 文件中

**位置：** 项目根目录的 `.env` 文件

```bash
# .env 文件（项目根目录）
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
LLM_MODEL=vibe-coding-app-gemini
```

**重要：**
- ✅ `.env` 文件已经在 `.gitignore` 中，**不会被提交到 Git**
- ✅ 这个文件只存在于你的本地机器上
- ✅ Vercel 在本地开发时会自动读取 `.env` 文件中的变量

---

### 3. **Vercel 部署时** - 存储在 Vercel Dashboard

**位置：** Vercel 网站的项目设置中

**具体步骤：**

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 登录你的账号

2. **进入项目设置**
   - 点击你的项目
   - 点击顶部菜单的 **"Settings"**
   - 在左侧菜单选择 **"Environment Variables"**

3. **添加环境变量**
   - 点击 **"Add New"** 按钮
   - 输入以下信息：

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `LLM_API_KEY` | `你的实际 API key` | Production, Preview, Development |
   | `LLM_BASE_URL` | `https://hyperecho-proxy.aelf.dev/v1` | Production, Preview, Development |
   | `LLM_MODEL` | `vibe-coding-app-gemini` | Production, Preview, Development |

4. **保存**
   - 点击 **"Save"**
   - 这些变量会存储在 Vercel 的服务器上

**可视化位置：**
```
Vercel Dashboard
  └── 你的项目
      └── Settings
          └── Environment Variables  ← 这里！
              ├── LLM_API_KEY: [你的 API key]
              ├── LLM_BASE_URL: [URL]
              └── LLM_MODEL: [模型名]
```

---

## 🔍 如何验证环境变量已正确设置

### 本地开发验证

1. **检查 `.env` 文件是否存在：**
   ```bash
   cat .env
   ```
   应该看到 `LLM_API_KEY=...`

2. **测试 API 代理：**
   ```bash
   npm run dev
   ```
   访问应用，测试 LLM 功能是否正常工作

### Vercel 部署验证

1. **在 Vercel Dashboard 中检查：**
   - Settings → Environment Variables
   - 确认 `LLM_API_KEY` 已添加

2. **查看部署日志：**
   - 进入项目的 Deployments
   - 点击最新的部署
   - 查看 Build Logs
   - 如果看到 "LLM_API_KEY is not configured" 错误，说明环境变量未设置

3. **测试部署后的应用：**
   - 访问你的 Vercel URL
   - 测试 LLM 功能
   - 如果返回 500 错误，检查环境变量是否正确设置

---

## 🔐 安全性说明

### 为什么这样是安全的？

1. **服务器端环境变量（`process.env`）**
   - ✅ 只在服务器运行时可用
   - ✅ 不会被打包到前端代码中
   - ✅ 客户端无法访问

2. **前端环境变量（`import.meta.env.VITE_*`）**
   - ❌ 会被打包到前端代码中
   - ❌ 任何人都可以在浏览器中看到
   - ❌ **这就是为什么我们不再使用它们**

### 对比

| 类型 | 读取方式 | 存储位置 | 是否暴露给客户端 |
|------|---------|---------|----------------|
| **服务器端** | `process.env.LLM_API_KEY` | Vercel Dashboard / `.env` | ❌ 否 |
| **客户端** | `import.meta.env.VITE_LLM_API_KEY` | 前端代码 | ✅ 是 |

---

## 📝 当前 `.env` 文件需要更新

**注意：** 你的 `.env` 文件目前还是旧格式（使用 `VITE_` 前缀），需要更新：

**旧格式（不安全，会暴露给客户端）：**
```bash
VITE_LLM_API_KEY=...
```

**新格式（安全，只在服务器端）：**
```bash
LLM_API_KEY=...
```

**请更新你的 `.env` 文件！**
