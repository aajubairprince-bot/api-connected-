# Shokhi AI (সখী AI) — Supabase Integration & Setup Guide (Phase 3)

**Document Version:** 1.0.0  
**Phase:** Phase 3 — Supabase Setup  
**Date:** August 17, 2026  
**Status:** Implemented & Verified

---

## 1. Overview & Setup Architecture

Phase 3 establishes the foundation for connecting **Shokhi AI** to Supabase Cloud for Identity Authentication and PostgreSQL Data Persistence.

### Key Integration Principles:
1. **Zero Secret Exposure:** The Supabase Service Role Key is strictly isolated to backend server-side operations. The frontend only receives safe public keys (`SUPABASE_URL` and `SUPABASE_ANON_KEY`).
2. **Environment Encapsulation:** All endpoints and clients pull configuration exclusively from environment variables via `python-dotenv`.
3. **Diagnostic Introspection:** Added `/api/config` and `/api/system/status` endpoints to verify live cloud connectivity and health status.

---

## 2. Environment Variables Specification

| Environment Variable | Scope | Required | Example / Format | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Public / Server | Yes | `https://xyzprojectid.supabase.co` | Supabase project API gateway endpoint |
| `SUPABASE_ANON_KEY` | Public / Client | Yes | `eyJhbGciOi...` | Public Anonymous API key for user requests & RLS enforcement |
| `SUPABASE_SERVICE_ROLE_KEY`| Private / Server | Optional* | `eyJhbGciOi...` | High-privilege secret key for server administration (*Never expose to frontend) |
| `SUPABASE_JWT_SECRET` | Private / Server | Optional | `your-jwt-secret-string` | Secret for cryptographic offline JWT verification |
| `GEMINI_API_KEY` | Private / Server | Yes | `AQ.Ab8RN6...` | Google GenAI API key for LLM responses |
| `GEMINI_MODEL` | Server | Yes | `gemini-3.6-flash` | Selected Gemini model |
| `NODE_PORT` | Server | Optional | `3000` | Local development port (mirrored on 5000) |
| `SECRET_KEY` | Server | Yes | `jwt_secret_key` | JWT session signing key |

---

## 3. Step-by-Step Supabase Project Setup

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project named **`shokhi-ai`**.
3. Select a database region close to your primary users (e.g. `Singapore` / `South Asia`).

### Step 2: Retrieve API Keys
1. In your Supabase Project Dashboard, navigate to **Project Settings ➔ API**.
2. Copy the **Project URL** ➔ Paste into `.env` as `SUPABASE_URL`.
3. Copy the **anon / public** key ➔ Paste into `.env` as `SUPABASE_ANON_KEY`.
4. Copy the **service_role** key ➔ Paste into `.env` as `SUPABASE_SERVICE_ROLE_KEY`.

### Step 3: Run Database DDL Scripts
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Open the SQL script from [`supabase_schema.sql`](file:///f:/downloads/Shokhi-AI-main/Shokhi-AI-main/supabase_schema.sql) or [`docs/DATABASE_DESIGN.md`](./DATABASE_DESIGN.md).
3. Execute the script to create:
   * 12 normalized tables with constraints and foreign keys.
   * Automated `update_updated_at_column()` triggers.
   * Performance B-Tree indexes.
   * Row Level Security (RLS) policies.

---

## 4. Server-Side Module Architecture (`lib/supabase.js`)

The application integrates `lib/supabase.js` providing:
* `getSupabaseClient()`: Instantiates client configured for user-scoped requests.
* `getSupabaseAdminClient()`: Instantiates admin client using `SUPABASE_SERVICE_ROLE_KEY` for server-side management (bypasses RLS).
* `getSupabaseConfig()`: Verifies if cloud Supabase is active or offline fallback is needed.
* `localDb`: High-speed in-memory data store providing seamless offline fallback during local testing.

---

## 5. Safe Configuration Endpoints

### 1. `GET /api/config`
Exposes only public configuration to the browser client:
```json
{
  "supabase_url": "https://xyzprojectid.supabase.co",
  "supabase_anon_key": "eyJhbGci...",
  "is_configured": true
}
```

### 2. `GET /api/system/status`
Returns comprehensive system diagnostic report:
```json
{
  "status": "online",
  "app_name": "Shokhi AI (সখী AI)",
  "gemini": {
    "configured": true,
    "model": "gemini-3.6-flash"
  },
  "supabase": {
    "status": "connected",
    "message": "Supabase client successfully initialized and configured.",
    "url": "https://xyzprojectid.supabase.co",
    "has_service_role": true
  }
}
```

---

**Phase 3 Implementation Finished. Ready for Phase 4.**
