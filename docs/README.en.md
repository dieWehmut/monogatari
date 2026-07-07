<h1 align="center">monogatari</h1>

<p align="center">
  <img src="https://count.getloli.com/get/@monogatari?theme=rule34" alt="Visitors">
</p>

<div align="center">

<div>
<a href="https://react.dev/" target="_blank">
  <img src="https://img.shields.io/badge/REACT-19-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=555555" alt="React 19">
</a>
<a href="https://vite.dev/" target="_blank">
  <img src="https://img.shields.io/badge/VITE-7-646CFF?style=flat-square&logo=vite&logoColor=white&labelColor=555555" alt="Vite 7">
</a>
<a href="https://www.typescriptlang.org/" target="_blank">
  <img src="https://img.shields.io/badge/TYPE%20SCRIPT-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=555555" alt="TypeScript">
</a>
<a href="https://go.dev/" target="_blank">
  <img src="https://img.shields.io/badge/GO-1.25-00ADD8?style=flat-square&logo=go&logoColor=white&labelColor=555555" alt="Go 1.25">
</a>
</div>

<div>
<a href="https://supabase.com/" target="_blank">
  <img src="https://img.shields.io/badge/SUPABASE-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white&labelColor=555555" alt="Supabase">
</a>
<a href="https://cloudinary.com/" target="_blank">
  <img src="https://img.shields.io/badge/CLOUDINARY-Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white&labelColor=555555" alt="Cloudinary">
</a>
<a href="https://capacitorjs.com/" target="_blank">
  <img src="https://img.shields.io/badge/CAPACITOR-Android-119EFF?style=flat-square&logo=capacitor&logoColor=white&labelColor=555555" alt="Capacitor Android">
</a>
</div>

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README.zh-TW.md) | English | [日本語](README.ja.md)

</div>

---

`monogatari` is a timeline-story social app. It includes a React / Vite web frontend, a Capacitor Android shell, an experimental Expo React Native client, and a Go / Gin API service. Users can publish stories with a point in time or a time range, upload images and videos, browse feeds and albums, like, comment, follow others, and register through invite-code and review flows.

The repository also keeps a static story capture mode that can build the story content into a read-only site with optional Giscus comments.

## Examples

- Main repository: <https://github.com/dieWehmut/monogatari>
- Static starter sync target: <https://github.com/dieWehmut/monogatari-starter>

The remote `gh-pages` branch has been deleted from the main repository. This repository no longer recommends a GitHub Pages branch as its deployment target; if the historical `deploy-gh-pages.yml` workflow stays in the repo, make sure it does not recreate the branch on `main` updates.

## Features

- Timeline feed, story view, and album view
- Image / video publishing with Cloudinary media storage
- Post likes, comments, comment likes, and follow relationships
- GitHub / Google / Email login
- Account binding and unbinding
- Invite-code registration, admin review, and site notification
- Supabase PostgreSQL data storage
- Optional Redis login rate limits, temporary tokens, and session state
- Optional Resend review email and Email login
- Optional Sentry monitoring for frontend and backend
- Capacitor Android client
- Experimental Expo React Native client
- Static story capture mode with Giscus comments
- Optional Vercel same-origin API proxy

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/dieWehmut/monogatari.git
cd monogatari
```

### 2. Configure the backend

Create and fill `backend/.env` by following [backend/README.md](../backend/README.md). A minimal usable setup needs:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SESSION_SECRET=
FRONTEND_BASE_URL=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173
```

Redis, Resend, GitHub OAuth, Google OAuth, and Sentry can be configured only when you need those features.

### 3. Start the backend

```bash
cd backend
go run ./cmd/server
```

The default address is `http://localhost:7860`.

### 4. Start the frontend

```bash
cd frontend
pnpm install
```

PowerShell:

```powershell
$env:VITE_API_BASE = "http://localhost:7860"
pnpm dev
```

Bash / zsh:

```bash
VITE_API_BASE=http://localhost:7860 pnpm dev
```

The default address is `http://localhost:5173`.

### 5. Build the Android app

```bash
cd frontend
pnpm build
npx cap sync android
npx cap open android
```

## Deployment

### Backend

The backend is a regular Go service and can be deployed to a VPS, Docker host, Coolify, Railway, Fly.io, or Kubernetes.

```bash
cd backend
docker build -t monogatari-backend .
docker run -p 7860:7860 --env-file .env monogatari-backend
```

You can also build and run the binary directly:

```bash
cd backend
go build -o server ./cmd/server
./server
```

### Static frontend

Point `VITE_API_BASE` at the public backend URL during build:

```bash
cd frontend
VITE_API_BASE=https://api.example.com pnpm build
```

The output is written to `frontend/dist/` and can be deployed to Vercel, Netlify, Cloudflare Pages, or another static hosting service.

### Vercel same-origin proxy

`frontend/api/proxy.go` can forward `/api/*` requests to the backend:

- Set the Vercel project root to `frontend`
- Set `BACKEND_URL=https://api.example.com`
- You may omit `VITE_API_BASE` so the browser uses same-origin `/api/*`

### Static story mode

For a read-only static story site:

```bash
cd frontend
VITE_STATIC_STORY=true VITE_STATIC_AUTH=false pnpm build
```

Static comments require `VITE_CAPTURE_GISCUS_*` environment variables. See [frontend/.env.example](../frontend/.env.example).

## Giscus Comments

Copy `frontend/.env.example` to your local environment file and fill the Giscus settings:

```env
VITE_CAPTURE_GISCUS_REPO=owner/repo
VITE_CAPTURE_GISCUS_REPO_ID=
VITE_CAPTURE_GISCUS_CATEGORY=General
VITE_CAPTURE_GISCUS_CATEGORY_ID=
VITE_CAPTURE_GISCUS_MAPPING=specific
VITE_CAPTURE_GISCUS_THEME=nexus
VITE_CAPTURE_GISCUS_LANG=zh-CN
```

When the settings are empty, the static comments area remains hidden or shows the not-configured state.

## Project Structure

```text
frontend/
  src/                    Web frontend
  android/                Capacitor Android project
  react-native/           Experimental Expo React Native client
  api/proxy.go            Vercel same-origin API proxy
  scripts/                Capture and development scripts

backend/
  cmd/server/             Go API entry point
  internal/               controller / service / storage / router
  supabase/schema.sql     Supabase schema
  upstash/                Redis initialization script

.github/workflows/
  apply-supabase-schema.yml
  redis-init.yml
  sync-starter.yml
```

## Common Commands

```bash
# frontend
pnpm dev
pnpm build
pnpm lint
pnpm preview

# backend
go run ./cmd/server
go test ./...
go build -o server ./cmd/server
```

## Runtime Services

| Service | Purpose |
|---|---|
| Supabase | Users, posts, comments, follows, invite codes, site settings |
| Cloudinary | Image / video assets in posts and comments |
| Redis | Session state, login rate limits, OAuth / Email temporary state |
| Resend | Email login and registration review email |
| Sentry | Frontend and backend error monitoring |

## License

This repository does not currently include a `LICENSE` file. Add an explicit license before public use or redistribution.
