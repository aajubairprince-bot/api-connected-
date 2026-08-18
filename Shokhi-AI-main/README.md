# 🌸 Shokhi AI (সখী AI)

**Context-Aware Generative AI Maternal Health & Obstetric Care Companion**

Shokhi AI is a bilingual (Bengali 🇧🇩 + English) AI-powered maternal health platform designed to support expectant mothers through pregnancy with compassionate, culturally grounded guidance.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js ≥ 18 (ESM) |
| **API Pattern** | Vercel Serverless Functions |
| **Generative AI** | Google Gemini (`gemini-2.5-flash`) |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Auth** | JWT + Supabase Auth (Google OAuth) |
| **Frontend** | Vanilla HTML5 / CSS3 / JavaScript |
| **Deployment** | Vercel (production) + Docker (self-hosted) |

---

## ✨ Features

- 🤖 **Bilingual AI Chat** — Empathetic maternal companion in Bengali & English
- 🏥 **Emergency Triage** — Keyword-detected red-flag escalation with helplines (999, 16263, 109, 333)
- 📊 **Health Tracker** — Meals, mood, vitals (BP/weight), kicks, hydration, routines, appointments
- 🔔 **Smart Notifications** — Hydration reminders, kick monitoring, appointment alerts
- 📷 **Multimodal Vision** — Gemini Vision analyzes sonograms & medical documents
- 🛡️ **Admin Panel** — Real-time clinical dashboard with Supabase Live subscriptions
- 🔐 **Multi-Tenant Security** — Row Level Security (RLS), JWT auth, zero cross-tenant leakage
- 📅 **Gestational Stage Engine** — Week/trimester calculation injected into every AI prompt
- 🔊 **Voice TTS** — Audio responses in Bengali & English

---

## 🗂️ Project Structure

```
├── api/              # 40 Serverless API route handlers
│   ├── admin/        # Admin metrics, role assignment, delete
│   ├── auth/         # Register, login, Google OAuth, me
│   ├── chat/         # AI chat, sessions, messages, delete
│   ├── emergency/    # Helplines, hospital search, audit log
│   ├── maternity/    # Health tracking (meals, mood, vitals, etc.)
│   ├── notifications/# Notification engine + trigger evaluation
│   └── ...
├── lib/              # Shared libraries (auth, gemini, supabase, validation)
├── www/              # Frontend (landing.html, index.html, admin.html)
├── docs/             # 30+ documentation files
├── server.js         # Local dev HTTP server
├── vercel.json       # Vercel deployment config (40 routes + 1 cron)
├── supabase_schema.sql # PostgreSQL schema (12 tables + RLS + indexes)
└── test_node_e2e.js  # 48-test automated E2E suite
```

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone <repo-url>
cd Shokhi-AI-main
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your Supabase URL, keys, and Gemini API key
```

### 3. Set Up Supabase
Run `supabase_schema.sql` in your Supabase SQL Editor.

### 4. Run Locally
```bash
npm start          # Production mode
npm run dev        # Dev mode
npm test           # Run 48 E2E tests
```

### 5. Deploy to Vercel
```bash
vercel --prod
```

---

## 🧪 Testing

```bash
npm test
# ✅ 48/48 tests passing (100%)
```

Covers: Auth, Chat, Multi-tenant isolation, Maternity tracker, Emergency, Notifications, Admin RBAC, Multimodal, TTS, Image generation.

---

## 📚 Documentation

Full documentation lives in the [`/docs`](./docs/) directory:

- [`ARCHITECTURE_REPORT.md`](./docs/ARCHITECTURE_REPORT.md) — System architecture
- [`API_REFERENCE.md`](./docs/API_REFERENCE.md) — All 40 API endpoints
- [`DATABASE_DESIGN.md`](./docs/DATABASE_DESIGN.md) — Database schema
- [`SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) — Supabase setup guide
- [`ADMIN_PANEL_GUIDE.md`](./docs/ADMIN_PANEL_GUIDE.md) — Admin panel guide

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (admin) |
| `SECRET_KEY` | ✅ | JWT signing secret |
| `NODE_PORT` | ➖ | Local server port (default: 3000) |

---

## 📄 License

Academic practicum project — Bachelor of Computer Science & Engineering (BCSE).