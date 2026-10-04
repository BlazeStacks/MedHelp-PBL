# A Secure Digital Platform for Maintaining Patient Treatment Records

**MedHelp** — a Project-Based Learning prototype (Review 1, Group SY2-G), grounded in a
field visit to Deenanath Mangeshkar Hospital, Pune.

> This is an academic prototype running on **fictional demo data**. It is not a clinical
> system and must never be used for real patient information.

---

## The problem

Patients visit different doctors and facilities throughout their lives, so their medical
information ends up scattered across prescriptions, diagnostic reports, hospital records
and personal documents.

Patients forget previous treatments, medicines, allergies and diagnoses. When a doctor
cannot see that history, the risk of inappropriate treatment or medication-related
complications goes up. Hospital staff we observed still rely heavily on physical
documents, and records stay siloed with the hospital that created them instead of
following the patient.

There is a clear need for a **secure, centralised, patient-controlled** digital record
system. That is what this prototype builds.

---

## The idea

Storing PDFs online is not the differentiator. The differentiator is
**granular, time-boxed, patient-controlled consent**:

> A doctor who finds you in the directory sees **no medical records at all**. They must
> ask for access. You decide *which categories* of your file they may read, and *for how
> long*. You can revoke at any moment. Every attempt to reach your data — including
> blocked ones — is written to an audit trail you can read.

The frontend never makes that decision. Hiding a menu item is presentation only; the
Spring Boot backend re-checks consent on **every single request**.

---

## How it works

### 1. The patient's file lives with the patient

A patient registers and builds a structured file rather than a folder of loose PDFs.
Records are typed into five categories (below), so "prescriptions" and "allergies" are
separate, independently shareable things. A prescription holds a list of medicines with
dosage, frequency and duration. Scan attachments (PDF/JPG/PNG, up to 15 MB) hang off the
record they belong to.

Document bytes go into a **private** Supabase Storage bucket; the row describing them
stays in Postgres. There is no public file URL anywhere.

### 2. A doctor starts with nothing

A doctor can search the patient directory by name or email. That search returns only
directory fields — name, email, date of birth and blood group, so the doctor can confirm
they have the right person. **Zero records, zero documents, zero history** come back
with it.

### 3. The doctor asks

The doctor sends an access request with a written reason and the categories they believe
they need. That request *grants nothing on its own* — it is only a hint that shapes your
approval screen.

### 4. The patient decides — category by category, for a fixed time

On **Doctors & Access** the patient opens the pending request and chooses:

- **Everything** (`accessAll`), or an explicit set of categories, and
- a duration: **1 hour, 24 hours, 7 days or 30 days**.

Approving writes an `APPROVED` grant with an `expiresAt` timestamp and the exact
permission set. Denying writes a denial the doctor can see. The classic demonstration is
to grant *Prescriptions*, *Diagnostic Reports* and *Allergies* while deliberately leaving
**Medical History** unticked.

### 5. The backend enforces it on every request

Every doctor-facing read — record list, single record, timeline, document download,
record creation — passes through one check:

```
Doctor requests a record
        ↓
Is the caller a doctor?                        (Spring Security, role from the JWT)
        ↓
Who owns the record?                           (loaded from the database)
        ↓
Is there an APPROVED grant patient → doctor?   (access_grants)
        ↓
Is it still live?                              (expiresAt > now, checked per request)
        ↓
Does the grant allow this record's category?   (access_all, or the permission set)
        ↓
ALLOW  /  DENY  (+ write the denial to the audit log)
```

The list endpoint additionally intersects any requested type filter with the permitted
types, so a doctor cannot widen their view by asking for a different category. A blocked
attempt returns **403** and is logged as `ACCESS_DENIED_BY_POLICY`.

### 6. Access expires on its own; revocation is instant

Liveness is evaluated against `expiresAt` on each request, so a grant stops working the
moment it lapses even if nothing else runs. A background sweep (every 5 minutes) then
marks lapsed grants as `EXPIRED` so the UI states it plainly. Clicking **Revoke** flips
the grant immediately — the doctor's next request is a 403.

### 7. Everything is written down

Sixteen audit action types record logins, requests, approvals, denials, revocations,
expiries, record/document changes and blocked reads. The patient sees all of it on
**Access History**, including attempts that were refused. Nine notification types cover
the same lifecycle in-app (no emails or SMS in this phase).

---

## The five record categories

Each record type maps to exactly one consent category, so a category can be granted
without exposing anything else.

| Record type | Consent category | Holds |
| --- | --- | --- |
| `CONSULTATION` | Consultations | symptoms, diagnosis, treatment, facility, doctor |
| `PRESCRIPTION` | Prescriptions | one or more medicines with dosage/frequency/duration |
| `DIAGNOSTIC_REPORT` | Diagnostic Reports | test name, result summary, attached report file |
| `ALLERGY` | Allergies | allergen, reaction, severity (mild/moderate/severe) |
| `MEDICAL_HISTORY` | Medical History | condition, current status, year |

Adding a value here makes it shareable without touching the authorization logic.

---

## Features

### Patient

- **Dashboard** — record counts by category, active doctor access, pending requests,
  unread notifications, recent records and recent activity.
- **Medical Timeline** — one reverse-chronological view of everything that happened,
  with document counts.
- **Per-category views** — Medical History, Prescriptions, Diagnostic Reports, Allergies.
- **Add and edit records** in all five types, with dynamic medicine rows for
  prescriptions, and attachment of PDF/JPG/JPEG/PNG scans up to 15 MB.
- **Doctors & Access** — pending requests, and every doctor who currently has access with
  the exact categories shared, a live countdown (`6d 2h left`), the reason they gave, and
  a **Revoke** button.
- **Consent review** — tick categories one by one, pick a duration, approve or deny with a
  note.
- **Access History** — the full audit trail, including blocked attempts.
- **Upload Record, Notifications, Settings** (editable profile: phone, DOB, gender, blood
  group, address, emergency contact, known conditions).
- Own records can be edited or deleted by the patient; every change is audited.

### Doctor

- **Find Patients** — search by name or email, then request access with a reason.
- **Access Requests** — requests the doctor has sent and their outcomes.
- **Authorized Patients** — patients the doctor can currently read, with the permission
  panel showing precisely what is and is not shared.
- **Patient Records / Prescriptions / Treatment Records** — consent-filtered lists
  across all authorised patients.
- **Add records for an authorised patient** — permitted only in categories the grant
  covers, and only as *new* entries.
- **Access History** and **Settings**.

### Security and privacy (both roles)

- JWT access tokens (60 min) with refresh-token **rotation** — each refresh token is
  single-use: `consume()` marks it revoked the instant it is exchanged, and logout revokes
  the token being presented, so a leaked refresh token dies as soon as it is spent.
- BCrypt password hashing (strength 10); login returns the same message for an unknown
  email and a wrong password, so the endpoint cannot be used to enumerate accounts.
- Bean validation on request payloads, plus server-side business validation (a
  consultation needs a diagnosis and symptoms; a prescription needs at least one medicine).
- Documents stream through an authenticated endpoint with `Cache-Control: no-store`;
  stored filenames are sanitised so a crafted name cannot escape the storage root.
- Uploads restricted to PDF/JPG/JPEG/PNG at 15 MB.

### What a doctor explicitly cannot do

| Attempt | Result |
| --- | --- |
| Read any record with no grant | 403 + audited |
| Read a category outside their grant | 403 + audited |
| Read after expiry or revocation | 403 + audited |
| Widen their view via a type filter | intersected with permitted types |
| Edit or delete an existing record | not permitted — patients own their history |
| Create a record in a non-granted category | 403 |
| Fetch a document without consent | 403; no public URL exists |
| Search the directory and see records | only directory fields return |

---

## The demonstration

These steps are self-contained: they work whether or not the seeded access request is
still waiting, because the doctor sends their own request as part of the demo.

1. Sign in as the **patient** (`patient@demo.com`). Point at the timeline: consultations,
   a prescription with its medicines, an MRI, a blood test, allergies and medical history
   — all in one place, each with its document count.
2. Sign out, sign in as the **doctor** (`doctor@demo.com`). Open **Find Patients**, search
   "Aryan", send an access request with a reason and the categories you believe you need.
   The form spells out that these are only a suggestion and that the patient decides.
3. Sign back in as the **patient** → **Doctors & Access** → **Review request**. Tick
   *Prescriptions*, *Diagnostic Reports* and *Allergies*, deliberately leave
   **Medical History** unticked, choose **24 hours**, approve.
4. Sign in as the **doctor** → **Authorized Patients** → open Aryan's records. The
   permission panel shows exactly what is and is not shared, and the record list contains
   no medical history.
5. The bypass attempt: fetch a medical-history record by id with the doctor's token. The
   backend returns **403**, and the attempt lands in the patient's **Access History** as a
   blocked read.
6. As the doctor, add a new **prescription** — allowed, because Prescriptions were
   granted. Try adding a *medical history* entry instead — denied, because that category
   was not.
7. Back as the patient: the new prescription is on the timeline, and the approval and
   views are on **Access History**.
8. Click **Revoke**. The doctor's very next request fails immediately.

---

## Scope

**Built in this phase**

- Secure storage of treatment history, prescriptions, diagnostic reports and allergies.
- Patient-controlled, permission-based access for doctors, with a time limit.
- Doctor upload of new prescriptions and treatment details, with consent.
- A responsive web platform usable by both patients and doctors.
- Authentication, consent-based authorization, and TLS on the database connection.

**Deliberately out of scope**

- AI-based diagnosis or treatment suggestions.
- Insurance claim processing, billing or payments.
- Offline / no-internet functionality.
- Nationwide hospital network or EHR integration.
- A hospital or admin role — there are only two roles, patient and doctor.
- Email or SMS notifications (notifications are in-app only).
- Changing your password from the UI (prototype limitation; noted on the Settings screen).

---

## Planned: the AI document service

A separate Python micro-service is planned for OCR, document classification and field
extraction. It is deliberately **not built yet**, and when it is, it will only *analyse* a
document and hand structured JSON back to the backend — the patient then reviews, edits
and confirms it through the normal record form. The AI must never become the final source
of truth, and it will never touch the database directly.

The seam already exists: documents live behind an abstracted storage interface and every
record is a structured row.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite, JavaScript (JSX), Tailwind CSS 4, React Router 6 |
| Frontend data | Axios, Zod + React Hook Form (auth validation), Lucide icons |
| Backend | Java 21, Spring Boot (Web, Security, Data JPA, Validation) |
| Auth | JWT (JJWT), BCrypt |
| Database | PostgreSQL hosted on Supabase |
| File storage | Supabase Storage, private bucket, signed/short-lived access |
| Future | Python micro-service for OCR + extraction |

---

## Project structure

```
backend/     Spring Boot application
  src/main/java/com/medhelp/
    config/       security, storage selection, typed properties, demo seeder
    controller/   REST endpoints
    service/      business logic (the consent engine lives in AccessGrantService)
    repository/   Spring Data JPA repositories
    domain/       entities + enums (RecordType, RecordCategory, AccessDuration, …)
    dto/          request/response payloads
    security/     JWT issuing/verification, principal, current-user helper
    exception/    ApiException + central error handler
    storage/      StorageService with local + Supabase implementations
  src/main/resources/application.yml
  .env.example

frontend/    React application (plain JavaScript, no TypeScript)
  src/
    pages/        one folder per role, plus auth
    components/   ui primitives, consent widgets, record widgets
    layouts/      sidebar + topbar shell
    context/      auth and toast providers
    hooks/        useAsync, useRecords
    services/     axios instance + endpoint wrappers
    types/        shared labels/constants for consent categories and record types
    utils/        formatting and date helpers

pbl ppt.pdf  PBL Review 1 presentation
```

---

## Demo accounts

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Patient | Aryan Mehta | `patient@demo.com` | `Demo@1234` |
| Patient | Priya Nair | `priya@demo.com` | `Demo@1234` |
| Doctor | Dr. Rohan Sharma | `doctor@demo.com` | `Demo@1234` |
| Doctor | Dr. Ananya Iyer | `ananya@demo.com` | `Demo@1234` |

These are also clickable shortcuts on the login screen. On first start the backend seeds
four users, ten records (nine for Aryan, one for Priya) and one pending access request —
and then **skips seeding on every later boot**. Anything you approve, revoke, add or
delete during a demo therefore persists across restarts, so the state you see on a second
run may differ from a clean first run.

To restore the original demo state, clear the seeded rows so the seeder runs again (it
only fires while the `users` table is empty).

---

## Notes and limitations

- Fictional data only; the field visit informed the problem statement, not any real
  patient records.
- Web only — responsive, but there is no native mobile application.
- Notifications are in-app; nothing is emailed.
- Configuration for the Supabase database and storage bucket lives in `backend/.env`
  (git-ignored) — see `backend/.env.example` for the variable names. This README
  deliberately explains the system rather than the setup procedure.
