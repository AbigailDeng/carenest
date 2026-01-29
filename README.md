# Wellmate - Personal Health Companion

AI-powered personal health companion app for tracking health, nutrition, and emotional well-being.

## 📁 Project Structure

This is a monorepo containing both frontend and backend:

```
carenest/
├── frontend/          # React/Vite frontend app
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── ...
├── backend/           # Node.js/Express API server
│   ├── src/           # Source code
│   └── ...
├── specs/             # Feature specifications
├── images/            # Project images
└── package.json       # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser (Chrome, Safari, Firefox, Edge)

### Installation

1. **Install all dependencies (from root):**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create `.env` files in respective folders:
   
   **Backend** (`backend/.env`):
   ```bash
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   LLM_API_KEY=your-api-key
   LLM_MODEL=vibe-coding-app-gemini
   ```
   
   **Frontend** (`frontend/.env`):
   ```bash
   VITE_API_BASE_URL=http://localhost:3001
   VITE_LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   VITE_LLM_API_KEY=your-api-key
   VITE_LLM_MODEL=vibe-coding-app-gemini
   ```

3. **Start development servers:**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend at http://localhost:3000
   npm run dev:backend   # Backend at http://localhost:3001
   ```

## 📱 Features

### Companion Character System
- ✅ **2D anime companion character** - Daily interaction with empathetic companion
- ✅ **Home screen with character** - Beautiful otome game-style interface
- ✅ **State-aware dialogue** - Character responds based on mood, closeness, time-of-day
- ✅ **Emotional support** - Express feelings and receive empathetic responses
- ✅ **Relationship building** - Closeness level increases with daily interaction

### Health Tracking (MVP)
- ✅ Upload medical records (text/image/PDF)
- ✅ AI-generated plain-language summaries
- ✅ Lifestyle suggestions
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
- ✅ **Multilingual support (English/中文)**

## 🌐 Multilingual Support

Wellmate supports multiple languages:
- 🇺🇸 English
- 🇨🇳 中文 (Chinese)

**To change language:**
1. Go to Privacy Settings (`/privacy`)
2. Find "语言 / Language" section
3. Select your preferred language

See [MULTILINGUAL.md](./MULTILINGUAL.md) for more details.

## 🛠️ Development

### Available Scripts

**Root level (workspace commands):**
- `npm run dev` - Start all development servers
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build all packages
- `npm run lint` - Run linting for all packages

**Frontend (`frontend/`):**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend (`backend/`):**
- `npm run dev` - Start development server
- `npm run start` - Run production server

### Frontend Structure

```
frontend/src/
├── components/      # React components
│   ├── companion/   # Companion character system
│   ├── health/      # Health tracking screens
│   ├── nutrition/   # Nutrition tracking screens
│   ├── privacy/     # Privacy & data management
│   └── shared/      # Shared UI components
├── hooks/           # Custom React hooks
├── services/        # External APIs & storage
├── config/          # Character configurations
├── assets/          # Character assets
├── utils/           # Utility functions
└── types.ts         # TypeScript type definitions
```

### Backend Structure

```
backend/src/
├── llm-proxy.ts     # LLM API proxy
├── proxy-server.js  # Express server
└── ...
```

## 📝 Notes

- All data is stored locally in IndexedDB (browser storage)
- AI features require explicit user consent
- Works offline for core features
- Companion dialogue generation requires internet connection

## 🔒 Privacy

- All health data stored locally on your device
- No data sent to servers without explicit consent
- Full control over data export and deletion

## 📄 License

MIT
