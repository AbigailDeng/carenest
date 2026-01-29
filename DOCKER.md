# Docker 部署指南

## 🐳 后端代理服务器 Dockerfile

本项目包含一个优化的 Dockerfile，用于部署后端代理服务器。

### 特性

- ✅ **多阶段构建** - 减小镜像大小
- ✅ **Alpine Linux** - 轻量级基础镜像
- ✅ **非 root 用户** - 提高安全性
- ✅ **健康检查** - 自动监控服务状态
- ✅ **生产优化** - 只安装必要的依赖

---

## 📦 构建 Docker 镜像

### 基本构建

```bash
docker build -t carenest-proxy:latest .
```

### 指定标签

```bash
docker build -t carenest-proxy:v1.0.0 .
```

### 构建时查看详细信息

```bash
docker build --progress=plain -t carenest-proxy:latest .
```

---

## 🚀 运行容器

### 基本运行

```bash
docker run -d \
  --name carenest-proxy \
  -p 3001:3001 \
  -e LLM_API_KEY=your-api-key-here \
  carenest-proxy:latest
```

### 完整配置（所有环境变量）

```bash
docker run -d \
  --name carenest-proxy \
  -p 3001:3001 \
  -e LLM_API_KEY=your-api-key-here \
  -e LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1 \
  -e LLM_MODEL=vibe-coding-app-gemini \
  -e PROXY_PORT=3001 \
  carenest-proxy:latest
```

### 使用环境变量文件

创建 `.env.docker` 文件：

```bash
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
LLM_MODEL=vibe-coding-app-gemini
PROXY_PORT=3001
```

然后运行：

```bash
docker run -d \
  --name carenest-proxy \
  -p 3001:3001 \
  --env-file .env.docker \
  carenest-proxy:latest
```

---

## 🔍 验证部署

### 检查容器状态

```bash
docker ps
```

### 查看日志

```bash
docker logs carenest-proxy
```

### 测试健康检查端点

```bash
curl http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "LLM Proxy Server is running",
  "hasApiKey": true
}
```

### 测试代理端点

```bash
curl -X POST http://localhost:3001/api/llm-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

---

## 🌐 部署到云平台

### Docker Hub

```bash
# 登录
docker login

# 标记镜像
docker tag carenest-proxy:latest yourusername/carenest-proxy:latest

# 推送
docker push yourusername/carenest-proxy:latest
```

### Railway

1. 连接 GitHub 仓库
2. Railway 会自动检测 Dockerfile
3. 在环境变量中设置 `LLM_API_KEY`

### Render

1. 创建新的 Web Service
2. 选择 Docker
3. 连接 Git 仓库
4. 设置环境变量

### Fly.io

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 初始化（如果还没有 fly.toml）
fly launch

# 设置密钥
fly secrets set LLM_API_KEY=your-api-key-here

# 部署
fly deploy
```

### Google Cloud Run

```bash
# 构建并推送
gcloud builds submit --tag gcr.io/PROJECT_ID/carenest-proxy

# 部署
gcloud run deploy carenest-proxy \
  --image gcr.io/PROJECT_ID/carenest-proxy \
  --platform managed \
  --region us-central1 \
  --set-env-vars LLM_API_KEY=your-api-key-here \
  --allow-unauthenticated
```

### AWS ECS / Fargate

1. 构建并推送到 ECR
2. 创建 ECS 任务定义
3. 设置环境变量
4. 部署服务

---

## 🔧 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `LLM_API_KEY` | ✅ 是 | - | LLM API 密钥 |
| `LLM_BASE_URL` | ❌ 否 | `https://hyperecho-proxy.aelf.dev/v1` | LLM API 基础 URL |
| `LLM_MODEL` | ❌ 否 | `vibe-coding-app-gemini` | 使用的模型 |
| `PROXY_PORT` | ❌ 否 | `3001` | 服务器监听端口 |
| `NODE_ENV` | ❌ 否 | `production` | Node.js 环境 |

---

## 📊 镜像大小优化

当前 Dockerfile 使用多阶段构建，最终镜像大小约为 **~150MB**（基于 Alpine）。

### 进一步优化（可选）

如果需要更小的镜像，可以考虑：

1. **使用 distroless 镜像**（更小但调试困难）
2. **移除不必要的文件**
3. **使用 npm prune** 清理依赖

---

## 🛠️ 开发模式

### 本地开发（不使用 Docker）

```bash
npm run dev:proxy
```

### Docker 开发模式（挂载代码）

```bash
docker run -it --rm \
  -p 3001:3001 \
  -v $(pwd)/server:/app/server \
  -v $(pwd)/package.json:/app/package.json \
  -e LLM_API_KEY=your-api-key-here \
  carenest-proxy:latest
```

---

## 🐛 故障排除

### 问题：容器立即退出

**检查：**
```bash
docker logs carenest-proxy
```

**常见原因：**
- `LLM_API_KEY` 未设置
- 端口冲突

### 问题：无法连接到代理

**检查：**
1. 容器是否运行：`docker ps`
2. 端口映射是否正确：`docker port carenest-proxy`
3. 防火墙设置

### 问题：健康检查失败

**检查：**
```bash
docker exec carenest-proxy node -e "console.log(process.env)"
```

确认环境变量是否正确设置。

---

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Node.js Docker 最佳实践](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 其他部署选项
