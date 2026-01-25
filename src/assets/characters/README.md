# 角色资源图片说明

## 文件结构

本目录包含角色系统的所有视觉资源：

```
characters/
├── baiqi/
│   ├── avatar.png                    # 角色头像（圆形，用于聊天界面）
│   ├── illustrations/                # 角色插图（不同心情状态）
│   │   ├── default.png              # 默认/平静状态
│   │   ├── happy.png                # 开心状态
│   │   ├── calm.png                 # 平静状态
│   │   ├── concerned.png            # 关心/担忧状态
│   │   ├── energetic.png            # 精力充沛状态
│   │   └── tired.png                # 疲惫状态
│   └── backgrounds/                 # 场景背景（不同时间段）
│       ├── morning.png              # 早晨背景
│       ├── afternoon.png           # 下午背景
│       ├── evening.png              # 傍晚背景
│       └── night.png                # 夜晚背景
└── overlays/
    └── floral.png                   # 花卉装饰覆盖层
```

## 当前状态

⚠️ **当前所有图片都是 SVG 格式的占位符**，用于确保系统可以正常运行。

## 替换为实际图片

要替换为实际的角色图片，请：

1. **准备图片文件**：
   - 头像：建议尺寸 128x128px 或更大，正方形
   - 插图：建议尺寸 400x600px 或更大，竖版
   - 背景：建议尺寸 800x1200px 或更大，竖版
   - 覆盖层：建议尺寸 400x400px 或更大，正方形

2. **图片格式**：
   - 支持 PNG、JPG、WebP 格式
   - 建议使用 PNG（支持透明背景）或 WebP（更小文件）

3. **替换步骤**：
   - 将新图片文件复制到对应的目录
   - 保持文件名和扩展名一致
   - 刷新浏览器缓存

## 图片要求

### 角色插图风格
- **2D 动漫风格**：日式动漫角色设计
- **男性角色**：温和、支持性的外观
- **表情变化**：根据心情状态显示不同表情
- **背景透明**：建议使用透明背景（PNG）

### 场景背景风格
- **柔和色调**：温暖、平静的色彩
- **时间段区分**：早晨（暖黄）、下午（明亮蓝）、傍晚（橙红）、夜晚（深蓝）
- **简洁设计**：不抢夺角色焦点

### 装饰覆盖层
- **花卉图案**：柔和的装饰性元素
- **低透明度**：约 20-30% 透明度
- **重复图案**：可平铺使用

## 配置路径

图片路径在 `src/config/characters/baiqi.json` 中配置：

```json
{
  "avatarUrl": "/assets/characters/baiqi/avatar.png",
  "illustrationUrls": {
    "default": "/assets/characters/baiqi/illustrations/default.png",
    ...
  },
  "backgroundUrls": {
    "morning": "/assets/characters/baiqi/backgrounds/morning.png",
    ...
  }
}
```

确保构建工具（Vite）会将 `src/assets` 目录的内容复制到 `public/assets` 或正确处理资源路径。

## 注意事项

- 图片文件大小：建议单个文件不超过 500KB
- 加载性能：考虑使用 WebP 格式或图片压缩
- 响应式：确保图片在不同屏幕尺寸下显示良好
- 缓存：更新图片后可能需要清除浏览器缓存
