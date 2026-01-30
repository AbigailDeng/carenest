# 部署构建问题修复指南

## 问题：`vite: not found`

### 原因
`vite` 在 `devDependencies` 中，某些部署平台可能：
1. 没有安装 devDependencies
2. 构建命令没有先运行 `npm install`

### 解决方案

#### 方案 1：使用 npx（已应用）✅

修改 `package.json` 中的构建命令：
```json
"build": "npx vite build"
```

`npx` 会自动从 `node_modules` 中查找并运行 `vite`，即使它不在全局 PATH 中。

#### 方案 2：确保安装所有依赖

在部署平台的 **Build Command** 中设置为：
```bash
npm install && npm run build
```

或者如果平台默认跳过 devDependencies：
```bash
npm install --include=dev && npm run build
```

---

## 不同平台的 Build Command 配置

### Render

**前端服务（Static Site）：**
```
Build Command: npm install && npm run build
Publish Directory: dist
```

### Railway

**前端服务：**
```
Build Command: npm install && npm run build
Start Command: （不需要，静态文件）
```

### Vercel

Vercel 会自动处理，通常不需要额外配置。

### Netlify

**Build settings:**
```
Build command: npm install && npm run build
Publish directory: dist
```

---

## 验证修复

修改后，构建应该能够：
1. ✅ 找到 `vite` 命令（通过 `npx`）
2. ✅ 成功编译 TypeScript
3. ✅ 生成 `dist/` 目录

---

## 如果还有问题

检查以下几点：

1. **确保 package.json 已提交到 Git**
   ```bash
   git add package.json
   git commit -m "fix: use npx for vite build"
   git push
   ```

2. **检查部署平台的 Build Command**
   - 应该包含 `npm install` 或 `npm ci`
   - 然后运行 `npm run build`

3. **查看完整的构建日志**
   - 确认 `npm install` 是否成功
   - 确认 `vite` 是否被安装到 `node_modules`
