# Shokhi AI (সখী AI) — Flask to Node.js Backend Migration Map (Step 1)

**Document Version:** 1.0.0  
**Date:** August 17, 2026  
**Status:** In-Depth Component Mapping Complete  

---

## 1. Executive Inventory

This inventory maps every route, helper, database entity, AI service, and middleware in the Flask/Python implementation to its precise Vercel/Node.js serverless equivalent.

---

## 2. Master Flask → Node.js Component Migration Matrix

| Flask Component | Purpose | Dependencies | Node.js Replacement | Supabase Replacement | Frontend Dependency | Migration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `GET /` | Serves main UI | `Flask.send_static_file` | Vercel Static Routing (`www/`) | Static asset hosting | Main Dashboard UI | Planned |
| `GET /api/health` | System health check | DB ping, Gemini key check | `api/health.js` | PostgreSQL `SELECT 1` ping | Monitoring / DevOps | Planned |
| `GET /api/config` | Client configuration | Environment variables | `api/config.js` | N/A (Serverless env) | `www/index.html` init | Planned |
| `GET /api/system/status` | System status & model name | `os.getenv` | `api/system/status.js` | N/A | System status badge | Planned |
| `GET /api/voice/config` | Voice STT/TTS config (bn-BD, en-US) | Static JSON dictionary | `api/voice/config.js` | N/A | Voice recording module | Planned |
| `GET /api/emergency/hospital_search` | Generates hospital maps query | `urllib.parse` | `api/emergency/hospital_search.js` | N/A | SOS hospital locator | Planned |
| `GET /api/debug/test_500` | Structured 500 error diagnostic | Python `RuntimeError` | `api/debug/test_500.js` | N/A | Test harness | Planned |
| `POST /api/speak` | gTTS voice synthesis | `gTTS`, `temp_audio.mp3` | `api/speak.js` (Web Speech API preferred) | Audio buffer / Storage | Voice button in chat | Planned |
| `POST /api/auth/register` | User registration | `bcrypt`, `User` model, JWT | `api/auth/register.js` | `supabase.auth.signUp` / `users` table | Registration modal | Planned |
| `POST /api/auth/login` | User login & token issue | `bcrypt`, `User` model, JWT | `api/auth/login.js` | `supabase.auth.signInWithPassword` | Login modal | Planned |
| `GET /api/auth/me` | Fetch authenticated user | `@require_auth`, `g.user` | `api/auth/me.js` | `supabase.auth.getUser` | Auth persistence check | Planned |
| `POST /api/auth/sync_profile` | Sync Supabase profile | `@require_auth`, `User` model | `api/auth/sync_profile.js` | `users` table upsert | Profile modal | Planned |
| `GET /api/profile` | Gestational context & metrics | `compute_pregnancy_metrics()` | `api/profile/index.js` (GET) | `users` table | Profile & trimester header | Planned |
| `PUT /api/profile` | Update maternal profile | `compute_pregnancy_metrics()` | `api/profile/index.js` (PUT) | `users` table update | Profile edit form | Planned |
| `GET /api/get_all_sessions` | List user chat sessions | `ChatSession` query | `api/chat/sessions.js` (GET) | `chat_sessions` table | Chat history sidebar | Planned |
| `GET /api/get_chat_messages/<id>` | Fetch chat message history | `ChatMessage` query | `api/chat/messages.js?chat_id=` | `chat_messages` table | Chat message feed | Planned |
| `DELETE /api/delete_chat_session/<id>` | Delete chat session | Cascade delete `ChatSession` | `api/chat/delete.js` | `chat_sessions` delete | Session delete button | Planned |
| `POST /api/ask_prova_chat` | Generative chat & vision | `gemini_service.py`, `ChatMessage` | `api/chat/index.js` (POST) | `chat_messages` insert | Interactive chat box | Planned |
| `POST /api/multimodal/upload` | Upload sonogram/report (5MB) | `request.files`, `uploads/` | `api/multimodal/upload.js` | Supabase Storage / Buffer | Camera & upload button | Planned |
| `GET /api/emergency/helplines` | Returns 999, 16263, 109, 333 | Emergency directory + User contact | `api/emergency/helplines.js` | `users` table for contact | SOS modal | Planned |
| `POST /api/emergency/log` | Logs SOS incidents | `EmergencyLog` model | `api/emergency/log.js` | `emergency_logs` table | SOS trigger action | Planned |
| `GET /api/admin/metrics` | Telemetry & defense metrics | `@require_admin`, aggregates | `api/admin/metrics.js` | Supabase aggregate queries | Admin dashboard | Planned |
| `GET /api/maternity/overview` | Aggregated health dashboard | Multi-table queries | `api/maternity/overview.js` | Parallel Supabase queries | Main dashboard counters | Planned |
| `POST /api/maternity/meals` | Log nutritional meal | `MealLog` insert, `html.escape` | `api/maternity/meals.js` (POST) | `meal_logs` table | Nutrition tracker form | Planned |
| `DELETE /api/maternity/meals/<id>` | Delete meal entry | `MealLog` delete | `api/maternity/meals.js` (DELETE) | `meal_logs` delete | Meal remove button | Planned |
| `POST /api/maternity/mood` | Log mood / symptom | `MoodSymptom` insert | `api/maternity/mood.js` (POST) | `mood_symptoms` table | Mood & symptom selector | Planned |
| `DELETE /api/maternity/mood/<id>` | Delete mood log | `MoodSymptom` delete | `api/maternity/mood.js` (DELETE) | `mood_symptoms` delete | Mood remove button | Planned |
| `POST /api/maternity/appointments` | Book doctor visit | `Appointment` insert | `api/maternity/appointments.js` (POST) | `appointments` table | Appointment scheduler | Planned |
| `DELETE /api/maternity/appointments/<id>` | Delete appointment | `Appointment` delete | `api/maternity/appointments.js` (DELETE) | `appointments` delete | Appointment delete icon | Planned |
| `POST /api/maternity/vitals` | Record BP & weight | `VitalRecord` insert | `api/maternity/vitals.js` (POST) | `vital_records` table | Vitals log modal | Planned |
| `DELETE /api/maternity/vitals/<id>` | Delete vital record | `VitalRecord` delete | `api/maternity/vitals.js` (DELETE) | `vital_records` delete | Vitals remove icon | Planned |
| `POST /api/maternity/routines/toggle` | Check daily routine | `DailyRoutine` upsert | `api/maternity/routines.js` (POST) | `daily_routines` table | Daily routine checklist | Planned |
| `POST /api/maternity/kicks` | Increment kick counter | `KickRecord` insert | `api/maternity/kicks.js` (POST) | `kick_records` table | Kick counter tap button | Planned |
| `POST /api/maternity/names` | Save baby name | `SavedBabyName` insert | `api/maternity/names.js` (POST) | `saved_baby_names` table | Baby name bookmark | Planned |
| `DELETE /api/maternity/names/<id>` | Remove baby name | `SavedBabyName` delete | `api/maternity/names.js` (DELETE) | `saved_baby_names` delete | Baby name delete button | Planned |
| `GET /api/notifications` | Fetch user notifications | `Notification` query | `api/notifications/index.js` (GET) | `notifications` table | Notification bell badge | Planned |
| `POST /api/notifications` | Create reminder | `Notification` insert | `api/notifications/index.js` (POST) | `notifications` table | Custom reminder form | Planned |
| `POST /api/notifications/<id>/read` | Mark as read | `Notification` update | `api/notifications/read.js` | `notifications` update | Click notification item | Planned |
| `POST /api/notifications/<id>/dismiss` | Dismiss notification | `Notification` update | `api/notifications/dismiss.js` | `notifications` update | Dismiss notification (X) | Planned |
| `POST /api/notifications/trigger_eval` | Seed automatic reminders | Evaluates missing routines | `api/notifications/trigger_eval.js` | `notifications` bulk insert | App launch / Poller | Planned |
| `GET /api/notifications/history` | Notification audit history | `Notification` query | `api/notifications/history.js` | `notifications` table | Notification history tab | Planned |
| `apply_rate_limit(10)` | Sliding-window limiter | In-memory timestamps | `lib/rateLimit.js` | Header-based / In-memory window | Chat & AI flood defense | Planned |
| `require_auth` | JWT token validator | `_verify_local_jwt`, Supabase | `lib/auth.js` (`verifyAuth`) | `supabase.auth.getUser(token)` | All protected routes | Planned |
| `gemini_service.py` | AI Prompt Engine & Fallback | `@google/genai` | `lib/gemini.js` | `@google/genai` (Node.js SDK) | Chat & Multimodal AI | Planned |

---

**Step 1 Inventory Complete.**
