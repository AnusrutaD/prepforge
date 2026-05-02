# PrepForge

> Adaptive DSA interview preparation platform. Your weaknesses, fixed first.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [C4 — System Context](#2-c4--system-context)
3. [C4 — Container Architecture](#3-c4--container-architecture)
4. [C4 — Backend Components](#4-c4--backend-components)
5. [Adaptive Engine Design](#5-adaptive-engine-design)
6. [Sequence Diagrams](#6-sequence-diagrams)
7. [Database Schema](#7-database-schema)
8. [Deployment Architecture](#8-deployment-architecture)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [AI Provider Strategy](#10-ai-provider-strategy)
11. [Local Development](#11-local-development)
12. [Sprint Plan](#12-sprint-plan)

---

## 1. System Overview

PrepForge solves a specific problem: developers grind hundreds of LeetCode problems randomly and still fail interviews. The root cause is not effort — it is lack of direction. PrepForge uses an adaptive engine to identify a user's weakest topic, select the right difficulty problem, and use AI coaching to accelerate improvement.

**Core differentiator:** Every competitor (LeetCode, AlgoExpert, NeetCode) is static — same problems, same order, for everyone. PrepForge is the only platform that adapts to each user individually.

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui | App Router, RSC, dark mode first |
| Backend | Python 3.12 + FastAPI | Async-native, AI ecosystem, less boilerplate |
| ORM | SQLAlchemy 2.0 async + Alembic | Type-safe, async, versioned migrations |
| Database | PostgreSQL 15 | Relational data + JSONB for problem content |
| Cache | Redis 7 | Hint caching (7d TTL), recommendation caching |
| Auth | Clerk | Zero auth infrastructure to build or maintain |
| AI (dev/beta) | Ollama — llama3.1 | Free, local, M-chip fast |
| AI (prod) | Claude Haiku | One env var switch at launch |
| Code Execution | Judge0 | Sandboxed multi-language execution |
| Deployment | Railway | Zero-ops, auto-deploys, managed PostgreSQL + Redis |
| CI/CD | GitHub Actions | Secrets scan → test → deploy pipeline |

---

## 2. C4 — System Context

> Who uses PrepForge and what external systems does it talk to?

```mermaid
C4Context
    title PrepForge — System Context

    Person(user, "Developer", "Preparing for product company DSA interviews")

    System(prepforge, "PrepForge", "Adaptive DSA interview preparation platform")

    System_Ext(clerk, "Clerk", "Authentication & user identity (Google OAuth + Email)")
    System_Ext(claude, "Anthropic Claude API", "AI coaching — hints & feedback (production)")
    System_Ext(ollama, "Ollama", "Local LLM inference — hints & feedback (dev/beta)")
    System_Ext(judge0, "Judge0", "Sandboxed code execution engine (multi-language)")
    System_Ext(railway, "Railway", "Cloud hosting — backend, frontend, DB, Redis")

    Rel(user, prepforge, "Solves problems, views progress, gets hints", "HTTPS")
    Rel(prepforge, clerk, "Verifies JWT, syncs user identity", "HTTPS / JWKS")
    Rel(prepforge, claude, "Generates hints & feedback (prod)", "HTTPS / REST")
    Rel(prepforge, ollama, "Generates hints & feedback (dev/beta)", "HTTP / REST")
    Rel(prepforge, judge0, "Executes user code against test cases", "HTTPS / REST")
    Rel(prepforge, railway, "Hosted on", "Infrastructure")
```

---

## 3. C4 — Container Architecture

> How is PrepForge decomposed into deployable units?

```mermaid
C4Container
    title PrepForge — Container Architecture

    Person(user, "Developer", "Browser on desktop")

    System_Boundary(prepforge, "PrepForge") {
        Container(frontend, "Frontend", "Next.js 14 / TypeScript", "Renders UI, handles auth redirect, manages client state via TanStack Query + Zustand")
        Container(backend, "Backend API", "Python 3.12 / FastAPI", "Business logic, adaptive engine, AI orchestration, JWT validation")
        Container(db, "PostgreSQL 15", "Database", "Users, problems, sessions, skill profiles, recommendations")
        Container(cache, "Redis 7", "Cache", "Hint cache (7d), recommendation cache (midnight TTL), feedback cache (24h)")
    }

    System_Ext(clerk, "Clerk", "Auth provider — issues JWTs")
    System_Ext(ai, "AI Provider", "Ollama (dev) or Claude Haiku (prod)")
    System_Ext(judge0, "Judge0", "Code execution")

    Rel(user, frontend, "Uses", "HTTPS :443")
    Rel(frontend, backend, "API calls with Clerk JWT", "HTTPS /api/v1/")
    Rel(frontend, clerk, "Auth redirects + token refresh", "HTTPS")
    Rel(backend, db, "Reads/writes", "asyncpg :5432")
    Rel(backend, cache, "Cache get/set", "redis-py :6379")
    Rel(backend, ai, "Prompt → completion", "HTTP")
    Rel(backend, judge0, "Submit code → test results", "HTTPS")
    Rel(backend, clerk, "Verify JWT via JWKS", "HTTPS")
```

---

## 4. C4 — Backend Components

> How is the FastAPI backend internally structured?

```mermaid
C4Component
    title PrepForge Backend — Component Architecture

    Container_Boundary(api, "API Layer (app/api/v1/)") {
        Component(router, "API Router", "FastAPI APIRouter", "Routes: auth, users, diagnostic, dashboard, problems, sessions, execute, hints, feedback, progress")
        Component(deps, "Dependencies (deps.py)", "FastAPI Depends", "get_current_user, get_db, get_redis — injected into every protected route")
        Component(auth_mw, "Auth Middleware", "python-jose + Clerk JWKS", "Validates JWT, gets-or-creates user in DB on every request")
        Component(err_mw, "Error Handler", "FastAPI exception_handler", "Maps PrepForgeException hierarchy → standardised ApiResponse error codes")
    }

    Container_Boundary(core, "Core Domain (app/services/)") {
        Component(user_svc, "UserService", "Python class", "User sync, profile management, preferences")
        Component(session_svc, "SessionService", "Python class", "Session lifecycle: create, auto-save, submit")
        Component(skill_svc, "SkillService", "Python class", "Skill profile CRUD, score history")
        Component(diag_svc, "DiagnosticService", "Python class", "Diagnostic evaluation, initial skill score seeding")
        Component(rec_svc, "RecommendationService", "Python class", "Daily recommendation, swap logic")
    }

    Container_Boundary(adaptive, "Adaptive Engine (app/adaptive/)") {
        Component(engine, "AdaptiveEngine", "Python class", "Orchestrates: find weakest topic → resolve difficulty → select problem")
        Component(scorer, "ScoreCalculator", "Python class", "EMA-smoothed score delta: difficulty × hint multiplier, capped ±15pts")
        Component(selector, "ProblemSelector", "Python class", "Queries DB for unseen problems matching topic + difficulty")
    }

    Container_Boundary(ai_layer, "AI Layer (app/ai/)") {
        Component(ai_svc, "AIService", "Python class", "Provider router: _call_ai() → Claude or Ollama based on AI_PROVIDER env var")
        Component(prompt_builder, "PromptBuilder", "Python class", "Loads versioned .txt templates from /prompts/ — never hardcoded")
        Component(ai_cache, "AIResponseCache", "Redis wrapper", "Hint cache key: hint:{problemId}:{level}, TTL 7 days")
    }

    Container_Boundary(module, "Module Plugin System (app/module/)") {
        Component(registry, "ModuleRegistry", "Singleton", "Holds all active module implementations")
        Component(interface, "PrepModuleInterface", "Python ABC", "Contract: get_next_challenge(), evaluate_performance()")
        Component(dsa_mod, "DSAModule", "Implements interface", "DSA-specific problem selection + performance scoring")
    }

    Rel(router, deps, "Injects", "Depends()")
    Rel(deps, auth_mw, "Calls", "get_current_user()")
    Rel(router, user_svc, "Delegates to")
    Rel(router, session_svc, "Delegates to")
    Rel(session_svc, engine, "Calls after submit")
    Rel(rec_svc, engine, "Calls for daily recommendation")
    Rel(engine, scorer, "Computes delta")
    Rel(engine, selector, "Picks problem")
    Rel(engine, registry, "Gets module")
    Rel(registry, dsa_mod, "Returns")
    Rel(dsa_mod, interface, "Implements")
    Rel(router, ai_svc, "Calls for hints + feedback")
    Rel(ai_svc, prompt_builder, "Builds prompts")
    Rel(ai_svc, ai_cache, "Check cache before AI call")
```

---

## 5. Adaptive Engine Design

> The core intelligence — how PrepForge decides what to show each user.

```mermaid
flowchart TD
    A([User requests daily recommendation]) --> B[(Load all topic skill scores\nfor this user from DB)]
    B --> C{Find weakest topic\nmin score across all topics}
    C --> D{Map score → difficulty}
    D -- score < 40 --> E[EASY]
    D -- 40 ≤ score < 75 --> F[MEDIUM]
    D -- score ≥ 75 --> G[HARD]
    E --> H[(Query: find unseen problem\nin weakest topic at difficulty)]
    F --> H
    G --> H
    H --> I{Problem found?}
    I -- Yes --> J[Return recommendation\nCache until midnight IST]
    I -- No problems left\nin this difficulty --> K[Bump difficulty up one level\nand retry]
    K --> H

    subgraph "Score Update — after session submit"
        L([Session submitted]) --> M{Status?}
        M -- SOLVED --> N[base_delta = difficulty × hint_multiplier\nBonus +2 if under 80% estimated time]
        M -- FAILED --> O[delta = -1.0]
        M -- GAVE_UP --> P[delta = -2.0]
        N --> Q[Apply EMA smoothing\nnew = 0.3 × raw + 0.7 × current\nClamp result to 0–100]
        O --> Q
        P --> Q
        Q --> R[(Persist to user_skill_profile\nInsert row in skill_score_history)]
        R --> S([Recommendation cache invalidated\nNext request gets fresh problem])
    end
```

### Score Formula

```
BASE_DELTA  =  EASY: 8.0  |  MEDIUM: 12.0  |  HARD: 16.0

HINT_MULTIPLIER  =  0 hints: 1.0  |  1 hint: 0.6  |  2 hints: 0.4  |  3 hints: 0.2

raw_delta    =  BASE_DELTA × HINT_MULTIPLIER  (+2.0 speed bonus if applicable)
delta        =  min(raw_delta, 15.0)                    ← hard cap per session
new_score    =  clamp(0.3 × (current + delta) + 0.7 × current, 0, 100)   ← EMA α=0.3
```

---

## 6. Sequence Diagrams

### 6.1 User Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend (Next.js)
    participant CK as Clerk
    participant BE as Backend (FastAPI)
    participant DB as PostgreSQL

    U->>FE: Click "Sign in with Google"
    FE->>CK: Redirect to Clerk OAuth
    CK->>U: Google consent screen
    U->>CK: Grant consent
    CK->>FE: Redirect back with session + JWT
    FE->>FE: Store JWT in memory

    FE->>BE: POST /api/v1/auth/sync\n{clerkId, email} + Bearer JWT
    BE->>CK: GET /.well-known/jwks.json (cached)
    CK-->>BE: Public keys for RS256 verification
    BE->>BE: Verify JWT signature + extract sub, email
    BE->>DB: SELECT * FROM users WHERE clerk_id = ?
    alt First login
        DB-->>BE: NULL
        BE->>DB: INSERT INTO users (clerk_id, email, ...)
        DB-->>BE: New user row
        BE-->>FE: {onboardingDone: false}
        FE->>U: Redirect → /onboarding
    else Returning user
        DB-->>BE: Existing user row
        BE-->>FE: {onboardingDone: true}
        FE->>U: Redirect → /dashboard
    end
```

---

### 6.2 Daily Problem Recommendation Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant BE as Backend
    participant RD as Redis
    participant DB as PostgreSQL
    participant AE as AdaptiveEngine

    U->>FE: Opens /dashboard
    FE->>BE: GET /api/v1/dashboard\nAuthorization: Bearer JWT

    BE->>RD: GET rec:{userId}:{today}
    alt Cache HIT (same day)
        RD-->>BE: Cached recommendation
    else Cache MISS
        BE->>DB: SELECT skill profiles for user
        DB-->>BE: [{topic_id, score}, ...]
        BE->>AE: get_recommendation(userId, completedIds)
        AE->>AE: Find min(score) → weakest topic
        AE->>AE: Map score → difficulty (EASY/MEDIUM/HARD)
        AE->>DB: SELECT problem WHERE topic=? AND difficulty=?\nAND id NOT IN completedIds LIMIT 1
        DB-->>AE: Problem row
        AE-->>BE: Recommended problem
        BE->>RD: SET rec:{userId}:{today} EX {seconds_until_midnight}
    end

    BE->>DB: Aggregate streak, weekly stats, recent sessions
    DB-->>BE: Dashboard data
    BE-->>FE: ApiResponse{dashboard + recommendation}
    FE->>U: Render dashboard with today's problem card
```

---

### 6.3 Problem Solving — Full Loop

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant BE as Backend
    participant J0 as Judge0
    participant DB as PostgreSQL
    participant AE as AdaptiveEngine

    U->>FE: Click "Start Problem"
    FE->>BE: POST /api/v1/sessions\n{problemId, language}
    BE->>DB: INSERT problem_sessions (status=IN_PROGRESS)
    DB-->>BE: {sessionId}
    BE-->>FE: {sessionId}

    loop Auto-save every 30s
        FE->>BE: PATCH /api/v1/sessions/{id}\n{currentCode}
        BE->>DB: UPDATE current_code, last_saved_at
    end

    U->>FE: Click "Run" (test run)
    FE->>BE: POST /api/v1/execute\n{sessionId, code, language}
    BE->>J0: Submit code + visible test cases
    J0-->>BE: {results: [{passed, actual, expected, runtimeMs}]}
    BE-->>FE: Test results
    FE->>U: Show pass/fail per test case

    U->>FE: Click "Submit"
    FE->>BE: POST /api/v1/sessions/{id}/submit\n{finalCode, language}
    BE->>J0: Submit code + ALL test cases (including hidden)
    J0-->>BE: Full test results
    BE->>DB: UPDATE sessions SET status=SOLVED|FAILED, final_code
    BE->>AE: update_skill_profile(userId, topicId, result)
    AE->>AE: compute_delta() → apply EMA → clamp 0-100
    AE->>DB: UPDATE user_skill_profile\nINSERT skill_score_history
    BE->>BE: Trigger async feedback generation
    BE-->>FE: {status, scoreDelta, newTopicScore, feedbackPending:true}
    FE->>U: Show score update + "Feedback generating..."
```

---

### 6.4 Hint Generation with Cache

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant BE as Backend
    participant RD as Redis
    participant AI as AI Service (Ollama/Claude)
    participant DB as PostgreSQL

    U->>FE: Click "Get Hint" (Level 1)
    FE->>BE: POST /api/v1/hints\n{sessionId, currentCode, requestedLevel: 1}

    BE->>DB: Verify session belongs to current user
    DB-->>BE: session + problem data

    BE->>RD: GET hint:{problemId}:1
    alt Cache HIT (hint already generated before)
        RD-->>BE: Cached hint text
        BE-->>FE: {content, source:"CACHE", hintsRemaining:2}
        Note over RD,BE: ~1ms response — no AI call needed
    else Cache MISS (first time this hint requested)
        BE->>AI: build_hint_prompt(problem, userCode, level=1)
        AI-->>BE: hint text response
        BE->>BE: contains_code() check
        alt AI returned code in hint (rule violation)
            BE->>AI: Retry with stricter no-code prompt
            AI-->>BE: Cleaned hint
            alt Still contains code
                BE->>DB: GET fallback hint from problems.hints JSONB
                DB-->>BE: Fallback hint text
                BE-->>FE: {content, source:"FALLBACK"}
            end
        end
        BE->>RD: SETEX hint:{problemId}:1 604800 {hint}
        BE->>DB: UPDATE sessions SET hints_used = hints_used + 1
        BE-->>FE: {content, source:"AI", hintsRemaining:2}
    end

    FE->>U: Reveal hint panel with content
```

---

## 7. Database Schema

```mermaid
erDiagram
    MODULES {
        varchar id PK
        varchar name
        boolean is_active
        timestamptz created_at
    }

    TOPICS {
        uuid id PK
        varchar module_id FK
        varchar name
        varchar slug
        int display_order
    }

    PROBLEMS {
        uuid id PK
        varchar module_id FK
        uuid topic_id FK
        varchar title
        varchar difficulty
        text description
        jsonb examples
        jsonb test_cases
        jsonb hints
        jsonb starter_code
        jsonb solution
        varchar[] patterns
        int estimated_minutes
        boolean is_active
        timestamptz created_at
    }

    USERS {
        uuid id PK
        varchar clerk_id UK
        varchar email UK
        varchar display_name
        varchar preferred_language
        date target_date
        boolean onboarding_done
        boolean diagnostic_done
        boolean email_reminder
        time reminder_time
        timestamptz created_at
        timestamptz updated_at
    }

    USER_SKILL_PROFILE {
        uuid user_id PK,FK
        uuid topic_id PK,FK
        decimal score
        int problems_attempted
        int problems_solved
        timestamptz last_updated
    }

    SKILL_SCORE_HISTORY {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        decimal score
        decimal delta
        timestamptz recorded_at
    }

    PROBLEM_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        varchar language
        text current_code
        text final_code
        varchar status
        int hints_used
        decimal score_delta
        text ai_feedback
        timestamptz started_at
        timestamptz completed_at
        timestamptz last_saved_at
    }

    RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        date recommended_date
        boolean was_attempted
        int swaps_used
        timestamptz created_at
    }

    MODULES ||--o{ TOPICS : "has"
    MODULES ||--o{ PROBLEMS : "contains"
    TOPICS ||--o{ PROBLEMS : "categorises"
    TOPICS ||--o{ USER_SKILL_PROFILE : "scored in"
    TOPICS ||--o{ SKILL_SCORE_HISTORY : "tracks"
    USERS ||--o{ USER_SKILL_PROFILE : "has"
    USERS ||--o{ SKILL_SCORE_HISTORY : "accumulates"
    USERS ||--o{ PROBLEM_SESSIONS : "creates"
    USERS ||--o{ RECOMMENDATIONS : "receives"
    PROBLEMS ||--o{ PROBLEM_SESSIONS : "used in"
    PROBLEMS ||--o{ RECOMMENDATIONS : "recommended as"
```

---

## 8. Deployment Architecture

```mermaid
flowchart TD
    subgraph "User's Browser"
        BR([Browser])
    end

    subgraph "Railway — Production"
        FE["prepforge-frontend\nNext.js 14\n(Railway Service)"]
        BE["prepforge-backend\nFastAPI + Uvicorn\n(Railway Service)"]
        PG[("prepforge-db\nPostgreSQL 15\n(Railway Plugin)")]
        RD[("prepforge-redis\nRedis 7\n(Railway Plugin)")]
        OL["prepforge-ollama\nOllama llama3.1\n(Railway Service — beta only)"]
    end

    subgraph "External Services"
        CK["Clerk\nAuth + JWKS"]
        AI["Claude Haiku\n(Anthropic API)\n— production only"]
        J0["Judge0\n(RapidAPI)\nCode execution"]
        GH["GitHub\nSource of truth"]
        GA["GitHub Actions\nCI/CD"]
    end

    BR -- "HTTPS prepforge.com" --> FE
    BR -- "HTTPS clerk.com OAuth" --> CK
    FE -- "HTTPS api.prepforge.com" --> BE
    BE -- "asyncpg :5432" --> PG
    BE -- "redis-py :6379" --> RD
    BE -- "JWKS verification" --> CK
    BE -- "HTTP internal:11434 (beta)" --> OL
    BE -- "HTTPS api.anthropic.com (prod)" --> AI
    BE -- "HTTPS rapidapi.com" --> J0
    GH -- "push to main" --> GA
    GA -- "railway up" --> FE
    GA -- "railway up" --> BE
```

### Railway Services Overview

| Service | Type | Role |
|---|---|---|
| `prepforge-frontend` | GitHub deploy | Next.js app |
| `prepforge-backend` | Dockerfile deploy | FastAPI API |
| `prepforge-db` | Railway Plugin | PostgreSQL 15 — managed |
| `prepforge-redis` | Railway Plugin | Redis 7 — managed |
| `prepforge-ollama` | Dockerfile deploy | Ollama (beta only, decommissioned at launch) |

---

## 9. CI/CD Pipeline

```mermaid
flowchart LR
    A([git push / PR]) --> B

    subgraph "GitHub Actions"
        B["🔐 secrets-scan\nGitleaks — scans full git history\nBlocks all downstream if secrets found"]
        B --> C & D

        C["🐍 backend-ci\nruff lint\npytest tests/\n(with real PG + Redis services)"]
        D["⚛️ frontend-ci\ntsc --noEmit\npnpm build"]

        C --> E
        D --> E

        E{"main branch\nonly?"}
        E -- Yes --> F["🚀 deploy\nrailway up backend\nrailway up frontend"]
        E -- No PR --> G([Pipeline complete\nNo deploy])
    end

    F --> H([Live on Railway])
```

**Security gate:** `secrets-scan` runs first. If any API key, credential, or private key is detected in the commit or git history, the entire pipeline fails immediately. `backend-ci`, `frontend-ci`, and `deploy` all have `needs: [secrets-scan]` — nothing runs until the scan passes.

**Local gate:** `pre-commit` hooks run on every `git commit` before code ever reaches GitHub — gitleaks, ruff lint, YAML validation, private key detection.

---

## 10. AI Provider Strategy

```mermaid
flowchart LR
    subgraph "AIService._call_ai()"
        R{AI_PROVIDER\nenv var}
        R -- ollama --> O["_call_ollama()\nhttpx → localhost:11434\nllama3.1 model\nFree"]
        R -- claude --> C["_call_claude()\nanthropic SDK\nclaude-haiku-4-5\n~$0.003/hint"]
    end

    subgraph "Phase Strategy"
        D["Development\nOllama local\n$0/month"]
        B["Beta — 20 free users\nOllama on Railway\n$0/month"]
        L["Launch — paying users\nClaude Haiku\n~$5-8/month\ncovered by first subscriber"]
    end

    D --> R
    B --> R
    L --> R
```

Switch at launch — **one environment variable, zero code change:**

```bash
# Beta
AI_PROVIDER=ollama
OLLAMA_URL=http://prepforge-ollama.railway.internal:11434

# Launch (update in Railway dashboard → auto redeploy)
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-production-key
```

---

## 11. Local Development

### Prerequisites
```bash
# Install tools (macOS)
brew install git node python@3.12 docker ollama pnpm railway
```

### Start Infrastructure
```bash
docker-compose up -d        # PostgreSQL :5432 + Redis :6379
ollama serve                # AI inference :11434
ollama pull llama3.1        # One-time model download (~4.7GB)
```

### Backend
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # Fill in Clerk JWKS URL
pytest tests/ -v            # Must pass before proceeding
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/api/v1/health
- API docs: http://localhost:8000/api-docs

### Frontend
```bash
cd frontend
pnpm install
cp .env.local.example .env.local   # Fill in Clerk publishable key
pnpm dev                           # http://localhost:3000
```

### Security Hooks (one-time setup)
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files          # Verify clean before first commit
```

---

## 12. Sprint Plan

| Sprint | Goal | Deliverable | Status |
|---|---|---|---|
| 0 | Scaffold + CI/CD | Working skeleton, pipeline green, first deploy | ✅ Done |
| 1 | Auth + Onboarding | Sign up → onboarding → profile saved in DB | 🔄 Next |
| 2 | Diagnostic + Skill Profile | Complete diagnostic → personalised skill scores | ⏳ |
| 3 | Core Problem Loop | Recommendation → solve → submit → score updated | ⏳ |
| 4 | Hints + Progress | Hints with cache, progress page, streak | ⏳ |
| 5 | Polish + Beta Prep | Error states, 100 problems seeded, Ollama on Railway | ⏳ |
| 6 | Beta + Payments | 20 users, Razorpay integration, first ₹499 payment | ⏳ |
| Launch | Go live | AI_PROVIDER=claude, custom domains, LinkedIn post | ⏳ |

---

*PrepForge v1.0 — Built in public*
*Solo founder: Anusruta Dutta*
