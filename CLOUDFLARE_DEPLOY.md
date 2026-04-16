## Cloudflare Deployment

This project deploys as:
- Frontend -> Cloudflare Pages
- API -> Cloudflare Workers (`Backend/src/worker.js`)
- Images -> Supabase Storage bucket `ngo-assets`

### 1) Run Supabase SQL

Run `Backend/supabase/schema.sql` in Supabase SQL editor.

### 2) Cloudflare auth

Recommended auth:
- `CLOUDFLARE_API_TOKEN` (token with Workers/Pages edit + Account read)
- `CLOUDFLARE_ACCOUNT_ID`

Global API key works, but token is safer and preferred.

### 3) Deploy Worker API

From `Backend`:

```bash
npx wrangler deploy
```

Set secrets:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Optional vars are in `Backend/wrangler.toml`:
- `SUPABASE_STORAGE_BUCKET` (default: `ngo-assets`)
- `CORS_ORIGIN` (default: `*`)

### 4) Deploy Frontend

From `Frontend`:

```bash
npm install
npm run build
```

Set frontend API URL for production:

```bash
# PowerShell
$env:VITE_API_BASE="https://projmanage-api.valliera27.workers.dev"
npm run build
```

Then deploy:

```bash
npx wrangler pages deploy dist --project-name projmanage-frontend
```

### 5) Update CORS

After Pages URL is known, set Worker var `CORS_ORIGIN` to that exact Pages URL and redeploy worker.
