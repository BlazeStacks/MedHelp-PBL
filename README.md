# MedHelp — A Secure Digital Platform for Maintaining Patient Treatment Records

An academic prototype (Project-Based Learning) of a centralised health-record platform
where the **patient controls which doctors can access which categories of their records,
and for how long**.

> This is a prototype built with **fictional demo data**. It is not a clinical system and
> must not be used for real patient information.

---

## The idea in one paragraph

Medical history is scattered across prescriptions, lab reports and hospital notes, so
patients forget past diagnoses, medicines and allergies — and doctors treat without the
full picture. MedHelp puts the records in one place, but the differentiator is not
"storing PDFs online". It is **patient-controlled, granular, time-boxed consent**: a
doctor who searches for you sees only your name and email, must request access, and then
receives only the categories you tick — for 1 hour, 24 hours, 7 days or 30 days. You can
revoke at any moment, and every attempt to reach your data is written to an audit trail.

---

## Architecture

```
React (Vite + TS + Tailwind)
        │  HTTPS / REST + JWT
        ▼
Spring Boot backend  ──────────►  PostgreSQL (Supabase)
        │                            users, profiles, records,
        │                            medicines, documents metadata,
        │                            access grants, audit logs, notifications
        │
        ├──────────────►  Supabase Storage  (private bucket, signed access)
        │                   the actual PDF / JPG / PNG bytes
        │
        └──────────────►  Future Python AI service
                            OCR + document classification + extraction,
                            returns structured JSON; never touches the database
```

The Spring Boot backend is the **single source of truth** for authentication,
authorization, records, consent and audit. The future Python service will only *analyse*
documents and hand structured JSON back for the patient to review, edit and confirm.

### Why the AI service is not built yet

It is deliberately absent. The architecture reserves the seam: the backend already
stores documents in an abstracted storage layer and every record is a structured row, so
an extraction service can later POST `{recordType, testName, date, results[]}` to the
backend and the patient can confirm it through the normal record form. The AI must never
become the final source of truth.

---

## Repository layout

```
backend/     Spring Boot application
  src/main/java/com/medhelp/
    config/       security, storage selection, typed properties, demo seeder
    controller/   REST endpoints
    service/      business logic (the consent engine lives in AccessGrantService)
    repository/   Spring Data JPA repositories
    domain/       entities + enums
    dto/          request/response payloads
    mapper/       entity -> DTO conversion
    security/     JWT issuing/verification, principal, current-user helper
    exception/    ApiException + central error handler
    storage/      StorageService with local + Supabase implementations
  src/main/resources/application.yml
  .env.example

frontend/    React application
  src/
    pages/        one folder per role, plus auth
    components/   ui primitives, consent widgets, record widgets
    layouts/      sidebar + topbar shell
    context/      auth and toast providers
    hooks/        useAsync, useRecords
    services/     axios instance + endpoint wrappers
    types/        shared labels/constants for consent categories and record types
    utils/        formatting and date helpers
```

---

## Supabase setup (required before the app can run)

The database and file storage are both on Supabase. Nothing is stored locally.

### 1. Create the project

1. Go to <https://supabase.com> → **New project**.
2. Choose a region close to you (e.g. `ap-south-1` / Mumbai).
3. **Save the database password** you set — it goes into `DB_PASSWORD`.
4. Wait for provisioning to finish.

### 2. Database settings

Open **Project Settings → Database** and copy the **Connection string → URI**.

Prefer the **Connection pooling / Session pooler** URI (port **5432** on the pooler
host, or `6543` for transaction mode). For this app the **session pooler** is the right
choice because Hibernate holds connections open and uses `ddl-auto: update`.

Convert the URI into the three values the backend wants:

```
DB_URL=jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<your database password>
```

Notes:

- Keep `?sslmode=require`. Supabase rejects non-TLS connections.
- The pooler username is usually `postgres.<project-ref>`, not plain `postgres`.
- The database name is `postgres` by default.
- If your password contains special characters, URL-encode them (`@` → `%40`).
- **Do not put credentials inside `DB_URL`.** `DB_URL` must be host-only
  (`jdbc:postgresql://host:5432/postgres?sslmode=require`). If you paste
  `user:password@host`, the driver fails with
  `UnknownHostException: user:password@host` because JDBC does not strip
  userinfo from the authority. Username and password go in `DB_USERNAME` and
  `DB_PASSWORD`, which are read separately.

**No tables need to be created by hand.** Hibernate creates the whole schema on first
start (`ddl-auto: update`), including `users`, `patient_profiles`, `doctor_profiles`,
`medical_records`, `prescription_medicines`, `documents`, `access_grants`,
`access_grant_permissions`, `audit_logs`, `notifications` and `refresh_tokens`.

### 3. Storage settings

1. Go to **Storage → New bucket**.
2. Name it `medical-documents`.
3. **Leave "Public bucket" OFF.** This is important — files must not be reachable by a
   public URL.
4. No policies are required, because the backend uses the service-role key and the
   bucket stays private.
5. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret** → `SUPABASE_SERVICE_KEY`

> The service-role key bypasses row-level security. It is used **server-side only** and is
> never sent to the browser. Keep it out of the frontend and out of version control.

### 4. Fill in `backend/.env`

Copy `backend/.env.example` to `backend/.env` and set:

```
DB_URL=jdbc:postgresql://<host>:5432/postgres?sslmode=require
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<database password>

JWT_SECRET=<run: openssl rand -base64 48>

STORAGE_PROVIDER=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service_role secret>
SUPABASE_BUCKET=medical-documents

CORS_ALLOWED_ORIGINS=http://localhost:5173
SEED_DEMO_DATA=true
```

`JWT_SECRET` must be at least 32 characters. Generate it with
`openssl rand -base64 48` (or any long random string).

`backend/.env` is git-ignored. `backend/.env.example` contains only empty placeholders.

---

## Running the project

### Backend

```bash
cd backend
mvn spring-boot:run
```

Serves on `http://localhost:8080`. On the first run it creates the schema and, because
`SEED_DEMO_DATA=true` and the database is empty, inserts the demo accounts and records.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Serves on `http://localhost:5173` and proxies `/api` to `localhost:8080`.

### Troubleshooting

| Symptom | Cause |
| --- | --- |
| `UnknownHostException: user:password@host` | Credentials pasted into `DB_URL`. Strip them out. |
| `Unable to determine Dialect without JDBC metadata` | The datasource never connected — a symptom, not the cause. Check `DB_URL`. |
| `JWT_SECRET is not set` | Copy `.env.example` to `.env` and generate a secret. |
| `Could not create storage directory` | Supabase provider misconfigured; check `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`. |
| 401 on a valid token | Token expired; the frontend refreshes automatically, but check `JWT_SECRET` is stable across restarts. |

> **Never log `DB_URL` if it contains credentials.** Exception messages echo
> connection URLs back into application logs.

### Demo accounts

| Role    | Email              | Password    |
| ------- | ------------------ | ----------- |
| Patient | `patient@demo.com` | `Demo@1234` |
| Patient | `priya@demo.com`   | `Demo@1234` |
| Doctor  | `doctor@demo.com`  | `Demo@1234` |
| Doctor  | `ananya@demo.com`  | `Demo@1234` |

These shortcuts are also clickable on the login screen. All seeded data is fictional.

---

## The demo flow (the thing to show)

1. Sign in as the **patient** (`patient@demo.com`).
2. The timeline shows a seeded history: consultations, a prescription with two medicines,
   an MRI report, a blood test, allergies and medical history.
3. Open **Doctors & Access** — a request from Dr. Sharma is already pending.
4. Click **Review request**. Tick **Prescriptions**, **Diagnostic Reports** and
   **Allergies**. Deliberately leave **Medical History** unticked. Choose **24 hours**.
   Approve.
5. Sign out. Sign in as the **doctor** (`doctor@demo.com`).
6. **Authorized Patients** now lists Aryan. Open his records.
7. The permission panel shows exactly what is and is not shared. The record list contains
   prescriptions, reports and allergies — **no medical history**.
8. Try to bypass it: paste a medical-history record URL such as
   `http://localhost:8080/api/records/<id>` into a REST client with the doctor's token.
   The backend returns **403** and records the attempt.
9. As the doctor, add a new **prescription** for the patient.
10. Sign out, sign back in as the patient. The new prescription is on the timeline and in
    the notification centre.
11. Back in **Doctors & Access**, click **Revoke**. The doctor immediately loses access.
12. Open **Access History** — every approval, view, revocation and *blocked attempt* is
    listed.

---

## How authorization actually works

The frontend never decides permissions. Hiding a menu item is presentation only.

```
Doctor requests a record
        ↓
Is the caller a doctor?                        (Spring Security, role from JWT)
        ↓
Who owns the record?                           (loaded from the database)
        ↓
Is there an APPROVED grant patient → doctor?   (access_grants)
        ↓
Has it expired?                                (expiresAt vs now)
        ↓
Does the grant allow this record category?     (access_all, or the permissions set)
        ↓
ALLOW  /  DENY (+ write a denial to the audit log)
```

This lives in `AccessGrantService.requireCategoryAccess`. Every doctor-facing read path
(record list, single record, timeline, document download, record creation) calls it.

Additional rules enforced server-side:

- A doctor may only **create** new records (consultations, prescriptions). They can never
  update or delete historical records — old entries stay immutable.
- A doctor may only create a record in a category their grant covers.
- Documents are streamed through `/api/documents/{id}/content` after an authorization
  check, with `Cache-Control: no-store`. There is no public file URL.
- Uploads are restricted to PDF/JPG/JPEG/PNG, max 15 MB, and the stored filename is
  sanitised so a crafted name cannot escape the storage root.
- Passwords are BCrypt-hashed. Login returns the same error for an unknown email and a
  wrong password, so the endpoint cannot be used to enumerate accounts.

---

## API summary

| Area          | Endpoints |
| ------------- | --------- |
| Auth          | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| Patient       | `GET/PUT /api/patient/me`, `GET /api/patient/dashboard` |
| Doctor        | `GET/PUT /api/doctor/me`, `GET /api/doctor/patients/search`, `GET /api/doctor/dashboard` |
| Records       | `GET /api/records`, `/records/timeline`, `/records/stats`, `GET/PUT/DELETE /api/records/{id}`, `POST /api/records` |
| Documents     | `POST /api/records/{id}/documents`, `GET /api/documents/{id}/content`, `/download`, `DELETE /api/documents/{id}` |
| Consent       | `POST /api/access/request`, `GET /api/access/requests`, `/requests/pending`, `/grants`, `/effective/{patientId}`, `POST /api/access/{id}/approve`, `/deny`, `/revoke` |
| Activity      | `GET /api/notifications`, `POST /api/notifications/{id}/read`, `/read-all`, `GET /api/audit` |
| Health        | `GET /api/health` |

---

## Swapping storage providers

`StorageService` has two implementations chosen by `STORAGE_PROVIDER`:

- `local` — writes to `backend/storage/`. Useful if you want to run the app without
  Supabase Storage while still using Supabase Postgres. Files are still served only
  through the authenticated endpoint.
- `supabase` — writes to the private bucket and can mint short-lived signed URLs.

Because every caller depends on the interface, switching is a config change only.

---

## Explicitly out of scope

AI diagnosis or recommendations, chatbots, blockchain, insurance/billing, payments,
hospital-network or nationwide EHR integration, offline mode, microservices, a complex
admin system, email/SMS notifications, and advanced analytics.

An admin verification step for doctors is *reserved* — `doctor_profiles.verified` already
exists and is surfaced in the UI — but is not implemented.
