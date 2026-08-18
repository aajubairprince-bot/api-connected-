# Shokhi AI (সখী AI) — Authentication Specification

**Document Version:** 2.0.0
**Phase:** Phase 4 — Authentication & JWT Session Engine
**Runtime:** Node.js / Vercel Serverless + Supabase Auth
**Date:** August 2026
**Status:** Implemented & Verified ✅

---

## 1. Overview & Security Architecture

Shokhi AI implements a dual-path authentication architecture:

- **Path A:** Email/password → bcryptjs hashing → custom JWT issuance
- **Path B:** Google OAuth → Supabase Auth → JWT issuance → profile sync

Both paths produce a **30-day JWT Bearer token** stored in `localStorage`. Every protected endpoint verifies the token and performs a **live database role check** on every request.

### Security Guarantees
- **Zero Trust Navigation:** Frontend only shows the main app after `/api/auth/me` succeeds
- **DB-Driven Role:** `is_admin` is read live from `profiles` table — not from JWT payload
- **No Hardcoded Credentials:** Admin access is purely database-driven
- **bcryptjs Hashing:** Password hashing uses bcryptjs (cost factor 10) — not PBKDF2

---

## 2. Authentication Endpoints

| Endpoint | Method | Auth | Request Body | Response |
|:---|:---|:---|:---|:---|
| `POST /api/auth/register` | POST | Public | `{email, password, name, pregnancy_week}` | `201` `{token, user}` |
| `POST /api/auth/login` | POST | Public | `{email, password}` | `200` `{token, user}` |
| `GET /api/auth/me` | GET | Bearer Token | — | `200` `{id, email, name, is_admin, pregnancy_week}` |
| `POST /api/auth/google` | POST | Public | `{email, name, google_id}` | `200` `{token, user}` |
| `POST /api/auth/sync_profile` | POST | Bearer Token | `{pregnancy_week, due_date}` | `200` `{success, profile}` |

---

## 3. Registration Flow (`POST /api/auth/register`)

```js
// lib/auth.js + api/auth/register.js
const passwordHash = await bcrypt.hash(password, 10);          // bcryptjs, cost=10
const { data: supaUser } = await supabase.auth.signUp({        // Supabase Auth
  email, password
});
await supabase.from('profiles').insert({                        // profiles table
  id: supaUser.user.id,
  full_name: name,
  pregnancy_week,
  preferred_language: 'bn'
});
const token = generateToken({ id, email, is_admin: false });   // 30-day JWT
```

---

## 4. Login Flow (`POST /api/auth/login`)

```js
// api/auth/login.js
const { data: profile } = await supabase
  .from('profiles').select('*').eq('email', email).single();

const valid = await bcrypt.compare(password, profile.password_hash);
if (!valid) return 401;

const token = generateToken({ id: profile.id, email, is_admin: profile.is_admin });
```

---

## 5. Token Verification (`verifyAuth()` in `lib/auth.js`)

Every protected endpoint calls `verifyAuth(req)`:

```js
export async function verifyAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  // Try Supabase Auth first
  const { data } = await supabase.auth.getUser(token);
  if (data?.user) {
    // Live DB role check — not from JWT
    const { data: profile } = await getSupabaseAdminClient()
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email,
      is_admin: Boolean(profile?.is_admin)
    };
  }

  // Fallback: verify local JWT
  return verifyLocalToken(token);
}
```

---

## 6. JWT Token Structure

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "name": "নুসরাত",
  "pregnancy_week": 14,
  "is_admin": false,
  "iss": "shokhi-ai-auth",
  "exp": 1756000000
}
```

**Expiry:** 30 days (`{ expiresIn: '30d' }`)
**Secret:** `process.env.SECRET_KEY`
**Note:** `is_admin` in JWT is **ignored for authorization** — the live DB value is always used

---

## 7. Google OAuth Flow

1. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Supabase handles Google OAuth redirect
3. Frontend receives `session.access_token` from Supabase
4. Frontend calls `POST /api/auth/google` with the user's email + name
5. Server upserts `profiles` row
6. Server issues custom JWT
7. Frontend stores token in `localStorage`

---

## 8. Test Results (Node.js E2E — `test_node_e2e.js`)

| Test | Scenario | Result |
|:---|:---|:---|
| TC-AUTH-01 | New maternal registration | ✅ HTTP 201, token returned |
| TC-AUTH-02 | Duplicate email registration | ✅ HTTP 409 Conflict |
| TC-AUTH-03 | Invalid password login | ✅ HTTP 401 Unauthorized |
| TC-AUTH-04 | Valid login | ✅ HTTP 200, token returned |
| TC-AUTH-05 | Unauthenticated protected access | ✅ HTTP 401, Bearer required |
| TC-AUTH-06 | `/api/auth/me` identity check | ✅ HTTP 200, correct user returned |
| TC-AUTH-07 | Multi-user registration (User A & B) | ✅ Distinct UUIDs + tokens |
| TC-AUTH-08 | Token isolation | ✅ Token A ≠ Token B, distinct identities |

---

**Phase 4 Authentication Specification — Node.js Edition. Complete.**
