# Shokhi AI — Admin Panel Guide

**Version:** 2.0.0 | **Access Level:** Admin Only (`profiles.is_admin = true`)
**File:** `www/admin.html`

---

## 1. Overview

The Shokhi AI Admin Panel is a real-time clinical dashboard that provides administrators with live visibility into all maternal health data, user management tools, and broadcast communication capabilities.

Key characteristics:
- **Light-mode design** with clean white/slate/rose palette
- **Supabase Realtime** subscriptions — data updates without page refresh
- **Role-gated access** — only users with `is_admin = true` in the `profiles` table can enter
- **Admin-only API endpoints** — all actions use the Supabase service role key server-side

---

## 2. Accessing the Admin Panel

### Step 1 — Be Assigned Admin Role
Admin access is **purely database-driven**. A current admin must run:

```bash
# Via CLI utility script
node scripts/assign_admin.js user@example.com
```

Or via the Admin Panel itself (Role Management tab) or direct Supabase SQL:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'user@example.com';
```

### Step 2 — Login
Navigate to the app (`index.html`). On login, the app calls `/api/auth/me` which returns `is_admin: true`. The frontend then redirects automatically to `/admin.html`.

### Step 3 — Admin Auth Gate
`admin.html` has a built-in auth gate. On load it:
1. Reads `shokhi_admin_token` from `localStorage`
2. Calls `GET /api/auth/me` with the token
3. If `is_admin = true` → shows dashboard
4. If `is_admin = false` or token invalid → shows "Access Denied" screen

---

## 3. Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🌸 Shokhi AI — Admin Dashboard              [● LIVE] [Logout]  │
├─────────────────────────────────────────────────────────────────┤
│  6 Metric Cards:                                                 │
│  [Total Mothers] [AI Turns] [Meals] [Vitals] [Appointments] [Emg]│
├─────────────────────────────────────────────────────────────────┤
│  8 Data Tabs:                                                    │
│  Mothers | Chat | Nutrition | Vitals | Mood | Routines | Notif | Emg│
├─────────────────────────────────────────────────────────────────┤
│  3 Action Panels:                                                │
│  [Role Management] [Broadcast Notification] [Live Status]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Metric Cards (Top Row)

| Card | Source | Description |
|---|---|---|
| Total Registered Mothers | `profiles` table | Count of all registered users |
| AI Chat Turns Logged | `chat_messages` | Total AI conversation turns |
| Nutrition Meals Logged | `meal_logs` | Total meal entries |
| Vital Signs Recorded | `vital_records` | Total BP/weight readings |
| Doctor Appointments | `appointments` | Total scheduled appointments |
| Emergency Triage Events | `emergency_logs` | Total red-flag incidents |

All values are loaded via `GET /api/admin/metrics` and update in real-time via Supabase Realtime.

---

## 5. Data Tabs

### Tab 1: Mothers
Shows all registered user profiles. Columns: Name, Email, Pregnancy Week, Blood Group, Language, Admin Status, Joined.

### Tab 2: AI Chat Transcripts
Shows all chat messages across all users. Each row shows: User Name, Role (user/assistant), Content (truncated), Timestamp.
- **Delete button:** Removes a single chat message via `DELETE /api/admin/delete { table: 'chat_messages', id }`

### Tab 3: Nutrition Logs
Shows all meal entries. Columns: User, Meal Type, Description, Logged At.
- **Delete button** per row.
- **CSV Export** — downloads all visible rows as `meal_logs.csv`

### Tab 4: Vital Signs
Shows all BP + weight readings. Columns: User, Blood Pressure, Weight (kg), Notes, Recorded At.
- **Delete button** per row.
- **CSV Export**

### Tab 5: Mood & Symptoms
Shows all mood/symptom entries. Columns: User, Type (mood/symptom), Label, Severity, Logged At.
- **Delete button** per row.
- **CSV Export**

### Tab 6: Daily Routines
Shows routine completion records. Columns: User, Routine Key, Completed, Date.
- **Delete button** per row.
- **CSV Export**

### Tab 7: Notifications
Shows all system notifications. Columns: User, Title, Type, Read, Dismissed, Created At.
- **Delete button** per row.

### Tab 8: Emergency Logs
Shows all emergency triage events. Columns: User, Symptom Detected, Trigger Source, Action Taken, Created At.
- **Delete button** per row.
- **CSV Export**

---

## 6. Action Panels

### Role Management
Grants or revokes admin role for any user by email address.

**UI:** Email input + "Grant Admin" / "Revoke Admin" buttons

**API:** `POST /api/admin/assign_role`
```json
{ "email": "user@example.com", "is_admin": true }
```

Results displayed as a toast notification.

---

### Broadcast Notification
Sends a notification to **all registered mothers** simultaneously.

**UI:** Title + Message inputs + "Send to All Mothers" button

**API:** `POST /api/notifications`
```json
{ "title": "...", "message": "...", "notification_type": "broadcast", "user_id": "all" }
```

Notifications with `user_id = 'all'` are returned to all users' notification lists via the RLS policy `OR user_id = 'all'`.

---

### Live Status Badge

Displays the current Supabase Realtime connection state:

| Badge | State |
|---|---|
| 🟢 **LIVE** | Realtime subscription active, connected to Supabase |
| 🟡 **Syncing** | Connecting or reconnecting |
| 🔴 **Offline** | Connection lost |

---

## 7. Supabase Realtime Integration

The admin panel subscribes to **Postgres Changes** on 8 tables:

```js
supabase
  .channel('admin-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_records' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_symptoms' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_routines' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_logs' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handler)
  .subscribe()
```

On each event, the relevant tab row is inserted/updated/removed without a full page reload. The live status badge reflects subscription state.

**Note:** Realtime uses the **anon key** (public) via the Supabase JS SDK bundled in `www/supabase.min.js`. Admin data access uses the **service role key** server-side in API calls.

---

## 8. CSV Export

Each data tab with an Export button:
1. Reads the current tab's data array from memory
2. Converts rows to CSV string (header + data rows)
3. Creates a `Blob` and triggers `<a download>` click

The export is client-side — no additional API call needed.

---

## 9. Security Notes

- All admin API endpoints verify `is_admin` via a **fresh DB query** on every request — no cached role
- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) **never reaches the frontend** — used only in server-side API handlers
- The admin panel reads data via `/api/admin/metrics` (server-side service role), not direct DB from browser
- Delete operations are scoped to specific allowed tables and validated on the server
