# salonx-cube

**SALON X — Cube** with a fully database-backed builder. Every face (image/video, zoom, pan, fit, hyperlink) and master link settings live in **PostgreSQL** via Prisma — the same cube on every device.

## Database schema

| Model | Purpose |
|-------|---------|
| `Cube` | Root record (`id: default`), master link toggle + URL |
| `CubeFace` | 6 rows — Right, Left, Top, Bottom, Front, Back |
| `CubeMedia` | Uploaded images / top-face videos (BYTEA) |
| `CubeLead` | Phone/name from welcome gate |

Each `CubeFace` stores: `kind`, `fit`, `zoom`, `panX`, `panY`, `link`, optional `mediaId`.

## API routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cube` | Load full cube (6 faces + settings) |
| `PUT` | `/api/cube` | Save cube (uploads blob/data URLs server-side) |
| `GET` | `/api/cube/faces/[index]` | Load one face (`0`–`5`) |
| `PATCH` | `/api/cube/faces/[index]` | Update one face (zoom, pan, fit, link, etc.) |
| `POST` | `/api/cube/media` | Upload file — `file` + optional `faceIndex` |
| `GET` | `/api/cube/media/[id]` | Serve stored media |
| `POST` | `/api/cube/leads` | Save lead `{ phone, name? }` |

## Builder behavior (dynamic)

- **Upload image** → instant `POST /api/cube/media` → face linked in DB
- **Upload video** (Top face) → same flow
- **Zoom / Pan sliders** → auto-save ~450ms after change
- **Save button** → full `PUT /api/cube`
- **Master link toggle** → saved to `Cube` table
- **Per-face hyperlink** → saved on each face row

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL

npm install
npm run db:deploy   # run migration
npm run dev
```

## Render deploy

**Environment:**

```
DATABASE_URL=<Render Postgres Internal URL>
NODE_VERSION=22
```

**Build command:**

```bash
npm install && npx prisma migrate deploy && npm run build
```

**Start:** `npm start`

## Face index map

| Index | Label |
|-------|--------|
| 0 | Right |
| 1 | Left |
| 2 | Top (video allowed) |
| 3 | Bottom |
| 4 | Front |
| 5 | Back |
