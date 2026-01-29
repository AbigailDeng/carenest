# Wellmate - Personal Health Companion

AI-powered personal health companion app for tracking health, nutrition, and emotional well-being.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser (Chrome, Safari, Firefox, Edge)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   **For local development**, create a `.env` file in the root directory (see `.env.example` for template):
   ```bash
   LLM_API_KEY=your-api-key-here
   LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   LLM_MODEL=vibe-coding-app-gemini
   ```
   
   **For production deployment on Vercel:**
   - Go to your Vercel project settings → Environment Variables
   - Add these as **server-side** environment variables (NOT `VITE_*` prefix):
     - `LLM_API_KEY`: Your actual API key
     - `LLM_BASE_URL`: `https://hyperecho-proxy.aelf.dev/v1` (optional, has default)
     - `LLM_MODEL`: `vibe-coding-app-gemini` (optional, has default)
   
   **Important**: 
   - Never commit your `.env` file to git. It contains sensitive API keys.
   - The API key is now stored securely on the server side and never exposed to the client.

3. **Start development server:**
   
   **方法 1：使用独立代理服务器（推荐，支持任何部署平台）**
   
   ```bash
   # 同时启动代理服务器和前端开发服务器
   npm run dev
   ```
   
   这会启动：
   - 代理服务器：`http://localhost:3001`（处理 `/api/llm-proxy`）
   - 前端服务器：`http://localhost:3000`（Vite 开发服务器）
   
   **方法 2：使用 Vercel CLI（仅限 Vercel 用户）**
   
   ```bash
   npm install -g vercel
   npm run dev:vercel
   ```
   
   **方法 3：分别启动（用于调试）**
   
   ```bash
   # 终端 1：启动代理服务器
   npm run dev:proxy
   
   # 终端 2：启动前端服务器
   npm run dev:vite
   ```

4. **Open in browser:**
   
   The app will open automatically at `http://localhost:3000`
   
   **测试 API：** 打开浏览器开发者工具 → Network，触发 LLM 功能，应该看到请求发送到 `/api/llm-proxy`（不是 404）。

## 📱 Features

### Companion Character System (New!)
- ✅ **2D anime companion character** - Daily interaction with empathetic companion
- ✅ **Home screen with character** - Beautiful otome game-style interface with character illustration and entry cards
- ✅ **State-aware dialogue** - Character responds based on mood, closeness, time-of-day, and relationship stage
- ✅ **Emotional support** - Express feelings and receive empathetic, context-aware responses
- ✅ **Activity integration** - Character acknowledges health/nutrition activities and guides users to modules
- ✅ **Relationship building** - Closeness level increases with daily interaction (stranger → acquaintance → friend → close friend → intimate)
- ✅ **Proactive dialogue** - Character initiates greetings based on time-of-day and inactivity patterns

### Health Tracking (MVP)
- ✅ Upload medical records (text/image/PDF)
- ✅ AI-generated plain-language summaries
- ✅ Lifestyle suggestions (avoid/prefer/general)
- ✅ Symptom logging with severity tracking
- ✅ Health timeline view

### Nutrition Tracking (MVP)
- ✅ Food reflection logging (light/normal/indulgent)
- ✅ Meal suggestions based on health conditions
- ✅ Nutrition calendar view
- ✅ Timeline tracking

### Privacy & Data Management (MVP)
- ✅ View all stored data
- ✅ Export data (JSON/CSV)
- ✅ Delete all data with confirmation
- ✅ Consent management for AI processing
- ✅ Theme preferences
- ✅ **Multilingual support (English/中文)**

## 🌐 Multilingual Support

Wellmate supports multiple languages:
- 🇺🇸 English
- 🇨🇳 中文 (Chinese)

**To change language:**
1. Go to Privacy Settings (`/privacy`)
2. Find "语言 / Language" section
3. Select your preferred language

The language preference is saved and applied throughout the app.

See [MULTILINGUAL.md](./MULTILINGUAL.md) for more details.

## 🧪 Testing the App

### 0. Companion Character System

**Home Screen:**
- Open app at root path `/` to see companion character and three entry cards
- Character displays state-aware greeting based on time-of-day and relationship stage
- Click entry cards to navigate to Health, Nutrition, or Emotion modules

**Companion Conversation:**
- Navigate to `/companion` or click "陪伴" (Companion) in bottom navigation
- Send messages to companion and receive empathetic responses
- Character state (mood, closeness, energy) affects dialogue tone
- Express emotions (sad, stressed, lonely, happy) to receive emotional support
- Character acknowledges when you complete health/nutrition activities

**Relationship Building:**
- Interact daily to increase closeness level (0-100)
- Relationship stages: Stranger (0) → Acquaintance (21) → Friend (41) → Close Friend (61) → Intimate (81+)
- Character mood updates based on your emotional expressions
- Energy level adjusts based on time-of-day (morning: high, afternoon: medium, evening: low)

### 1. Health Tracking

**Upload Medical Record:**
- Navigate to `/health/upload`
- Upload a text file, image, or PDF (max 10MB)
- Wait for AI processing (requires consent in Privacy Settings)
- View summary at `/health/summary/:id`

**Log Symptoms:**
- Navigate to `/health/symptoms`
- Enter symptoms, severity, and notes
- Save entry
- View timeline at `/health/timeline`

### 2. Privacy & Data Management

**View Data:**
- Navigate to `/privacy/view`
- Expand sections to see stored data

**Export Data:**
- Navigate to `/privacy/export`
- Choose JSON or CSV format
- Download file

**Manage Consent:**
- Navigate to `/privacy`
- Toggle "Enable AI Processing" to allow AI features
- This is required for medical record summarization

**Delete All Data:**
- Navigate to `/privacy/delete`
- Type "DELETE ALL DATA" to confirm
- All data will be permanently removed

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── components/      # React components
│   ├── companion/   # Companion character system screens
│   ├── health/     # Health tracking screens
│   ├── nutrition/  # Nutrition tracking screens
│   ├── privacy/    # Privacy & data management screens
│   └── shared/     # Shared UI components
├── hooks/          # Custom React hooks
│   ├── useCompanion.ts
│   ├── useCharacterState.ts
│   ├── useConversation.ts
│   └── useProactiveDialogue.ts
├── services/       # External APIs & storage
│   ├── companionService.ts  # Dialogue generation
│   └── storage/    # IndexedDB storage services
├── config/         # Character configurations
│   └── characters/ # Character configs (baiqi.json)
├── assets/         # Character assets
│   └── characters/ # Character images and backgrounds
├── utils/          # Utility functions
├── types.ts        # TypeScript type definitions
└── db.ts           # IndexedDB database setup
```

## 📝 Notes

- All data is stored locally in IndexedDB (browser storage)
- AI features require explicit user consent
- Works offline for core features (symptom logging, data viewing, conversation history)
- Companion dialogue generation requires internet connection (falls back to templates when offline)
- AI processing queues when offline and processes when online
- Companion character state persists across sessions
- Conversation history stored locally (no cloud sync)

## 🔒 Privacy

- All health data stored locally on your device
- No data sent to servers without explicit consent
- Full control over data export and deletion
- Clear privacy settings and disclaimers

## 📄 License

MIT

