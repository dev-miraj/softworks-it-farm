# SOFTWORKS IT FARM

Premium tech studio platform — full-stack web application with admin CMS, HR management, and License Management System.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/dev-miraj/softworks-it-farm.git
cd softworks-it-farm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example artifacts/api-server/.env
# Edit artifacts/api-server/.env and add your DATABASE_URL

# 4. Start development servers (API + Web together)
npm run dev
```

> **Note:** This project uses pnpm workspaces internally.
> Running `npm install` will automatically trigger pnpm to install all workspace packages.
> If pnpm is not installed, run `npm install -g pnpm` first.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API server + frontend together |
| `npm run dev:api` | Start API server only (port 8080) |
| `npm run dev:web` | Start frontend only |
| `npm run build` | Build both API and frontend for production |
| `npm run build:api` | Build API server only |
| `npm run build:web` | Build frontend only |

## URLs

- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:8080
- **Admin Panel**: http://localhost:5173/admin
- **Production**: https://softworksit.vercel.app

## Admin Access

- URL: `/admin`
- Username: `admin`
- Password: `Softworks@2024`

## Environment Variables

Copy `.env.example` to `artifacts/api-server/.env` and fill in the values:

```env
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-endpoint.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
PORT=8080
SESSION_SECRET=your-secret-here
NODE_ENV=development
```

Both localhost and production (Vercel) use the same Neon PostgreSQL database.
For Vercel, set `DATABASE_URL` in Vercel Dashboard > Settings > Environment Variables.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Radix UI
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Deployment**: Vercel
- **Package Manager**: pnpm workspaces
