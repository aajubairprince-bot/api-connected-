# Shokhi AI (সখী AI) — Comprehensive Data Flow Diagrams

**Document Version:** 2.0.0
**Runtime:** Node.js / Vercel Serverless
**Date:** August 2026
**Status:** Verified — reflects current Node.js codebase

---

## 1. Authentication & Tenant Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor Mother as Expectant Mother
    participant Client as Web / PWA Client
    participant AuthAPI as Node.js /api/auth/* Handler
    participant SupaAuth as Supabase Auth
    participant DB as Supabase PostgreSQL (profiles)

    Note over Client,DB: Path A — Email / Password Registration
    Mother->>Client: Enters Name, Email, Password, Pregnancy Week
    Client->>AuthAPI: POST /api/auth/register { name, email, password, pregnancy_week }
    AuthAPI->>AuthAPI: bcryptjs.hash(password, 10)
    AuthAPI->>SupaAuth: supabase.auth.signUp({ email, password })
    SupaAuth-->>AuthAPI: { user.id }
    AuthAPI->>DB: INSERT INTO profiles (id, full_name, pregnancy_week, ...)
    DB-->>AuthAPI: Profile row created
    AuthAPI->>AuthAPI: generateToken({ id, email, is_admin: false }) → 30-day JWT
    AuthAPI-->>Client: 201 { token, user }
    Client->>Client: localStorage.setItem('shokhi_auth_token', token)

    Note over Client,DB: Path B — Google OAuth
    Mother->>Client: Clicks "Sign in with Google"
    Client->>SupaAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
    SupaAuth-->>Client: Redirect + session
    Client->>AuthAPI: POST /api/auth/google { email, name, google_id }
    AuthAPI->>DB: UPSERT profiles (id=google_id, full_name, ...)
    DB-->>AuthAPI: Profile row
    AuthAPI-->>Client: 200 { token, user }

    Note over Client,DB: Subsequent Protected Route
    Client->>AuthAPI: GET /api/auth/me (Authorization: Bearer token)
    AuthAPI->>SupaAuth: supabase.auth.getUser(token)
    SupaAuth-->>AuthAPI: { user.id }
    AuthAPI->>DB: SELECT is_admin FROM profiles WHERE id = user.id
    DB-->>AuthAPI: { is_admin: false }
    AuthAPI-->>Client: 200 { id, email, name, is_admin, pregnancy_week }
    Client->>Client: if is_admin → redirect to /admin.html
```

---

## 2. Admin Login & RBAC Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant AdminUI as admin.html
    participant AuthAPI as /api/auth/login
    participant DB as profiles table
    participant MetricsAPI as /api/admin/metrics
    participant AdminClient as Supabase Admin Client (Service Role)

    Admin->>AdminUI: Enters email + password on auth gate
    AdminUI->>AuthAPI: POST /api/auth/login { email, password }
    AuthAPI->>DB: SELECT password_hash FROM profiles WHERE email = ?
    DB-->>AuthAPI: { password_hash, is_admin: true }
    AuthAPI->>AuthAPI: bcryptjs.compare(password, hash) → true
    AuthAPI->>AuthAPI: generateToken({ is_admin: true }) → JWT
    AuthAPI-->>AdminUI: 200 { token, user: { is_admin: true } }

    alt is_admin = false
        AdminUI-->>Admin: ❌ "Access Denied: not an Administrator"
    else is_admin = true
        AdminUI->>AdminUI: localStorage.setItem('shokhi_admin_token', token)
        AdminUI->>AdminUI: hideAuthGate() → show dashboard

        AdminUI->>MetricsAPI: GET /api/admin/metrics (Bearer admin-token)
        MetricsAPI->>MetricsAPI: verifyAuth() → checks is_admin → true
        MetricsAPI->>AdminClient: getSupabaseAdminClient() (bypasses RLS)
        AdminClient->>DB: SELECT * FROM profiles, chat_messages, meal_logs, ...
        DB-->>AdminClient: All users' data
        MetricsAPI-->>AdminUI: 200 { metrics, data: { users, chats, meals, ... } }
        AdminUI->>AdminUI: Render 6 metric cards + 8 data tabs
    end
```

---

## 3. Context-Aware Generative Chat Flow

```mermaid
sequenceDiagram
    autonumber
    actor Mother as Expectant Mother
    participant Client as Chat UI (index.html)
    participant ChatAPI as /api/ask_prova_chat (Node.js)
    participant Triage as Red-Flag Detector (lib/gemini.js)
    participant Context as Gestational Context Builder
    participant Gemini as Google Gemini AI
    participant DB as Supabase PostgreSQL

    Mother->>Client: Types "আমার ৫ম মাস, কী খাবার খাব?"
    Client->>ChatAPI: POST /api/ask_prova_chat { prompt_text, chat_id, language: 'bn' }
    ChatAPI->>ChatAPI: verifyAuth() → validate JWT Bearer token
    ChatAPI->>ChatAPI: checkRateLimit(userId) → < 10 RPM ✓
    ChatAPI->>ChatAPI: sanitizeUserPrompt() → escapeHtml + injection check

    ChatAPI->>Triage: isEmergencyQuery(prompt, 'bn')
    Triage->>Triage: Check 13 Bengali + 15 English emergency keywords
    Triage-->>ChatAPI: emergency = false

    ChatAPI->>Context: Build gestational context header
    Context->>DB: SELECT pregnancy_week, due_date FROM profiles WHERE id = userId
    DB-->>Context: { pregnancy_week: 20 }
    Context-->>ChatAPI: "Week 20 — 2nd Trimester — 140 days remaining"

    ChatAPI->>DB: SELECT last 10 messages FROM chat_messages WHERE session_id = chat_id
    DB-->>ChatAPI: Conversation history

    ChatAPI->>Gemini: generateContent(systemPrompt + context + history + prompt)
    Gemini-->>ChatAPI: Empathetic Bangla maternal advice

    ChatAPI->>DB: INSERT INTO chat_messages (user_id, session_id, role='assistant', content)
    ChatAPI-->>Client: 200 { reply, chat_id, title, is_emergency: false }
    Client-->>Mother: Renders chat bubble + plays TTS audio
```

---

## 4. Emergency Obstetric Triage & Red-Flag Escalation

```mermaid
sequenceDiagram
    autonumber
    actor Mother as Expectant Mother (In Distress)
    participant Client as Chat / SOS Interface
    participant ChatAPI as /api/ask_prova_chat (Node.js)
    participant Triage as lib/gemini.js — Red-Flag Detector
    participant EmgLog as /api/emergency/log
    participant DB as Supabase emergency_logs
    participant Helplines as /api/emergency/helplines

    Mother->>Client: Types "হঠাৎ প্রচুর রক্তক্ষরণ হচ্ছে"
    Client->>ChatAPI: POST /api/ask_prova_chat { prompt_text }
    ChatAPI->>Triage: isEmergencyQuery(prompt, 'bn')
    Triage->>Triage: Matches keyword: "রক্তক্ষরণ" ✓
    Triage-->>ChatAPI: EMERGENCY = true, keyword = "রক্তক্ষরণ"

    ChatAPI->>EmgLog: POST /api/emergency/log { symptom_detected, trigger_source: 'chat_triage' }
    EmgLog->>DB: INSERT INTO emergency_logs (user_id, symptom_detected, action_taken)
    DB-->>EmgLog: Log ID created

    ChatAPI->>Helplines: GET /api/emergency/helplines
    Helplines-->>ChatAPI: [999, 16263, 109, 333] + personal_contact

    ChatAPI->>ChatAPI: Build emergency reply with clinical urgency + helplines
    ChatAPI-->>Client: 200 { reply, is_emergency: true, helplines, emergency_banner }
    Client-->>Mother: 🚨 Red banner + instant call buttons + hospital map link
```

---

## 5. Persistent Maternal Health Tracking Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Mother as Expectant Mother
    participant Client as Maternal Health Tracker (index.html)
    participant HealthAPI as /api/maternity/* Handlers (Node.js)
    participant DB as Supabase PostgreSQL

    Mother->>Client: Logs meal: "ভাত, ডাল, সবজি"
    Client->>HealthAPI: POST /api/maternity/meals { meal_type: 'lunch', description }
    HealthAPI->>HealthAPI: verifyAuth() → userId extracted
    HealthAPI->>HealthAPI: escapeHtml(description)
    HealthAPI->>DB: INSERT INTO meal_logs (user_id, meal_type, description, logged_at)
    DB-->>HealthAPI: Record #45
    HealthAPI-->>Client: 201 { success: true, item: { id: 45 } }

    Mother->>Client: Increments fetal kick counter
    Client->>HealthAPI: POST /api/maternity/kicks { action: 'add', count: 1 }
    HealthAPI->>DB: UPDATE kick_records SET kick_count = kick_count + 1
    DB-->>HealthAPI: { kick_count: 8 }
    HealthAPI-->>Client: 200 { kick_count: 8 }

    Note over Client,DB: Dashboard Reload
    Client->>HealthAPI: GET /api/maternity/overview
    HealthAPI->>DB: Parallel SELECT on meals, mood, vitals, appointments, kicks, hydration, routines, names
    DB-->>HealthAPI: All entity datasets
    HealthAPI-->>Client: 200 { meals: [...], mood_symptoms: [...], vitals: [...], kicks: {...}, ... }
    Client-->>Mother: Renders live dashboard with charts and progress
```

---

## 6. Smart Notification Engine Flow

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Vercel Cron (09:00 UTC daily)
    participant TriggerAPI as /api/notifications/trigger_eval (Node.js)
    participant DB as Supabase PostgreSQL
    participant Client as Mother's App (polling)

    loop Every day at 09:00 UTC
        Cron->>TriggerAPI: POST /api/notifications/trigger_eval
        TriggerAPI->>TriggerAPI: verifyAuth() → userId

        TriggerAPI->>DB: SELECT glass_count FROM hydration WHERE user_id = ? AND date = today
        DB-->>TriggerAPI: { glass_count: 4 }
        TriggerAPI->>TriggerAPI: 4 < 8 glasses → generate hydration alert
        TriggerAPI->>DB: INSERT INTO notifications { type: 'hydration_reminder', title, message }

        TriggerAPI->>DB: SELECT kick_count FROM kick_records WHERE user_id = ? AND date = today
        DB-->>TriggerAPI: { kick_count: 3 }
        TriggerAPI->>TriggerAPI: 3 < 10 → generate kick monitoring alert
        TriggerAPI->>DB: INSERT INTO notifications { type: 'kick_reminder' }

        TriggerAPI->>DB: SELECT * FROM appointments WHERE user_id = ? AND is_completed = false
        DB-->>TriggerAPI: [{ appointment_time: '2026-08-20 10:00' }]
        TriggerAPI->>TriggerAPI: appointment in 3 days → generate proximity alert
        TriggerAPI->>DB: INSERT INTO notifications { type: 'appointment_reminder' }
    end

    Client->>DB: GET /api/notifications (every 30s poll)
    DB-->>Client: { unread_count: 3, notifications: [...] }
    Client->>Client: Display toast + play alert sound
    Client->>TriggerAPI: POST /api/notifications/:id/read
```

---

## 7. Multimodal Vision — Sonogram & Prescription Analysis

```mermaid
sequenceDiagram
    autonumber
    actor Mother as Expectant Mother
    participant Client as Vision Upload UI
    participant UploadAPI as /api/multimodal/upload (Node.js)
    participant Storage as /uploads/ directory
    participant ChatAPI as /api/ask_prova_chat
    participant GeminiVision as Gemini Multimodal Vision API

    Mother->>Client: Selects sonogram photo / lab report image
    Client->>UploadAPI: POST /api/multimodal/upload (multipart/form-data, file)
    UploadAPI->>UploadAPI: Validate MIME (JPEG/PNG/WebP) & size (< 5 MB)
    UploadAPI->>Storage: Save as /uploads/doc_{timestamp}_{userId}.png
    UploadAPI-->>Client: 201 { filename, image_url }

    Client->>ChatAPI: POST /api/ask_prova_chat { prompt_text, filename, image_url }
    ChatAPI->>ChatAPI: Read image bytes from /uploads/
    ChatAPI->>GeminiVision: generateContent([ImageBytes, maternalVisionPrompt])
    GeminiVision-->>ChatAPI: Medical observations & parameter summary
    ChatAPI->>ChatAPI: Append mandatory clinical disclaimer banner
    ChatAPI-->>Client: 200 { reply, image_url, disclaimer }
    Client-->>Mother: Renders AI analysis + clinical disclaimer
```

---

**Data Flow Diagrams — Node.js / Vercel Serverless Edition. All flows verified by 48-test E2E suite.**
