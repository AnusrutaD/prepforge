# PrepForge

Adaptive DSA interview preparation platform. Your weaknesses, fixed first.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | Clerk |
| AI (dev/beta) | Ollama (llama3.1) — free, local |
| AI (production) | Claude Haiku — switch via env var |
| Deployment | Railway |
| CI/CD | GitHub Actions |

## Local Development

### Prerequisites
- Python 3.12, Node 20+, pnpm, Docker Desktop running

### Start Infrastructure
```bash
docker-compose up -d
```

### Backend
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
pytest tests/ -v       # must pass before proceeding
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/api/v1/health
API docs: http://localhost:8000/api-docs

### Frontend
```bash
cd frontend
pnpm install
cp .env.local.example .env.local   # fill in Clerk keys
pnpm dev
```

App: http://localhost:3000

### AI Setup (Ollama)
```bash
brew install ollama
ollama pull llama3.1
ollama serve
```

## Switching AI Provider at Launch

Change two env vars in Railway — zero code change required:

```bash
# Beta (current)
AI_PROVIDER=ollama
OLLAMA_URL=http://prepforge-ollama.railway.internal:11434

# Production launch (when users are paying)
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-production-key
```

## Project Structure

```
prepforge/
├── .github/workflows/ci.yml   # CI/CD pipeline
├── backend/                   # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/v1/            # Route handlers
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── schemas/           # Pydantic DTOs
│   │   ├── services/          # Business logic
│   │   ├── adaptive/          # Score engine
│   │   ├── ai/                # AI provider abstraction
│   │   ├── middleware/        # Auth + error handling
│   │   └── db/                # DB + Redis connections
│   ├── alembic/               # DB migrations
│   ├── prompts/               # AI prompt templates
│   └── tests/
├── frontend/                  # Next.js app
└── docker-compose.yml         # Local PostgreSQL + Redis
```

## Sprint Plan

| Sprint | Goal | Status |
|---|---|---|
| 0 | Scaffold + CI/CD | ✅ Done |
| 1 | Auth + Onboarding | 🔄 Next |
| 2 | Diagnostic + Skill Profile | ⏳ |
| 3 | Core Problem Loop | ⏳ |
| 4 | Hints + Progress | ⏳ |
| 5 | Polish + Beta Prep | ⏳ |
| 6 | Beta Feedback + Payments | ⏳ |

## Deployment

Hosted on Railway. Four services: `prepforge-backend`, `prepforge-frontend`, `prepforge-db` (PostgreSQL), `prepforge-redis`.

Auto-deploys on every push to `main` after CI passes.
