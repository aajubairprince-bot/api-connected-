# Shokhi AI (সখী AI) — Complete API Reference

**Version:** 2.0.0 | **Runtime:** Node.js / Vercel Serverless | **Base URL:** `https://<your-domain>`

All protected endpoints require: `Authorization: Bearer <jwt_token>`

---

## Authentication

### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{ "email": "user@example.com", "password": "secret", "name": "নুসরাত", "pregnancy_week": 12 }
```
**Response `201`:**
```json
{ "token": "<jwt>", "user": { "id": "uuid", "email": "...", "name": "...", "is_admin": false } }
```

---

### `POST /api/auth/login`
Authenticate with email and password.

**Request Body:**
```json
{ "email": "user@example.com", "password": "secret" }
```
**Response `200`:**
```json
{ "token": "<jwt>", "user": { "id": "uuid", "email": "...", "is_admin": false } }
```

---

### `GET /api/auth/me`
Get the currently authenticated user. Performs a live DB role check.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{ "id": "uuid", "email": "...", "name": "...", "is_admin": false, "pregnancy_week": 12 }
```

---

### `POST /api/auth/google`
Sync a Google OAuth user from Supabase Auth into the `profiles` table.

**Request Body:**
```json
{ "email": "user@gmail.com", "name": "Nusrat", "google_id": "supabase-user-uuid" }
```
**Response `200`:**
```json
{ "token": "<jwt>", "user": { ... } }
```

---

### `POST /api/auth/sync_profile`
Sync profile metadata after OAuth sign-in.

**Request Body:** `{ "pregnancy_week": 14, "due_date": "2026-12-01" }`

**Response `200`:** `{ "success": true, "profile": { ... } }`

---

## User Profile

### `GET /api/profile`
Get full user profile with gestational metrics.

**Response `200`:**
```json
{
  "profile": { "full_name": "...", "pregnancy_week": 14, "due_date": "..." },
  "gestational_metrics": { "trimester": 2, "days_remaining": 182, "stage": "2nd Trimester" }
}
```

### `PUT /api/profile`
Update user profile fields.

**Request Body:** `{ "full_name": "...", "pregnancy_week": 16, "blood_group": "B+", "due_date": "2026-12-15", "emergency_contact_name": "...", "emergency_contact_phone": "..." }`

**Response `200`:** `{ "success": true, "profile": { ... } }`

---

## AI Chat

### `POST /api/ask_prova_chat` (alias: `/api/chat`)
Send a message to the Shokhi AI and receive a response. Triggers emergency triage detection.

**Request Body:**
```json
{
  "prompt_text": "আমার ৫ম মাসে কী খাওয়া ভালো?",
  "chat_id": "optional-session-id",
  "language": "bn",
  "filename": "optional-uploaded-image.jpg",
  "image_url": "optional-image-url"
}
```
**Response `200`:**
```json
{
  "reply": "আপু, ৫ম মাসে...",
  "chat_id": "session-uuid",
  "title": "পুষ্টি পরামর্শ",
  "is_emergency": false,
  "helplines": null
}
```
> If `is_emergency: true`, `helplines` contains emergency numbers and `emergency_banner` is included.

---

### `GET /api/get_all_sessions` (alias: `/api/chat/sessions`)
List all chat sessions for the current user.

**Response `200`:** `{ "sessions": [ { "id": "...", "title": "...", "created_at": "..." } ] }`

---

### `GET /api/get_chat_messages/:chat_id` (alias: `/api/chat/messages?chat_id=...`)
Get all messages in a session.

**Response `200`:** `{ "messages": [ { "role": "user|assistant", "content": "...", "created_at": "..." } ] }`

---

### `DELETE /api/delete_chat_session/:chat_id` (alias: `/api/chat/delete`)
Delete a chat session and all its messages.

**Response `200`:** `{ "success": true }`

---

## Maternity Health Tracker

### `GET /api/maternity/overview`
Returns a comprehensive health snapshot for the current user.

**Response `200`:**
```json
{
  "profile": { "pregnancy_week": 14, ... },
  "meals": [...], "mood_symptoms": [...], "appointments": [...],
  "vitals": [...], "kicks": {...}, "hydration": {...},
  "routines": [...], "baby_names": [...], "notifications": [...]
}
```

---

### `POST /api/maternity/meals`
Log a meal entry.

**Body:** `{ "meal_type": "breakfast|lunch|dinner|snack", "description": "ভাত, ডাল..." }`
**Response `201`:** `{ "success": true, "item": { "id": 1, ... } }`

### `GET /api/maternity/meals`
List all meals. **Response `200`:** `{ "meals": [...] }`

---

### `POST /api/maternity/mood`
Log a mood or symptom entry.

**Body:** `{ "entry_type": "mood|symptom", "label": "anxiety|nausea", "severity": "mild|moderate|severe" }`
**Response `201`:** `{ "success": true, "item": { ... } }`

### `GET /api/maternity/mood`
List all mood/symptom entries. **Response `200`:** `{ "mood_symptoms": [...] }`

---

### `POST /api/maternity/appointments`
Schedule a doctor appointment.

**Body:** `{ "doctor_name": "Dr. Rahim", "hospital_clinic": "Dhaka Medical", "appointment_time": "2026-09-01 10:00", "notes": "..." }`
**Response `201`:** `{ "success": true, "item": { ... } }`

### `GET /api/maternity/appointments`
List all appointments. **Response `200`:** `{ "appointments": [...] }`

---

### `POST /api/maternity/vitals`
Log a vital signs reading.

**Body:** `{ "bp": "120/80", "weight_kg": 58.5, "notes": "..." }`
**Response `201`:** `{ "success": true, "item": { ... } }`

### `GET /api/maternity/vitals`
List all vitals records. **Response `200`:** `{ "vitals": [...] }`

---

### `POST /api/maternity/kicks`
Record or reset the fetal kick counter.

**Body (record):** `{ "action": "add", "count": 1 }` → **Response:** `{ "kick_count": 6 }`
**Body (reset):** `{ "action": "reset" }` → **Response:** `{ "kick_count": 0 }`

---

### `POST /api/maternity/hydration`
Record or reset daily water intake.

**Body (record):** `{ "action": "add", "glasses": 1 }` → **Response:** `{ "glass_count": 4 }`
**Body (reset):** `{ "action": "reset" }` → **Response:** `{ "glass_count": 0 }`

---

### `POST /api/maternity/routines/toggle`
Toggle a daily routine checklist item on/off.

**Body:** `{ "routine_key": "morning_walk", "is_completed": true }`
**Response `200`:** `{ "success": true }`

---

### `POST /api/maternity/routines/reset`
Reset all daily routine items to unchecked for today.

**Response `200`:** `{ "success": true, "reset_count": 5 }`

---

### `POST /api/maternity/names`
Save a baby name to the bookmarks list.

**Body:** `{ "name": "Ayaan", "gender": "boy|girl|unspecified", "meaning": "..." }`
**Response `201`:** `{ "success": true, "item": { ... } }`

### `GET /api/maternity/names`
List all saved baby names. **Response `200`:** `{ "names": [...] }`

### `DELETE /api/maternity/names/:id`
Delete a saved baby name. **Response `200`:** `{ "success": true }`

---

## Notifications

### `GET /api/notifications`
List all active (non-dismissed) notifications for the user.

**Response `200`:** `{ "notifications": [...], "unread_count": 2 }`

### `POST /api/notifications`
Create a notification (used by admin broadcast).

**Body:** `{ "title": "...", "message": "...", "notification_type": "broadcast", "user_id": "all|<uuid>" }`
**Response `201`:** `{ "success": true }`

---

### `POST /api/notifications/:id/read`
Mark a notification as read.

**Response `200`:** `{ "success": true }`

### `POST /api/notifications/:id/dismiss`
Dismiss a notification (hides from list).

**Response `200`:** `{ "success": true }`

### `POST /api/notifications/trigger_eval`
Evaluate and auto-generate smart notifications (hydration, kick, appointment reminders). Called by Vercel Cron daily at 09:00 UTC.

**Response `200`:** `{ "created": [...], "evaluated": ["hydration","kicks","appointments"] }`

### `GET /api/notifications/history`
Get full notification history including dismissed ones.

**Response `200`:** `{ "notifications": [...] }`

---

## Emergency

### `GET /api/emergency/helplines`
Returns emergency contact numbers and personal emergency contact.

**Response `200`:**
```json
{
  "helplines": [
    { "name": "National Emergency", "number": "999" },
    { "name": "DGHS Hotline", "number": "16263" },
    { "name": "Women Helpline", "number": "109" },
    { "name": "GRS Hotline", "number": "333" }
  ],
  "personal_contact": { "name": "...", "phone": "..." }
}
```

### `GET /api/emergency/hospital_search`
Returns hospital search URL for the user's location.

**Response `200`:** `{ "url": "https://maps.google.com/?q=hospital+near+me", "query": "hospital near me" }`

### `POST /api/emergency/log`
Log an emergency triage event to the audit database.

**Body:** `{ "symptom_detected": "heavy bleeding", "trigger_source": "chat_triage", "action_taken": "..." }`
**Response `201`:** `{ "success": true, "log_id": 7 }`

---

## Admin (Admin Role Required)

> All admin endpoints return `403 Forbidden` for non-admin users.

### `GET /api/admin/metrics`
Returns real-time clinical telemetry and all users' data for the dashboard.

**Response `200`:**
```json
{
  "academic_defense_metrics": {
    "total_registered_mothers": 12,
    "total_clinical_ai_turns_logged": 340,
    "maternal_nutrition_meals_logged": 87,
    ...
  },
  "engine_specifications": { "runtime": "Node.js 20 / Vercel Serverless", ... },
  "data": {
    "users": [...], "chat_messages": [...], "meal_logs": [...],
    "vital_records": [...], "appointments": [...], "mood_symptoms": [...],
    "daily_routines": [...], "notifications": [...], "emergency_logs": [...]
  }
}
```

### `POST /api/admin/assign_role`
Grant or revoke admin privileges from a user.

**Body:** `{ "email": "user@example.com", "is_admin": true }` OR `{ "user_id": "uuid", "is_admin": false }`
**Response `200`:** `{ "success": true, "message": "Admin role granted to user@example.com" }`

### `DELETE /api/admin/delete`
Delete a single record from any allowed log table.

**Body:** `{ "table": "meal_logs|emergency_logs|notifications|appointments|vital_logs|mood_symptoms|daily_routines|kick_records|chat_messages|chat_sessions|saved_baby_names", "id": 42 }`
**Response `200`:** `{ "success": true, "message": "Record #42 deleted from meal_logs." }`

---

## System & Media

### `GET /api/health`
System health check. No auth required.

**Response `200`:**
```json
{
  "status": "HEALTHY",
  "subsystems": { "maternal_context_engine": "ACTIVE", "gemini_ai_engine": "ACTIVE", ... },
  "timestamp": "2026-08-18T..."
}
```

### `GET /api/config`
Public configuration endpoint (used by frontend for Supabase Realtime init). No auth required.

**Response `200`:**
```json
{ "supabase_url": "https://...", "supabase_anon_key": "...", "supabase_configured": true }
```

### `GET /api/system/status`
System online status. **Response `200`:** `{ "status": "online", "version": "2.0.0" }`

### `POST /api/multimodal/upload`
Upload a medical image (sonogram, prescription) for Gemini Vision analysis.

**Body:** `multipart/form-data` — field `file` (JPEG/PNG/WebP, max 5MB)
**Response `201`:** `{ "success": true, "filename": "doc_1234_user.jpg", "image_url": "/uploads/..." }`

### `GET /api/voice/tts`
Stream TTS audio for a given text.

**Query:** `?text=সুপ্রভাত+আপু&lang=bn`
**Response:** `audio/mpeg` stream

### `GET /api/voice/config`
Returns voice/speech configuration. **Response `200`:** `{ "provider": "browser_tts", "lang_bn": "bn-BD", ... }`

### `POST /api/speak`
TTS synthesis configuration response. **Response `200`:** `{ "text": "...", "lang": "bn" }`

---

## Error Responses

All endpoints return structured JSON errors:

```json
{ "error": true, "message": "Human-readable description", "code": "ERROR_CODE" }
```

| HTTP Code | Meaning |
|---|---|
| `400` | Bad Request — missing or invalid body |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient role (non-admin on admin endpoint) |
| `404` | Not Found — resource does not exist for this user |
| `405` | Method Not Allowed |
| `429` | Too Many Requests — rate limit exceeded (10 RPM) |
| `500` | Internal Server Error |
