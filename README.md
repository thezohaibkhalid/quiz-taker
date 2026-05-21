# Online Quiz Management System

Cloud-based quiz platform built end-to-end in **Next.js** (App Router) per the project requirements document.

> Teachers create timed quizzes → students attempt them in a browser → objective answers are auto-evaluated → results are stored in MongoDB → teachers announce results → students get an email + see their score on the dashboard.

---

## Tech stack

| Layer       | Technology |
|-------------|------------|
| Framework   | Next.js 14 (App Router) — frontend **and** API routes in one app |
| Database    | MongoDB Atlas (Mongoose ODM) |
| Auth        | JWT (`jsonwebtoken` + `jose`) with bcrypt password hashing, HTTP-only cookies |
| File storage| **Cloudinary** (overrides AWS S3 in the spec) |
| Email       | **Gmail SMTP via Nodemailer** with App Passwords (overrides AWS SES) |
| UI          | Tailwind CSS + Framer Motion + Chart.js |
| Container   | Docker (multi-stage build, non-root) |
| CI/CD       | GitHub Actions — staging-only pipeline |

## Features (mapped to PDF modules)

- **7.1 Auth & Authorization** — register, JWT login, email verification, password reset, role-based access (`student`, `teacher`, `admin`).
- **7.2 Quiz Management** — create / edit / delete quizzes, MCQ + true/false + short-answer questions, schedule with start/end time, publish/unpublish.
- **7.3 Attempts & Auto-Evaluation** — server-side timer validation, single-attempt rule, auto-scoring of objective answers on submit.
- **7.4 Result Announcement** — pending → announce workflow, bulk announce, stamped timestamps, push to student dashboard.
- **7.5 Email Notifications** — welcome / verify, password reset, quiz invitation, result announcement (all via Gmail SMTP).
- **7.6 Dashboards & Analytics** — student trend chart, teacher per-quiz averages, admin overview with role split.
- **7.7 Admin Management** — full user CRUD, role changes, activate/deactivate, subject management, audit log viewer.

---

## Quick start (local dev)

```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env.local
# edit MONGODB_URI, JWT_SECRET, SMTP_*, CLOUDINARY_*

# 3. Run dev server
npm run dev
```

Open `http://localhost:3000`. On first start the system auto-creates an admin account using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`.

### Setting up the integrations

**Gmail SMTP (App Password)**
1. Enable 2-factor auth on your Google account.
2. Visit https://myaccount.google.com/apppasswords and generate a 16-char App Password.
3. Put it in `SMTP_PASS`. Use your Gmail address for `SMTP_USER` and `SMTP_FROM_EMAIL`.

**Cloudinary**
1. Sign up at https://cloudinary.com.
2. Copy the cloud name, API key, and API secret from the dashboard.
3. Paste into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

**MongoDB Atlas**
1. Create a free cluster, add your IP / `0.0.0.0/0` to the network access list.
2. Create a database user.
3. Use the `mongodb+srv://…` connection string in `MONGODB_URI`.

---

## API endpoints

All API routes live under `/api/*` (Next.js Route Handlers):

| Module           | Endpoint                                        |
|------------------|-------------------------------------------------|
| Auth             | `POST /api/auth/register`                       |
|                  | `POST /api/auth/login`                          |
|                  | `POST /api/auth/logout`                         |
|                  | `GET  /api/auth/me`                             |
|                  | `GET  /api/auth/verify-email?token=…`           |
|                  | `POST /api/auth/forgot-password`                |
|                  | `POST /api/auth/reset-password`                 |
| Quizzes          | `GET  /api/quizzes?scope=active\|upcoming\|all` |
|                  | `POST /api/quizzes`                             |
|                  | `GET/PATCH/DELETE /api/quizzes/[id]`            |
|                  | `POST /api/quizzes/[id]/publish`                |
|                  | `GET/POST/DELETE /api/quizzes/[id]/questions`   |
| Attempts         | `POST /api/attempts/start`                      |
|                  | `POST /api/attempts/submit`                     |
|                  | `GET  /api/attempts/[id]`                       |
| Results          | `GET  /api/results/me` (student)                |
|                  | `GET  /api/results/quiz/[id]` (teacher/admin)   |
|                  | `POST /api/results/announce`                    |
|                  | `POST /api/results/grade`                       |
| Subjects         | `GET/POST /api/subjects`                        |
|                  | `DELETE /api/subjects/[id]`                     |
| Users (admin)    | `GET/POST /api/users`                           |
|                  | `PATCH/DELETE /api/users/[id]`                  |
| Analytics        | `GET /api/analytics` (returns role-specific)    |
| Audit            | `GET /api/audit?action=…` (admin)               |
| Upload           | `POST /api/upload` (multipart, Cloudinary)      |
| Health           | `GET /api/health`                               |

---

## Database design (matches the PDF ERD)

- `users` — name, email, password_hash, role, is_verified, is_active
- `subjects` — name, code, description
- `quizzes` — title, subject_id, duration_minutes, total_marks, start_time, end_time, is_published, results_announced
- `questions` — quiz_id, question_text, type (mcq/true_false/short), options, correct_option, marks
- `attempts` — student_id, quiz_id, answers[], started_at, submitted_at, is_completed
- `results` — attempt_id, quiz_id, total_marks, obtained_marks, percentage, status, announced, announced_at
- `notifications` — user_id, type, channel, status
- `audit_logs` — user_id, action, entity_type, entity_id, ip_address, timestamp

---

## Staging deployment

Staging deployment is fully automated via **GitHub Actions** and runs only on the `staging` branch.

### One-time setup on the staging VM

```bash
# On the staging VM (Ubuntu)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo mkdir -p /opt/quiz-system && sudo chown $USER /opt/quiz-system
cd /opt/quiz-system
git clone https://github.com/thezohaibkhalid/quiz-taker.git .
git checkout -b staging
```

You do **not** need to create `.env.staging` on the VM — the pipeline writes it on every deploy from the `STAGING_ENV_BLOB` secret (see below).

### GitHub repo secrets to configure

| Secret                | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `STAGING_HOST`        | Staging server IP or DNS                                                    |
| `STAGING_USER`        | SSH user (e.g. `ubuntu`)                                                    |
| `STAGING_SSH_KEY`     | Private key (PEM) for SSH                                                   |
| `STAGING_SSH_PORT`    | Optional, defaults to 22                                                    |
| `STAGING_ENV_BLOB`    | Full contents of `.env.staging` pasted as one multi-line secret value       |

### Pipeline behavior

Pushing to the `staging` branch (or manual `workflow_dispatch`) will:

1. **Build** — install, lint, `next build` (fails fast on errors).
2. **Image** — build Docker image with `Dockerfile` (multi-stage, non-root).
3. **Push** — push to GitHub Container Registry as `ghcr.io/<repo>:staging-<sha>` and `:staging`.
4. **Deploy** — SSH into staging host → `git pull` → write `.env.staging` from `STAGING_ENV_BLOB` → `docker compose pull && up -d`.
5. **Health check** — `curl /api/health` with up to 5 retries; rolls back on failure.

See `.github/workflows/deploy-staging.yml`.

---

## File layout

```
.
├── Dockerfile                       # Staging Docker image (multi-stage)
├── docker-compose.staging.yml       # Staging compose file (run on the VM)
├── .env.staging.example             # Template for staging env vars
├── .github/workflows/deploy-staging.yml
├── next.config.js
├── package.json
├── public/
└── src/
    ├── app/
    │   ├── layout.js / page.js         # Landing
    │   ├── (auth pages)/               # login, register, verify-email, ...
    │   ├── student/                    # student dashboard, quizzes, results, quiz attempt
    │   ├── teacher/                    # teacher dashboard, quizzes, subjects
    │   ├── admin/                      # admin overview, users, subjects, logs
    │   └── api/                        # all REST endpoints
    ├── components/                     # DashboardShell, AuthShell, StatCard, charts, motion helpers
    ├── lib/                            # db, auth, email, cloudinary, audit, validate, bootstrap
    ├── models/                         # Mongoose schemas (User, Quiz, Question, Attempt, Result, Subject, Notification, AuditLog)
    └── middleware.js                   # JWT + role-based route protection
```

---

## Author

Built for the Cloud Computing course project at **The University of Faisalabad** by:

- Zohaib Khalid — 2022-BS-SE-108

Submitted to Sir Ibrar.
# quiz-taker
