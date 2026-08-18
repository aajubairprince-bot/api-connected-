# Shokhi AI (সখী AI) — Admin Panel & Practicum Audit Dashboard Specification (Phase 13)

**Document Version:** 1.0.0  
**Phase:** Phase 13 — Admin Panel & Practicum Audit Dashboard  
**Date:** August 17, 2026  
**Status:** Implemented & Verified

---

## 1. Executive Summary & Capabilities

Phase 13 establishes the administrative control plane and academic defense audit dashboard (`/api/admin/metrics` and `/admin/`), providing comprehensive observability into user growth, maternal engagement, clinical emergency incidents, and multi-tenant data structures for the final BCSE practicum defense.

### Key Administrative Capabilities:
1. **Flask-Admin Relational Management Interface (`/admin/`):**
   * Exposes structured model views for all 12 system entities: `User`, `ChatSession`, `ChatMessage`, `MealLog`, `MoodSymptom`, `Appointment`, `VitalRecord`, `DailyRoutine`, `KickRecord`, `SavedBabyName`, `EmergencyLog`, and `Notification`.
2. **Role-Based Access Control (`@require_admin`):**
   * Protects sensitive administrative metrics and operational endpoints against regular user accounts (returns `403 Forbidden`).
3. **Practicum Academic Defense Metrics Engine (`/api/admin/metrics`):**
   * Real-time aggregation of registered mothers, multi-turn chat volumes, nutrition logs, vitals logs, and emergency red-flag triggers.
   * Exposes underlying architecture stack specifications (Python 3.12, Flask, Supabase PostgreSQL, Gemini Generative AI).

---

## 2. Admin Security & Observability Architecture

```mermaid
graph TD
    A[Admin Client / Evaluation Panel] -->|Bearer JWT + Admin Role| B(Flask App Routing)
    B --> C{require_admin Guard}
    C -->|Unauthorized / Regular Mother| D[403 Forbidden]
    C -->|Verified Admin Identity| E[/api/admin/metrics]
    E --> F[(PostgreSQL / SQLite Database)]
    F --> G[Dynamic Metric Aggregates]
    G --> H[Defense Audit JSON Payload]
```

---

## 3. Endpoints Catalog

| Endpoint | Method | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/` | `GET` | Admin / Internal | None | Flask-Admin relational CRUD UI. |
| `/api/admin/metrics` | `GET` | Bearer Token (`is_admin=True`) | None | Real-time aggregated academic defense system metrics. |

---

## 4. Automated Verification Results (`test_phase13.py`)

All Phase 13 scenarios passed:
* **Admin Web UI:** Status 200 (All 12 entities verified in UI).
* **Non-Admin Rejection:** Status 403 Forbidden (`Admin privileges required`).
* **Admin Practicum Metrics:** Status 200 (Aggregated 21 mothers, 13 chats, 2 nutrition logs, 2 emergencies).
* **Engine Stack Specifications:** Verified.

---

**Phase 13 Execution Finished.**
