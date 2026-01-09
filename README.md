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
   
   Create a `.env` file in the root directory:
   ```bash
   VITE_LLM_BASE_URL=https://hyperecho-proxy.aelf.dev/v1
   VITE_LLM_API_KEY=hy-iAce_nUcM7-gHGJY2ZJvdqa2H6nVpDZfLoZT4HndpLk
   VITE_LLM_MODEL=vibe-coding-app-gemini
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   
   The app will open automatically at `http://localhost:3000`

## 📱 Features

### Health Tracking (MVP)
- ✅ Upload medical records (text/image/PDF)
- ✅ AI-generated plain-language summaries
- ✅ Lifestyle suggestions (avoid/prefer/general)
- ✅ Symptom logging with severity tracking
- ✅ Health timeline view

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
│   ├── health/     # Health tracking screens
│   ├── privacy/    # Privacy & data management screens
│   └── shared/     # Shared UI components
├── hooks/          # Custom React hooks
├── services/       # External APIs & storage
├── utils/          # Utility functions
├── types.ts        # TypeScript type definitions
└── db.ts           # IndexedDB database setup
```

## 📝 Notes

- All data is stored locally in IndexedDB (browser storage)
- AI features require explicit user consent
- Works offline for core features (symptom logging, data viewing)
- AI processing queues when offline and processes when online

## 🔒 Privacy

- All health data stored locally on your device
- No data sent to servers without explicit consent
- Full control over data export and deletion
- Clear privacy settings and disclaimers

## 📄 License

MIT

