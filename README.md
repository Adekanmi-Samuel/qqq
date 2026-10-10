# SchoolHub 🇳🇬

**Where Nigerian schools grow.**

SchoolHub is a Nigerian-focused school management and educational platform where schools register, manage their operations, and deliver education digitally. From nursery to senior secondary — serving private and government schools across Nigeria.

## Architecture

```
schoolhub/
├── frontend/          # Next.js 16 — Web application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   └── lib/       # Utilities and configuration
│   └── ...
├── backend/           # Express.js — REST API
│   ├── src/
│   │   ├── controllers/  # HTTP request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/       # Route definitions
│   │   ├── services/     # Business logic
│   │   └── lib/          # Database and shared utilities
│   └── ...
└── package.json       # Root workspace scripts
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 | Web application |
| Styling | Tailwind CSS 4 | Utility-first styling |
| Backend | Express.js 5 + TypeScript | REST API |
| Database | PostgreSQL + Prisma | Data persistence |
| Auth | Supabase Auth + JWT | Authentication |
| SMS | Termii API | Nigerian SMS delivery |
| Email | Resend | Transactional emails |
| Payments | Paystack | Fee collection (Phase 3) |
| Storage | Cloudinary | File uploads |
| Analytics | PostHog | Product analytics |

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** >= 10

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> schoolhub
cd schoolhub
npm install
```

### 2. Set up environment variables

**Backend** — copy and fill in:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `FRONTEND_URL` | Frontend URL (default: http://localhost:3000) |
| `PORT` | API port (default: 4000) |
| `TERMII_API_KEY` | Termii SMS API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Frontend** — copy and fill in:

```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # (optional) Seed with sample data
```

### 4. Start development

```bash
npm run dev
```

This starts both:
- **API** → http://localhost:4000
- **Web** → http://localhost:3000

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in dev mode |
| `npm run dev:api` | Start backend only |
| `npm run dev:web` | Start frontend only |
| `npm run build` | Build both projects |
| `npm run lint` | Lint frontend |
| `npm run clean` | Remove all node_modules and build outputs |
| `npm run db:migrate` | Run Prisma migrations |

## Features by Phase

### Phase 1 — Foundation & MVP (Current)
- ✅ School registration & verification
- ✅ Student & class management
- ✅ Attendance tracking
- ✅ Basic notice board
- ⬜ Admin dashboard (basic)
- ⬜ Public school profile pages

### Phase 2 — Academic Core (Next)
- Result & grade management
- Report card generator
- Timetable builder
- Parent portal (phone + OTP login)
- Staff management
- SMS/WhatsApp notifications
- Offline result entry

### Phase 3 — Fees & Finance
- Online fee collection via Paystack
- Fee structure management
- Outstanding fee tracking
- Financial dashboard
- Basic payroll

### Phase 4 — Learning & Content
- CBT exam engine
- JAMB/WAEC past question library
- Lesson note & material upload
- Student Android app
- Assignment management

### Phase 5 — Scale & Ecosystem
- Teacher marketplace
- School supply marketplace
- Government/SUBEB reporting
- Public API
- National school directory

## Project Conventions

- **Language**: TypeScript throughout
- **Date format**: DD/MM/YYYY (Nigerian)
- **Currency**: Nigerian Naira (₦)
- **Phone**: Nigerian format (+234/0)
- **Timezone**: WAT (UTC+1)
- **Design**: Mobile-first, works on 320px screens
- **SMS**: All via Termii with sender ID "SchoolHub"

## Brand

- **Colors**: Deep green (#0B6E4F) primary, Amber (#F59E0B) accent
- **Tagline**: "Where Nigerian schools grow"
- **Tone**: Direct, plain Nigerian-friendly English

## License

Private — SchoolHub Ltd.
