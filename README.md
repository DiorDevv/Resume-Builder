# Resume Builder

O'zbekiston IT bozori uchun professional CV yaratuvchi platforma.

## Tez ishga tushirish

### 1. Environment variables

```bash
cp .env.example .env
```

### 2. Docker bilan ishga tushirish

```bash
docker compose up -d
```

Frontend: http://localhost:3000
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs

### 3. Lokal ishga tushirish (Dockersiz)

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Loyiha tuzilishi

```
resume-builder/
├── frontend/          # Next.js 14 (App Router)
├── backend/           # FastAPI
├── docker-compose.yml
└── .env.example
```

## Texnologiyalar

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI, SQLAlchemy async, PostgreSQL, Redis
- **Auth:** JWT (access + refresh tokens)
- **PDF:** Puppeteer

## Litsenziya

MIT
