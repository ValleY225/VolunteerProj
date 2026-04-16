# Project Info (Brief)

## What was built

- Full volunteer management app with 2 roles:
  - Participant
  - Coordinator
- Features implemented:
  - Registration (name, photo, region, birth date, role)
  - Login + quick login user list
  - Role-based dashboards and sidebar navigation
  - Participant: view events, join event, choose shift (Morning/Afternoon/Night)
  - Coordinator: create/edit/delete events, view participants and shifts
  - Profile settings for both roles

## Tech stack

- Frontend: Vite + JavaScript + Tailwind (`Frontend`)
- Backend (local dev): Express API (`Backend/src/server.js`)
- Backend (production): Cloudflare Worker (`Backend/src/worker.js`)
- Database: Supabase Postgres (`users`, `events`, `joins`)
- File storage: Supabase Storage bucket `ngo-assets` (profile/event images)

## Supabase setup

- SQL schema is in: `Backend/supabase/schema.sql`
- This file creates:
  - `public.users`
  - `public.events`
  - `public.joins`
  - Storage bucket + policies for `ngo-assets`

## Cloudflare deployment

- Worker API:
  - `https://projmanage-api.valliera27.workers.dev`
- Frontend Pages:
  - `https://projmanage-frontend.pages.dev`
- Latest preview deployment (changes each deploy):
  - `https://2d7a05e9.projmanage-frontend.pages.dev`

Detailed deployment notes:
- `CLOUDFLARE_DEPLOY.md`

## How server works

- Frontend calls API endpoints under `/api/*`.
- Worker handles API routes (register/login/users/events/joins/profile updates).
- Worker uses Supabase service role key for DB and storage operations.
- Photos are uploaded to Supabase Storage and saved as public URLs in database.

## How to run/control locally

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

- Local frontend URL usually: `http://localhost:5173`
- API base is controlled by `VITE_API_BASE` (defaults to `http://localhost:4000`).

### Backend (Node/Express local)

```bash
cd Backend
npm install
npm start
```

- Local backend URL: `http://localhost:4000`
- Reads Supabase env from root `.env.local`.

## How to control production

### Deploy/update Worker API

```bash
cd Backend
npx wrangler deploy
```

Set/update secrets:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Deploy/update Frontend Pages

```bash
cd Frontend
$env:VITE_API_BASE="https://projmanage-api.valliera27.workers.dev"
npm run build
npx wrangler pages deploy dist --project-name projmanage-frontend --branch main
```

PowerShell note:
- Use `;` to chain commands, not `&&`.
- Example:

```powershell
$env:VITE_API_BASE="https://projmanage-api.valliera27.workers.dev"; npm run build; if ($LASTEXITCODE -eq 0) { npx wrangler pages deploy dist --project-name projmanage-frontend --branch main }
```

## Quick production verification

```powershell
curl.exe -s "https://projmanage-api.valliera27.workers.dev/api/health"
curl.exe -I "https://projmanage-frontend.pages.dev"
```

Expected:
- API returns `{"ok":true}`
- Frontend returns `HTTP/1.1 200 OK`

## Important notes

- If API health shows table errors, run `Backend/supabase/schema.sql` in Supabase SQL editor.
- Keep service role key secret (never commit to git).
