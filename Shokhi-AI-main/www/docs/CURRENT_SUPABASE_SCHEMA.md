# Shokhi AI (সখী AI) — Frozen Database Schema Specification (Step 3)

**Document Version:** 1.0.0-FROZEN  
**Date:** August 17, 2026  
**Status:** Database Schema Frozen — Zero Alterations for Node.js Runtime  

---

## 1. Schema Freeze Mandate

The database architecture has been rigorously designed and validated across previous engineering phases. 
**The Node.js / Vercel migration must consume this exact schema without adding, removing, or renaming tables and columns.**

---

## 2. Table Schemas & Relational Matrix

### 2.1 Table: `user` (or `users`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` / `UUID` | PRIMARY KEY | Unique user identifier |
| `name` | `VARCHAR(100)` | NOT NULL | User's full name |
| `email` | `VARCHAR(100)` | UNIQUE, NOT NULL | User's email address |
| `password_hash` | `VARCHAR(255)` | NULLABLE | PBKDF2/Bcrypt hashed password |
| `pregnancy_week`| `INTEGER` | DEFAULT 1 | Current gestational week |
| `due_date` | `VARCHAR(50)` | NULLABLE | Expected due date (`YYYY-MM-DD`) |
| `blood_group` | `VARCHAR(10)` | NULLABLE | Maternal blood group (`A+`, `B+`, `O+`, etc.) |
| `emergency_contact_name` | `VARCHAR(100)` | NULLABLE | Name of emergency contact |
| `emergency_contact_phone`| `VARCHAR(30)` | NULLABLE | Phone number of emergency contact |
| `allergies` | `TEXT` | NULLABLE | Known allergies |
| `medical_history` | `TEXT` | NULLABLE | Pre-existing conditions |
| `language_preference` | `VARCHAR(10)` | DEFAULT `'bn'` | Preferred language (`bn` or `en`) |
| `is_admin` | `BOOLEAN` | DEFAULT `FALSE` | Administrative role flag |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Record update timestamp |

---

### 2.2 Table: `chat_sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | PRIMARY KEY | Session unique ID (`chat_...`) |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | Foreign key to user |
| `title` | `VARCHAR(255)` | NOT NULL, DEFAULT `'New Chat'` | Dynamic conversational title |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Session creation timestamp |
| `updated_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Last message timestamp |

---

### 2.3 Table: `chat_messages`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Auto-incrementing message ID |
| `session_id` | `VARCHAR(100)` | NOT NULL, INDEXED, FK(`chat_sessions.id`) | Owning session |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | Foreign key to user |
| `role` | `VARCHAR(20)` | NOT NULL | `'user'` or `'assistant'` |
| `content` | `TEXT` | NOT NULL | Message text |
| `has_image` | `BOOLEAN` | DEFAULT `FALSE` | Multimodal flag |
| `image_url` | `TEXT` | NULLABLE | URL / path to uploaded image |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Turn timestamp |

---

### 2.4 Table: `meal_logs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Log ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `meal_type` | `VARCHAR(50)` | NOT NULL | Meal category (`Breakfast`, `Lunch`, etc.) |
| `description` | `TEXT` | NOT NULL | Meal description (XSS sanitized) |
| `logged_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Ingestion timestamp |

---

### 2.5 Table: `mood_symptoms`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Entry ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `entry_type` | `VARCHAR(20)` | NOT NULL | `'mood'` or `'symptom'` |
| `label` | `VARCHAR(100)` | NOT NULL | Feeling or symptom descriptor |
| `severity` | `VARCHAR(20)` | DEFAULT `'mild'` | Severity level |
| `logged_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Ingestion timestamp |

---

### 2.6 Table: `appointments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Appointment ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `doctor_name` | `VARCHAR(150)` | NOT NULL | Doctor or specialist name |
| `hospital_clinic` | `VARCHAR(200)`| NULLABLE | Facility / hospital name |
| `appointment_time`| `VARCHAR(100)`| NOT NULL | Scheduled datetime string |
| `notes` | `TEXT` | NULLABLE | Clinical notes |
| `is_completed` | `BOOLEAN` | DEFAULT `FALSE` | Completion status |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Booking timestamp |

---

### 2.7 Table: `vital_records`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Vital record ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `bp` | `VARCHAR(50)` | NULLABLE | Blood pressure reading (`120/80`) |
| `weight_kg` | `FLOAT` | NULLABLE | Maternal weight in kg |
| `notes` | `TEXT` | NULLABLE | Additional observations |
| `recorded_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Recording timestamp |

---

### 2.8 Table: `daily_routines`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Routine ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `routine_key` | `VARCHAR(100)` | NOT NULL | Habit descriptor |
| `is_completed` | `BOOLEAN` | DEFAULT `FALSE` | Checkbox state |
| `record_date` | `VARCHAR(20)` | NOT NULL | Date string (`YYYY-MM-DD`) |
| `completed_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Completion timestamp |

---

### 2.9 Table: `kick_records`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Kick record ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `kick_count` | `INTEGER` | DEFAULT 0 | Count of fetal movements |
| `session_start` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Session start timestamp |
| `session_end` | `FLOAT` / `TIMESTAMPTZ` | NULLABLE | Session end timestamp |

---

### 2.10 Table: `saved_baby_names`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Name bookmark ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | User ownership |
| `name` | `VARCHAR(100)` | NOT NULL | Baby name string |
| `gender` | `VARCHAR(20)` | DEFAULT `'unspecified'` | Gender (`boy`, `girl`, `unspecified`) |
| `meaning` | `TEXT` | NULLABLE | Etymology & meaning |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW() | Creation timestamp |

---

### 2.11 Table: `notifications`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Notification ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | Recipient user |
| `title` | `VARCHAR(200)` | NOT NULL | Notification title banner |
| `message` | `TEXT` | NOT NULL | Notification message body |
| `notification_type`| `VARCHAR(50)`| DEFAULT `'custom'`, INDEXED | `'morning_care'`, `'water'`, `'kick_count'`, `'custom'` |
| `scheduled_time` | `VARCHAR(100)`| DEFAULT `'Immediate'` | Human-readable schedule label |
| `is_read` | `BOOLEAN` | DEFAULT `FALSE`, INDEXED | Read status |
| `is_dismissed` | `BOOLEAN` | DEFAULT `FALSE`, INDEXED | Dismissed status |
| `sound_enabled` | `BOOLEAN` | DEFAULT `TRUE` | Sound alert flag |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Dispatch timestamp |
| `read_at` | `FLOAT` / `TIMESTAMPTZ` | NULLABLE | Read timestamp |

---

### 2.12 Table: `emergency_logs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` / `INTEGER` | PRIMARY KEY | Audit incident ID |
| `user_id` | `VARCHAR(100)` | NOT NULL, INDEXED | Mother involved |
| `trigger_source` | `VARCHAR(50)` | DEFAULT `'chat_triage'` | `'chat_triage'` or `'manual_sos'` |
| `symptom_detected`| `TEXT` | NOT NULL | Acute clinical symptom description |
| `action_taken` | `VARCHAR(255)` | DEFAULT `'Emergency advisory displayed'` | Action performed |
| `created_at` | `FLOAT` / `TIMESTAMPTZ` | DEFAULT NOW(), INDEXED | Incident timestamp |

---

## 3. Row Level Security (RLS) & Multi-Tenant Enforcement

Each table in Supabase PostgreSQL is protected with RLS policies:
```sql
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own chat sessions"
ON chat_sessions FOR ALL
USING (auth.uid()::text = user_id);
```
*(Similarly applied to `chat_messages`, `meal_logs`, `mood_symptoms`, `appointments`, `vital_records`, `daily_routines`, `kick_records`, `saved_baby_names`, `notifications`, and `emergency_logs`)*

---

**Step 3 Schema Freeze Complete.**
