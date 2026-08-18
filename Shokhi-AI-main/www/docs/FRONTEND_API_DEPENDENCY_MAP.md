# Shokhi AI (সখী AI) — Frontend API Dependency Map (Step 2)

**Document Version:** 1.0.0  
**Date:** August 17, 2026  
**Status:** In-Depth Frontend Inspection Complete  

---

## 1. Executive Summary

This document charts every API call initiated by the client UI (`www/index.html` and `www/main.js`), mapping the HTTP method, request payload, response schema, and the corresponding Node.js serverless endpoint to ensure zero breaking changes in the user interface.

---

## 2. Frontend → API Call Mapping Table

### 2.1 Authentication & Session Management

```
Frontend Action: User Submits Registration Form
→ Current Flask Endpoint: POST /api/auth/register
→ Request Format: JSON { "email": "...", "password": "...", "name": "...", "pregnancy_week": 12 }
→ Response Format: JSON { "success": true, "token": "<jwt>", "user": { "id": 1, "email": "...", "name": "...", "pregnancy_week": 12 } }
→ Proposed Node.js Endpoint: POST /api/auth/register (or /api/auth/register.js)
→ Migration Requirement: Must create Supabase user or table record, return exact matching JWT and user dictionary.
```

```
Frontend Action: User Submits Login Form
→ Current Flask Endpoint: POST /api/auth/login
→ Request Format: JSON { "email": "...", "password": "..." }
→ Response Format: JSON { "success": true, "token": "<jwt>", "user": { "id": 1, "email": "...", "name": "..." } }
→ Proposed Node.js Endpoint: POST /api/auth/login (or /api/auth/login.js)
→ Migration Requirement: Must validate password with bcrypt / Supabase Auth, return token and user profile.
```

```
Frontend Action: Application Launch / Auth State Validation
→ Current Flask Endpoint: GET /api/auth/me
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON { "user": { "id": 1, "email": "...", "name": "...", "pregnancy_week": 12 } }
→ Proposed Node.js Endpoint: GET /api/auth/me (or /api/auth/me.js)
→ Migration Requirement: Must verify Bearer JWT and return user payload.
```

---

### 2.2 Profile & Gestational Stage Context

```
Frontend Action: Maternal Profile Modal Fetch
→ Current Flask Endpoint: GET /api/profile
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON { "success": true, "profile": { "id": 1, "name": "...", "pregnancy_week": 24, "due_date": "...", "blood_group": "...", "allergies": "...", "medical_history": "...", "gestational_metrics": { "trimester": 2, "trimester_label_bn": "...", "days_remaining": 112 } } }
→ Proposed Node.js Endpoint: GET /api/profile
→ Migration Requirement: Compute gestational trimester math and return exact payload structure.
```

```
Frontend Action: Maternal Profile Save / Update
→ Current Flask Endpoint: PUT /api/profile (or POST /api/profile)
→ Request Format: Headers { "Authorization": "Bearer <token>" }, JSON { "name": "...", "pregnancy_week": 24, "due_date": "...", "blood_group": "...", "allergies": "...", "medical_history": "..." }
→ Response Format: JSON { "success": true, "profile": { ...updated profile with gestational_metrics } }
→ Proposed Node.js Endpoint: PUT /api/profile
→ Migration Requirement: Update database, recalculate gestational metrics, return updated object.
```

---

### 2.3 Conversational AI & Multi-Session Chat

```
Frontend Action: Fetch Chat History Sidebar
→ Current Flask Endpoint: GET /api/get_all_sessions
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON Array [ { "chat_id": "chat_123", "title": "বমি ভাব", "updated_at": 178698... }, ... ]
→ Proposed Node.js Endpoint: GET /api/get_all_sessions (and /api/chat/sessions)
→ Migration Requirement: Query user's sessions sorted by updated_at descending.
```

```
Frontend Action: Load Selected Chat Session Messages
→ Current Flask Endpoint: GET /api/get_chat_messages/<chat_id>
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON Array [ { "role": "user", "content": "...", "has_image": false, "created_at": ... }, { "role": "assistant", "content": "..." } ]
→ Proposed Node.js Endpoint: GET /api/get_chat_messages/[chat_id] (and /api/chat/messages)
→ Migration Requirement: Enforce user_id tenancy; return empty list or 404 for cross-tenant access.
```

```
Frontend Action: Send Message / Ask AI
→ Current Flask Endpoint: POST /api/ask_prova_chat
→ Request Format: Headers { "Authorization": "Bearer <token>" }, JSON { "chat_id": "...", "prompt_text": "...", "language": "bn", "filename": "...", "image_url": "..." }
→ Response Format: JSON { "reply": "...", "chat_id": "...", "title": "..." }
→ Proposed Node.js Endpoint: POST /api/ask_prova_chat (and /api/chat)
→ Migration Requirement: Apply rate limit (10 RPM), emergency red-flag triage, gestational context injection, Gemini generation with fallback, and message persistence.
```

```
Frontend Action: Delete Chat Session
→ Current Flask Endpoint: DELETE /api/delete_chat_session/<chat_id>
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON { "success": true, "message": "Session deleted" }
→ Proposed Node.js Endpoint: DELETE /api/delete_chat_session/[chat_id]
→ Migration Requirement: Delete session and cascade delete all associated messages.
```

---

### 2.4 Multimodal Document Upload & Audio Voice

```
Frontend Action: Sonogram / Report File Selection
→ Current Flask Endpoint: POST /api/multimodal/upload
→ Request Format: Multipart Form-Data (file: Binary, max 5MB, JPEG/PNG/WebP)
→ Response Format: JSON { "success": true, "filename": "doc_...", "image_url": "/uploads/doc_...", "size_bytes": 1024, "mime_type": "image/png" }
→ Proposed Node.js Endpoint: POST /api/multimodal/upload
→ Migration Requirement: Validate mime-type and size. Save to Supabase Storage or serverless buffer.
```

```
Frontend Action: Voice Text-to-Speech Playback
→ Current Flask Endpoint: POST /api/speak
→ Request Format: JSON { "text": "..." }
→ Response Format: Audio Stream `audio/mp3`
→ Proposed Node.js Endpoint: POST /api/speak (Supported by client-side Web Speech API fallback)
→ Migration Requirement: Stream synthesized speech audio or fall back to native browser speech.
```

---

### 2.5 Maternal Health & Wellness Tracker

```
Frontend Action: Dashboard Overview Refresh
→ Current Flask Endpoint: GET /api/maternity/overview
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON { "success": true, "meals": [...], "mood_symptoms": [...], "appointments": [...], "vitals": [...], "routines": { ... }, "kick_count": 8, "names": [...] }
→ Proposed Node.js Endpoint: GET /api/maternity/overview
→ Migration Requirement: Parallel fetch across health tables scoped to g.user['id'].
```

```
Frontend Action: Log Meal / Delete Meal
→ Current Flask Endpoint: POST / DELETE /api/maternity/meals
→ Request Format: POST: JSON { "meal_type": "...", "description": "..." } | DELETE: /api/maternity/meals/<id>
→ Response Format: POST: 201 JSON { "success": true, "item": { "id": 1, ... } } | DELETE: 200 JSON { "success": true }
→ Proposed Node.js Endpoint: /api/maternity/meals
→ Migration Requirement: html.escape sanitization and multi-tenant isolation.
```

```
Frontend Action: Log Mood / Symptoms
→ Current Flask Endpoint: POST / DELETE /api/maternity/mood
→ Request Format: POST: JSON { "entry_type": "mood", "label": "...", "severity": "mild" } | DELETE: /api/maternity/mood/<id>
→ Response Format: POST: 201 JSON { "success": true, "item": { ... } } | DELETE: 200 JSON { "success": true }
→ Proposed Node.js Endpoint: /api/maternity/mood
→ Migration Requirement: Stored with user ownership.
```

```
Frontend Action: Doctor Appointment Scheduler
→ Current Flask Endpoint: POST / DELETE /api/maternity/appointments
→ Request Format: POST: JSON { "doctor_name": "...", "appointment_time": "...", "hospital_clinic": "..." }
→ Response Format: POST: 201 JSON { "success": true, "item": { ... } }
→ Proposed Node.js Endpoint: /api/maternity/appointments
→ Migration Requirement: Stored with user ownership.
```

```
Frontend Action: Blood Pressure & Weight Log
→ Current Flask Endpoint: POST / DELETE /api/maternity/vitals
→ Request Format: POST: JSON { "bp": "120/80", "weight_kg": 60.5 }
→ Response Format: POST: 201 JSON { "success": true, "item": { ... } }
→ Proposed Node.js Endpoint: /api/maternity/vitals
→ Migration Requirement: Stored with user ownership.
```

```
Frontend Action: Daily Routine Checkboxes
→ Current Flask Endpoint: POST /api/maternity/routines/toggle
→ Request Format: JSON { "routine_key": "Drink Water", "is_completed": true }
→ Response Format: JSON { "success": true, "routine_key": "Drink Water", "is_completed": true }
→ Proposed Node.js Endpoint: POST /api/maternity/routines/toggle
→ Migration Requirement: Upserts daily routine for today's date YYYY-MM-DD.
```

```
Frontend Action: Fetal Kick Counter Tap
→ Current Flask Endpoint: POST /api/maternity/kicks
→ Request Format: JSON { "kick_count": 5 }
→ Response Format: JSON { "success": true, "kick_count": 5 }
→ Proposed Node.js Endpoint: POST /api/maternity/kicks
→ Migration Requirement: Inserts or increments today's kick session.
```

```
Frontend Action: Baby Name Bookmark / Delete
→ Current Flask Endpoint: POST / DELETE /api/maternity/names
→ Request Format: POST: JSON { "name": "Aaryan", "gender": "boy", "meaning": "Noble" }
→ Response Format: POST: 201 JSON { "success": true, "item": { ... } }
→ Proposed Node.js Endpoint: /api/maternity/names
→ Migration Requirement: Stored with user ownership.
```

---

### 2.6 Emergency Safety & Telemetry

```
Frontend Action: Emergency Helplines & SOS Modal
→ Current Flask Endpoint: GET /api/emergency/helplines
→ Request Format: Headers { "Authorization": "Bearer <token>" }
→ Response Format: JSON { "success": true, "helplines": { "national_emergency": { "number": "999" }, "health_helpline": { "number": "16263" }, "maternal_child_helpline": { "number": "109" }, "government_services": { "number": "333" } }, "personal_emergency_contact": { ... } }
→ Proposed Node.js Endpoint: GET /api/emergency/helplines
→ Migration Requirement: Return national emergency registry and user's saved emergency contact.
```

```
Frontend Action: Emergency Incident SOS Logging
→ Current Flask Endpoint: POST /api/emergency/log
→ Request Format: Headers { "Authorization": "Bearer <token>" }, JSON { "trigger_source": "manual_sos", "symptom_detected": "...", "action_taken": "..." }
→ Response Format: JSON { "success": true, "log_id": 1, "logged_at": ... }
→ Proposed Node.js Endpoint: POST /api/emergency/log
→ Migration Requirement: Inserts audit log into emergency_logs table.
```

```
Frontend Action: Notifications Stream & Actions
→ Current Flask Endpoint: GET / POST /api/notifications, PATCH /api/notifications/<id>/read, PATCH /api/notifications/<id>/dismiss, POST /api/notifications/trigger_eval, GET /api/notifications/history
→ Response Format: JSON { "unread_count": ..., "notifications": [...] }
→ Proposed Node.js Endpoint: /api/notifications/*
→ Migration Requirement: Return user notification stream, handle read/dismiss lifecycle.
```

```
Frontend Action: Admin Telemetry Dashboard
→ Current Flask Endpoint: GET /api/admin/metrics
→ Request Format: Headers { "Authorization": "Bearer <admin_token>" }
→ Response Format: JSON { "system_status": "HEALTHY_OPERATIONAL", "academic_defense_metrics": { ... }, "engine_specifications": { ... } }
→ Proposed Node.js Endpoint: GET /api/admin/metrics
→ Migration Requirement: Enforce is_admin check, aggregate metrics.
```

---

**Step 2 Inspection Complete.**
