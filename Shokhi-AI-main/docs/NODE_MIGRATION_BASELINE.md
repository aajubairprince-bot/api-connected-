# Shokhi AI (সখী AI) — Node.js / Vercel Migration Baseline (Step 0)

**Document Version:** 1.0.0-BASELINE  
**Date:** August 17, 2026  
**Migration Goal:** Safe, non-destructive migration from Flask/Python to Node.js / Vercel Serverless Functions + Supabase + Gemini API  
**Status:** Baseline Recorded — Zero Modifications Made to Application Functionality  

---

## 1. Executive Migration Overview & Safety Directive

This document establishes the official technical baseline before initiating any code changes for the Node.js/Vercel backend migration. 

### Absolute Safety Rules Adhered To:
* **No Code Deletion:** `app.py`, `gemini_service.py`, `supabase_client.py`, `requirements.txt`, and all 13 verification test suites (`test_phase4.py` through `test_phase16.py`, `run_all_tests.py`) are strictly preserved and remain 100% operational as a running reference.
* **No Premature Rebuilding:** All existing relational models, prompt guardrails, authentication workflows, and UI behaviors will be migrated modularly, endpoint-by-endpoint.

---

## 2. Current System Architecture

```mermaid
graph TD
    subgraph Frontend Tier (www/)
        F1[index.html - Single Page Maternal Dashboard]
        F2[main.js - Chat & Audio Engine]
        F3[style.css - Styling & Themes]
    end

    subgraph Backend Runtime (Flask / Python 3.12)
        B1[app.py - 37 REST API Endpoints]
        B2[supabase_client.py - Auth & JWT Engine]
        B3[gemini_service.py - AI & Guardrails Engine]
        B4[APScheduler - Daily Notification Worker]
    end

    subgraph Persistence Tier
        D1[(Supabase PostgreSQL / Local SQLite Fallback)]
        D2[uploads/ - Sonograms & Medical Images]
        D3[app.log - Rotating File Logger]
    end

    F1 -->|REST APIs / JWT| B1
    F2 -->|Chat & Audio POST| B1
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B1 --> D1
    B1 --> D2
    B1 --> D3
```

---

## 3. Current Backend Component Inventory

### 3.1 `app.py` (Flask Service Hub)
* **Framework:** Flask 3.x with Flask-CORS, Flask-SQLAlchemy, Flask-Admin, and APScheduler.
* **Responsibilities:**
  * Serves frontend static files from `www/`.
  * Manages 37 active API routes.
  * Enforces sliding-window rate limiting (10 RPM on chat).
  * Injects security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`).
  * Injects cache headers (`public, max-age=86400` on static assets, `no-cache, no-store` on dynamic APIs).
  * Global structured JSON exception handling for 400, 401, 403, 404, 429, and 500.

### 3.2 `supabase_client.py` (Authentication & Security Engine)
* **Responsibilities:**
  * Initializes Supabase Client with `SUPABASE_URL` and `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
  * Verifies JWT bearer tokens against Supabase Auth.
  * In offline/fallback mode, generates and verifies cryptographic HMAC-SHA256 tokens with PBKDF2 hashing.
  * Enforces `@require_auth` decorator, populating `g.user`.

### 3.3 `gemini_service.py` (Intelligent Generative AI & Safety Engine)
* **Responsibilities:**
  * Manages multi-tier model fallback chain (`gemini-2.5-flash` → `gemini-3.6-flash` → `gemini-3.1-pro`).
  * Sanitizes inputs and neutralizes prompt injection patterns (`PROMPT_INJECTION_PATTERNS`).
  * Executes red-flag emergency detection (`EMERGENCY_KEYWORDS_BN` / `EMERGENCY_KEYWORDS_EN`).
  * Injects maternal gestational stage context (pregnancy week, trimester, blood group, allergies).
  * Handles multimodal vision (ultrasounds, prescriptions) via `types.Part.from_bytes` with mandatory non-diagnostic disclaimers.

---

## 4. Current Relational Database Schema (11 Models)

All 11 relational models are indexed on `user_id` and temporal keys:

1. **`User` (`user`)**: `id`, `name`, `email`, `password_hash`, `pregnancy_week`, `due_date`, `blood_group`, `emergency_contact_name`, `emergency_contact_phone`, `allergies`, `medical_history`, `language_preference`, `is_admin`, `created_at`, `updated_at`.
2. **`Notification` (`notifications`)**: `id`, `user_id`, `title`, `message`, `notification_type`, `scheduled_time`, `is_read`, `is_dismissed`, `sound_enabled`, `created_at`, `read_at`.
3. **`ChatSession` (`chat_sessions`)**: `id`, `user_id`, `title`, `created_at`, `updated_at`.
4. **`ChatMessage` (`chat_messages`)**: `id`, `session_id`, `user_id`, `role`, `content`, `has_image`, `image_url`, `created_at`.
5. **`MealLog` (`meal_logs`)**: `id`, `user_id`, `meal_type`, `description`, `logged_at`.
6. **`MoodSymptom` (`mood_symptoms`)**: `id`, `user_id`, `entry_type`, `label`, `severity`, `logged_at`.
7. **`Appointment` (`appointments`)**: `id`, `user_id`, `doctor_name`, `hospital_clinic`, `appointment_time`, `notes`, `is_completed`, `created_at`.
8. **`VitalRecord` (`vital_records`)**: `id`, `user_id`, `bp`, `weight_kg`, `notes`, `recorded_at`.
9. **`DailyRoutine` (`daily_routines`)**: `id`, `user_id`, `routine_key`, `is_completed`, `record_date`, `completed_at`.
10. **`KickRecord` (`kick_records`)**: `id`, `user_id`, `kick_count`, `session_start`, `session_end`.
11. **`SavedBabyName` (`saved_baby_names`)**: `id`, `user_id`, `name`, `gender`, `meaning`, `created_at`.
12. **`EmergencyLog` (`emergency_logs`)**: `id`, `user_id`, `trigger_source`, `symptom_detected`, `action_taken`, `created_at`.

---

## 5. Complete Inventory of Active Endpoints (37 Endpoints)

| # | HTTP Method | Endpoint | Description | Auth Required |
| :---: | :---: | :--- | :--- | :---: |
| 1 | `GET` | `/` | Serves main single-page application (`index.html`) | No |
| 2 | `GET` | `/api/health` | System health check (DB, Gemini, Uptime) | No |
| 3 | `GET` | `/api/config` | Client configuration & API availability | No |
| 4 | `GET` | `/api/system/status` | System status and active model | No |
| 5 | `GET` | `/api/voice/config` | Voice engine configuration (bn-BD / en-US) | No |
| 6 | `GET` | `/api/emergency/hospital_search` | Generates hospital search Google Maps query | No |
| 7 | `GET` | `/api/debug/test_500` | Structured 500 error test route | No |
| 8 | `GET` | `/uploads/<filename>` | Serves uploaded image/document files | No |
| 9 | `POST` | `/api/speak` | gTTS audio synthesis endpoint | No |
| 10 | `POST` | `/api/auth/register` | User registration (creates record & JWT) | No |
| 11 | `POST` | `/api/auth/login` | User login (validates credentials & returns JWT) | No |
| 12 | `GET` | `/api/auth/me` | Fetches authenticated user's claim profile | **Yes** |
| 13 | `POST` | `/api/auth/sync_profile` | Synchronizes Supabase profile with DB | **Yes** |
| 14 | `GET` | `/api/profile` | Fetches gestational context & clinical profile | **Yes** |
| 15 | `PUT`/`POST` | `/api/profile` | Updates maternal profile & recalculates trimester | **Yes** |
| 16 | `GET` | `/api/get_all_sessions` | Lists all chat sessions for the user | **Yes** |
| 17 | `GET` | `/api/get_chat_messages/<chat_id>` | Retrieves message history for a chat session | **Yes** |
| 18 | `DELETE` | `/api/delete_chat_session/<chat_id>` | Deletes chat session and associated messages | **Yes** |
| 19 | `POST` | `/api/ask_prova_chat` | Core conversational & multimodal AI endpoint | **Yes** |
| 20 | `POST` | `/api/multimodal/upload` | Validates & uploads 5MB sonogram/report images | **Yes** |
| 21 | `GET` | `/api/admin/metrics` | Telemetry & defense metrics (admin only) | **Yes (Admin)** |
| 22 | `GET` | `/api/emergency/helplines` | Returns 999, 16263, 109, 333 + personal contact | **Yes** |
| 23 | `POST` | `/api/emergency/log` | Logs emergency / SOS incident | **Yes** |
| 24 | `GET` | `/api/maternity/overview` | Fetches aggregate dashboard dataset | **Yes** |
| 25 | `POST` | `/api/maternity/meals` | Logs nutritional meal entry | **Yes** |
| 26 | `DELETE` | `/api/maternity/meals/<id>` | Deletes meal log | **Yes** |
| 27 | `POST` | `/api/maternity/mood` | Logs mood or symptom record | **Yes** |
| 28 | `DELETE` | `/api/maternity/mood/<id>` | Deletes mood/symptom log | **Yes** |
| 29 | `POST` | `/api/maternity/appointments` | Creates doctor visit appointment | **Yes** |
| 30 | `DELETE` | `/api/maternity/appointments/<id>` | Deletes doctor appointment | **Yes** |
| 31 | `POST` | `/api/maternity/vitals` | Records blood pressure and weight | **Yes** |
| 32 | `DELETE` | `/api/maternity/vitals/<id>` | Deletes vital record | **Yes** |
| 33 | `POST` | `/api/maternity/routines/toggle` | Toggles daily routine checklist item | **Yes** |
| 34 | `POST` | `/api/maternity/kicks` | Updates fetal kick counter | **Yes** |
| 35 | `POST` | `/api/maternity/names` | Saves baby name to shortlist | **Yes** |
| 36 | `DELETE` | `/api/maternity/names/<id>` | Deletes saved baby name | **Yes** |
| 37 | `GET` | `/api/notifications` | Fetches user notifications list | **Yes** |
| 38 | `POST` | `/api/notifications` | Creates custom reminder notification | **Yes** |
| 39 | `PATCH`/`POST` | `/api/notifications/<id>/read` | Marks notification as read | **Yes** |
| 40 | `PATCH`/`POST` | `/api/notifications/<id>/dismiss`| Dismisses notification | **Yes** |
| 41 | `POST` | `/api/notifications/trigger_eval`| Triggers periodic care reminder generation | **Yes** |
| 42 | `GET` | `/api/notifications/history` | Fetches notification audit history | **Yes** |

---

## 6. Environment Variables Reference

| Variable Name | Server-Side / Client-Side | Purpose |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Server-Side Only | Google Gemini API Key |
| `GEMINI_MODEL` | Server-Side Only | Default Gemini Model (`gemini-3.6-flash`) |
| `SUPABASE_URL` | Public / Server-Side | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Public / Client-Side | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Side Only | Supabase Service Role Secret Key |
| `SECRET_KEY` | Server-Side Only | JWT & Session Encryption Secret |
| `FLASK_PORT` | Server-Side Only | Local Flask Dev Server Port |

---

## 7. Current Test Results Baseline

The master automated test harness (`run_all_tests.py`) was executed on the running Flask backend:
* **Total Suites Executed:** 13
* **Passed:** 13
* **Failed:** 0
* **Pass Rate:** **100.0%**
* **Health Check Status:** `{"status": "HEALTHY", "subsystems": {"database": "CONNECTED", "gemini_generative_ai": "CONFIGURED", "emergency_triage_engine": "ACTIVE", "maternal_context_engine": "ACTIVE", "notification_engine": "ACTIVE"}}`

---

## 8. Migration Target & Key Serverless Constraints

### Target Stack:
* **Frontend:** Static Single Page Application hosted on Vercel (`www/` or `public/`).
* **API Layer:** Node.js Vercel Serverless Functions (`api/` directory in ESM / TypeScript or JavaScript).
* **Database & Auth:** Supabase Auth + Supabase PostgreSQL with Row Level Security (RLS).
* **AI Engine:** Google Gen AI SDK for Node.js (`@google/genai` or `@google/generative-ai`).

### Critical Architectural Transformations Identified:
1. **No Long-Running APScheduler:** Background cron jobs in Flask must transition to Vercel Cron Functions (`vercel.json` crons) or in-app evaluation on `/api/notifications/trigger_eval`.
2. **No Ephemeral File Writes for Audio / Uploads:** gTTS file generation (`temp_audio.mp3`) and local file storage (`uploads/`) will be replaced by in-memory stream buffers or Supabase Storage buckets, while utilizing client-side Web Speech API for TTS.
3. **No In-Memory `RATE_LIMIT_STORE` between Lambdas:** In serverless, rate limiting is handled per invocation or via lightweight sliding-window headers / Upstash Redis if needed.
4. **Stateless JWT Verification:** Node.js `@supabase/supabase-js` verifies bearer tokens on each serverless invocation.

---

**Baseline Recorded. Flask backend remains completely untouched and functional.**
