# salonx-cube

Next.js app for the **SALON X — Cube** 3D experience. Cube faces, hyperlinks, and uploaded media are stored in **PostgreSQL** via Prisma so the same cube appears on every device.

## Stack

- Next.js 16 (App Router)
- Prisma + PostgreSQL
- Three.js cube bundle (`public/cube-bundle.js`)

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL with your PostgreSQL connection string

npm install
npm run db:push    # create tables (dev)
# or: npm run db:migrate

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

| Model | Purpose |
|-------|---------|
| `CubeState` | 6 faces + master link settings (single shared cube, id `default`) |
| `CubeMedia` | Uploaded images / top-face videos (served at `/api/cube/media/[id]`) |
| `CubeLead` | Phone/name leads from the welcome gate |

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cube` | Load cube state |
| `PUT` | `/api/cube` | Save cube state |
| `POST` | `/api/cube/media` | Upload image/video (`multipart/form-data`, field `file`) |
| `GET` | `/api/cube/media/[id]` | Serve stored media |
| `POST` | `/api/cube/leads` | Save lead `{ phone, name? }` |

## Render deploy

1. Create a **PostgreSQL** database on Render (or use Neon/Supabase).
2. Create a **Web Service** from this repo.
3. Environment variables:
   - `DATABASE_URL` — Internal Database URL from Render Postgres
   - `NODE_VERSION=22`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. After first deploy, run migrations once (Render Shell):

```bash
npx prisma migrate deploy
```

Or use `npm run db:push` in build (not recommended for production) — prefer migrate deploy.

### Recommended Render build (includes migrate)

**Build command:**

```bash
npm install && npx prisma migrate deploy && npm run build
```

## Notes

- Custom face uploads are sent to PostgreSQL on **Save** (blob/data URLs are replaced with `/api/cube/media/...` URLs).
- Gate passcode flow still uses browser `localStorage` for session convenience; cube content is fully server-backed.
- Video uploads: max ~30MB; images: max ~8MB per file.
