# Shokhi AI — Database ER Diagram

**Database:** Supabase PostgreSQL | **Tables:** 12 | **Security:** Row Level Security (RLS) enabled on all tables

---

## Entity Relationship Diagram

```mermaid
erDiagram
    profiles {
        UUID id PK
        VARCHAR full_name
        VARCHAR phone_number
        INTEGER pregnancy_week
        VARCHAR due_date
        VARCHAR blood_group
        VARCHAR emergency_contact_name
        VARCHAR emergency_contact_phone
        TEXT allergies
        TEXT medical_history
        VARCHAR preferred_language
        BOOLEAN is_admin
        TEXT avatar_url
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    chat_sessions {
        VARCHAR id PK
        VARCHAR user_id FK
        VARCHAR title
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    chat_messages {
        BIGSERIAL id PK
        VARCHAR session_id FK
        VARCHAR user_id FK
        VARCHAR role
        TEXT content
        BOOLEAN has_image
        TEXT image_url
        TIMESTAMPTZ created_at
    }

    meal_logs {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR meal_type
        TEXT description
        TIMESTAMPTZ logged_at
    }

    mood_symptoms {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR entry_type
        VARCHAR label
        VARCHAR severity
        TIMESTAMPTZ logged_at
    }

    appointments {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR doctor_name
        VARCHAR hospital_clinic
        VARCHAR appointment_time
        TEXT notes
        BOOLEAN is_completed
        TIMESTAMPTZ created_at
    }

    vital_records {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR bp
        NUMERIC weight_kg
        TEXT notes
        TIMESTAMPTZ recorded_at
    }

    daily_routines {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR routine_key
        BOOLEAN is_completed
        VARCHAR record_date
        TIMESTAMPTZ completed_at
    }

    kick_records {
        BIGSERIAL id PK
        VARCHAR user_id FK
        INTEGER kick_count
        TIMESTAMPTZ session_start
        TIMESTAMPTZ session_end
    }

    saved_baby_names {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR name
        VARCHAR gender
        TEXT meaning
        TIMESTAMPTZ created_at
    }

    notifications {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR title
        TEXT message
        VARCHAR notification_type
        VARCHAR scheduled_time
        BOOLEAN is_read
        BOOLEAN is_dismissed
        BOOLEAN sound_enabled
        TIMESTAMPTZ created_at
        TIMESTAMPTZ read_at
    }

    emergency_logs {
        BIGSERIAL id PK
        VARCHAR user_id FK
        VARCHAR trigger_source
        TEXT symptom_detected
        VARCHAR action_taken
        TIMESTAMPTZ created_at
    }

    profiles ||--o{ chat_sessions       : "has"
    profiles ||--o{ chat_messages       : "sends"
    profiles ||--o{ meal_logs           : "logs"
    profiles ||--o{ mood_symptoms       : "tracks"
    profiles ||--o{ appointments        : "schedules"
    profiles ||--o{ vital_records       : "records"
    profiles ||--o{ daily_routines      : "completes"
    profiles ||--o{ kick_records        : "monitors"
    profiles ||--o{ saved_baby_names    : "bookmarks"
    profiles ||--o{ notifications       : "receives"
    profiles ||--o{ emergency_logs      : "triggers"
    chat_sessions ||--o{ chat_messages  : "contains"
```

---

## Table Descriptions

| Table | Primary Key | Foreign Keys | Purpose |
|---|---|---|---|
| `profiles` | `id` (UUID, refs auth.users) | — | User accounts + pregnancy metadata |
| `chat_sessions` | `id` (VARCHAR) | `user_id` | Conversation sessions |
| `chat_messages` | `id` (BIGSERIAL) | `session_id`, `user_id` | Individual AI chat messages |
| `meal_logs` | `id` (BIGSERIAL) | `user_id` | Daily nutrition tracking |
| `mood_symptoms` | `id` (BIGSERIAL) | `user_id` | Mood & symptom entries |
| `appointments` | `id` (BIGSERIAL) | `user_id` | Doctor/clinic appointments |
| `vital_records` | `id` (BIGSERIAL) | `user_id` | Blood pressure & weight logs |
| `daily_routines` | `id` (BIGSERIAL) | `user_id` | Daily checklist (unique per user+key+date) |
| `kick_records` | `id` (BIGSERIAL) | `user_id` | Fetal kick monitoring sessions |
| `saved_baby_names` | `id` (BIGSERIAL) | `user_id` | Bookmarked baby names |
| `notifications` | `id` (BIGSERIAL) | `user_id` | Smart care alert notifications |
| `emergency_logs` | `id` (BIGSERIAL) | `user_id` | Emergency triage audit trail |

---

## Constraints & Indexes

### Unique Constraints
| Table | Constraint |
|---|---|
| `daily_routines` | `UNIQUE (user_id, routine_key, record_date)` — prevents duplicate entries per day |

### Check Constraints
| Table | Column | Constraint |
|---|---|---|
| `profiles` | `pregnancy_week` | `BETWEEN 1 AND 45` |
| `profiles` | `preferred_language` | `IN ('bn', 'en')` |
| `mood_symptoms` | `entry_type` | `IN ('mood', 'symptom')` |
| `mood_symptoms` | `severity` | `IN ('mild', 'moderate', 'severe')` |
| `chat_messages` | `role` | `IN ('user', 'assistant', 'system')` |
| `saved_baby_names` | `gender` | `IN ('boy', 'girl', 'unspecified')` |
| `kick_records` | `kick_count` | `>= 0` |

### Performance Indexes (12 total)
All indexes follow the pattern `(user_id, timestamp DESC)` for sub-10ms tenant-scoped queries:

```sql
idx_chat_sessions_user      ON chat_sessions(user_id, updated_at DESC)
idx_chat_messages_session   ON chat_messages(session_id, created_at ASC)
idx_chat_messages_user      ON chat_messages(user_id)
idx_meal_logs_user          ON meal_logs(user_id, logged_at DESC)
idx_mood_symptoms_user      ON mood_symptoms(user_id, logged_at DESC)
idx_appointments_user       ON appointments(user_id, created_at DESC)
idx_vital_records_user      ON vital_records(user_id, recorded_at DESC)
idx_daily_routines_user     ON daily_routines(user_id, record_date)
idx_kick_records_user       ON kick_records(user_id, session_start DESC)
idx_saved_baby_names_user   ON saved_baby_names(user_id)
idx_notifications_user      ON notifications(user_id, created_at DESC)
idx_emergency_logs_user     ON emergency_logs(user_id, created_at DESC)
```

---

## Row Level Security (RLS)

RLS is **enabled on all 12 tables**. Each table has a policy:

```sql
-- profiles: only own row
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- all other tables: own rows + broadcast rows (user_id = 'all')
CREATE POLICY "User access policy for <table>" ON <table>
  FOR ALL USING (auth.uid()::text = user_id OR user_id = 'all');
```

**Admin bypass:** The service role key (`SUPABASE_SERVICE_ROLE_KEY`) skips RLS entirely. Used only in `api/admin/metrics.js`, `api/admin/assign_role.js`, and `api/admin/delete.js` via `getSupabaseAdminClient()`.
