# 构建错误修复：Cannot find package 'vite'

## 🔴 错误原因

错误 `Cannot find package 'vite'` 表明：
1. **`vite` 包没有被安装** - 部署平台可能跳过了 devDependencies
2. **构建命令没有先安装依赖** - 直接运行了 `vite build` 而没有 `npm install`

## ✅ 解决方案

### 方案 1：修改 Build Command（推荐）

在部署平台的 **Build Command** 中设置为：

```bash
npm install && npm run build
```

**重要：** 不要使用 `npm install --production`，这会跳过 devDependencies！

### 方案 2：使用 npm ci（更可靠）

```bash
npm ci && npm run build
```

`npm ci` 会：
- 安装所有依赖（包括 devDependencies）
- 使用 `package-lock.json` 确保版本一致
- 更快、更可靠

### 方案 3：明确安装 devDependencies

如果平台默认跳过 devDependencies：

```bash
npm install --include=dev && npm run build
```

---

## 📝 不同平台的配置

### Render

**前端服务（Static Site）：**
```
Build Command: npm install && npm run build
Publish Directory: dist
```

或者：
```
Build Command: npm ci && npm run build
Publish Directory: dist
```

### Railway

**前端服务：**
```
Build Command: npm install && npm run build
```

或者：
```
Build Command: npm ci && npm run build
```

### Netlify

**Build settings:**
```
Build command: npm install && npm run build
Publish directory: dist
```

### Vercel

Vercel 会自动处理，通常不需要额外配置。

---

## 🔍 验证步骤

1. **检查构建日志**
   - 应该看到 `npm install` 或 `npm ci` 的输出
   - 确认 `vite` 被安装到 `node_modules`

2. **检查 node_modules**
   构建日志中应该显示：
   ```
   + vite@5.0.0
   + @vitejs/plugin-react@4.2.0
   + vite-plugin-pwa@0.17.0
   ```

3. **确认构建成功**
   - 应该看到 `vite build` 的输出
   - 最终生成 `dist/` 目录

---

## ⚠️ 常见错误

### ❌ 错误配置 1：跳过 devDependencies
```bash
npm install --production  # ❌ 这会跳过 vite！
```

### ❌ 错误配置 2：没有安装依赖
```bash
npm run build  # ❌ 如果之前没有 npm install
```

### ✅ 正确配置
```bash
npm install && npm run build  # ✅ 先安装，再构建
```

---

## 🎯 最终检查清单

- [ ] Build Command 包含 `npm install` 或 `npm ci`
- [ ] **没有**使用 `--production` 标志
- [ ] Build Command 在 `npm run build` 之前运行
- [ ] `package.json` 已提交到 Git
- [ ] `package-lock.json` 已提交到 Git（如果使用 npm ci）

---

## 📚 相关文件

- `package.json` - 包含构建脚本和依赖
- `vite.config.ts` - Vite 配置文件
- `DEPLOYMENT_BUILD_FIX.md` - 其他构建问题修复
