# 多语言支持说明 / Multilingual Support

Wellmate 现在支持多语言！/ Wellmate now supports multiple languages!

## 支持的语言 / Supported Languages

- 🇺🇸 English (英语)
- 🇨🇳 中文 (Chinese)

## 如何使用 / How to Use

### 切换语言 / Change Language

1. 打开应用 / Open the app
2. 点击 "Privacy & Data" / 点击 "隐私与数据"
3. 在隐私设置页面找到 "语言 / Language" 部分
4. 选择您想要的语言 / Select your preferred language
   - English - 英语
   - 中文 - Chinese

语言设置会自动保存，并在整个应用中生效。

Language preference is automatically saved and applied throughout the app.

## 翻译覆盖范围 / Translation Coverage

### 已翻译的模块 / Translated Modules

✅ **首页** / Home Screen
- 应用标题和描述
- 所有导航链接

✅ **健康追踪** / Health Tracking
- 上传医疗记录
- 症状记录
- 健康时间线
- 生活方式建议

✅ **隐私设置** / Privacy Settings
- 数据存储说明
- AI 处理同意
- 主题设置
- 语言选择

✅ **数据管理** / Data Management
- 查看数据
- 导出数据
- 删除数据

✅ **通用组件** / Common Components
- 按钮
- 免责声明
- AI 状态指示器
- 错误消息

## 技术实现 / Technical Implementation

### 文件结构 / File Structure

```
src/
├── i18n/
│   ├── index.ts          # i18n 核心逻辑
│   └── locales/
│       ├── en.ts         # 英文翻译
│       └── zh.ts         # 中文翻译
└── hooks/
    └── useTranslation.ts # React Hook
```

### 使用方法 / Usage

在组件中使用翻译：

```tsx
import { useTranslation } from '../../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

### 切换语言 / Change Language

```tsx
import { useTranslation } from '../../hooks/useTranslation';

function LanguageSwitcher() {
  const { changeLanguage, locale } = useTranslation();
  
  return (
    <button onClick={() => changeLanguage('zh')}>
      切换到中文
    </button>
  );
}
```

## 添加新语言 / Adding New Languages

1. 在 `src/i18n/locales/` 创建新的翻译文件（如 `fr.ts`）
2. 复制 `en.ts` 的结构
3. 翻译所有字符串
4. 在 `src/i18n/index.ts` 中注册新语言
5. 更新 `UserPreferences` 类型以包含新语言

## 翻译键命名规范 / Translation Key Naming

翻译键使用点号分隔的路径格式：

- `home.title` - 首页标题
- `health.upload.title` - 健康上传标题
- `privacy.dataStorage` - 隐私数据存储

## 注意事项 / Notes

- 语言偏好保存在用户偏好设置中
- 首次访问时自动检测浏览器语言
- 如果浏览器语言不支持，默认使用英语
- 所有翻译键都有英文回退

## 贡献翻译 / Contributing Translations

欢迎贡献新的语言翻译！请：

1. Fork 项目
2. 创建新的翻译文件
3. 翻译所有字符串
4. 提交 Pull Request

---

**当前版本**: v0.1.0  
**最后更新**: 2025-01-27

