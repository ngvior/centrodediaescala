# Centro de Día Escala

Website and admin back office for [Centro de Día Escala](https://centrodediaescala.org).

- **Public site:** home page with the center description, objectives, activities, professionals, gallery and contact data. Visitors can send an interview request.
- **Admin panel (`/admin`):** one administrator edits the site content, the gallery and the site settings, and reads the interview requests.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Server Actions) and React 19
- [Supabase](https://supabase.com): Postgres with Row Level Security, Auth and Storage
- Tailwind CSS 4 and shadcn/ui
- Vitest
- Deploy on [Vercel](https://vercel.com)

## Local setup

Requirements: Node.js 20.9 or later, npm, and a Supabase project.

```bash
npm install
cp .env.example .env.local   # then set the values
npm run dev
```

Open <http://localhost:3000>. The admin login is at <http://localhost:3000/admin/login>.

To prepare a new Supabase project, run `supabase/schema.sql` in the SQL editor. `supabase/seed.sql` gives sample content for a local or test project only. Do not run it on production. Refer to `docs/DEPLOY_GUIDE.md` for the full procedure.

## Environment variables

| Name | Scope | Purpose |
|------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase public key. RLS controls what it can read. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin writes and protected inserts |
| `ADMIN_EMAIL` | Server | Email of the only account that can use the admin panel |
| `RATE_LIMIT_SECRET` | Server | HMAC key to hash visitor IPs for the rate limit |
| `INTERVIEW_RATE_LIMIT_MAX` | Server, optional | Maximum interview requests in one window |
| `INTERVIEW_RATE_LIMIT_WINDOW_MINUTES` | Server, optional | Length of the rate limit window |

Do not give a server variable a `NEXT_PUBLIC_` prefix. Next.js puts `NEXT_PUBLIC_` values in the browser bundle.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start the development server (webpack) |
| `npm run dev:turbo` | Start the development server (Turbopack) |
| `npm run build` | Make a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite |

## Deploy

Vercel builds and deploys each push to `master`. Set the environment variables in the Vercel project settings. The Supabase settings, the admin account setup and the checks to do before you connect the domain are in [`docs/DEPLOY_GUIDE.md`](docs/DEPLOY_GUIDE.md).

## Documentation

- [`docs/PRD.md`](docs/PRD.md): product requirements
- [`docs/CMS_ESTRUCTURA.md`](docs/CMS_ESTRUCTURA.md): content model and site settings
- [`docs/DEPLOY_GUIDE.md`](docs/DEPLOY_GUIDE.md): deploy and setup procedure

## License

All rights reserved. This repository has no open source license.
