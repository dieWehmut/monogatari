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

[简体中文](../README.md) | 繁體中文 | [English](README.en.md) | [日本語](README.ja.md)

</div>

---

`monogatari` 是一個圍繞時間線敘事展開的社交應用。它包含 React / Vite Web 前端、Capacitor Android 外殼、實驗中的 Expo React Native 客戶端，以及 Go / Gin API 服務。使用者可以發布帶時間點或時間段的故事，上傳圖片與影片，瀏覽動態與相簿，按讚、留言、追蹤他人，並透過邀請碼與審核流程完成註冊。

這個倉庫也保留了靜態故事擷取模式，可把故事內容建置成唯讀站點，並透過 Giscus 接入留言。

## 功能

- 時間線動態、故事視圖和相簿視圖
- 圖片 / 影片發布與 Cloudinary 媒體儲存
- 貼文按讚、留言、留言按讚、追蹤關係
- GitHub / Google / Email 登入
- 帳號綁定與解除綁定
- 邀請碼註冊、管理員審核、通知公告
- Supabase PostgreSQL 資料儲存
- Redis 登入限流、臨時 token 和 session 狀態，可選
- Resend 審核郵件和 Email 登入，可選
- Sentry 前後端監控，可選
- Capacitor Android 客戶端
- 實驗中的 Expo React Native 客戶端
- 靜態故事擷取模式和 Giscus 留言
- 可選 Vercel 同源 API 代理

## 快速開始

### 1. 複製倉庫

```bash
git clone https://github.com/dieWehmut/monogatari.git
cd monogatari
```

### 2. 設定後端

依照 [backend/README.md](../backend/README.md) 建立並填寫 `backend/.env`。最小可用設定需要：

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

Redis、Resend、GitHub OAuth、Google OAuth 和 Sentry 可以依功能需要再設定。

### 3. 啟動後端

```bash
cd backend
go run ./cmd/server
```

預設位址是 `http://localhost:7860`。

### 4. 啟動前端

```bash
cd frontend
pnpm install
```

PowerShell：

```powershell
$env:VITE_API_BASE = "http://localhost:7860"
pnpm dev
```

Bash / zsh：

```bash
VITE_API_BASE=http://localhost:7860 pnpm dev
```

預設位址是 `http://localhost:5173`。

### 5. 建置 Android 應用

```bash
cd frontend
pnpm build
npx cap sync android
npx cap open android
```

## 部署

### 後端

後端是普通 Go 服務，可部署到 VPS、Docker 主機、Coolify、Railway、Fly.io 或 Kubernetes。

```bash
cd backend
docker build -t monogatari-backend .
docker run -p 7860:7860 --env-file .env monogatari-backend
```

也可以直接編譯執行：

```bash
cd backend
go build -o server ./cmd/server
./server
```

### 前端靜態站點

建置時把 `VITE_API_BASE` 指向後端公開位址：

```bash
cd frontend
VITE_API_BASE=https://api.example.com pnpm build
```

產物位於 `frontend/dist/`，可以發布到 Vercel、Netlify、Cloudflare Pages 或其他靜態託管服務。

### Vercel 同源代理

`frontend/api/proxy.go` 可以把 `/api/*` 請求轉發到後端：

- Vercel 專案根目錄設為 `frontend`
- 設定 `BACKEND_URL=https://api.example.com`
- 前端建置時可不設定 `VITE_API_BASE`，讓瀏覽器走同源 `/api/*`

### 靜態故事模式

只發布靜態故事站點時：

```bash
cd frontend
VITE_STATIC_STORY=true VITE_STATIC_AUTH=false pnpm build
```

靜態留言需要設定 `VITE_CAPTURE_GISCUS_*` 環境變數，範例見 [frontend/.env.example](../frontend/.env.example)。

## Giscus 留言

複製 `frontend/.env.example` 到本地環境檔，並填入 Giscus 設定：

```env
VITE_CAPTURE_GISCUS_REPO=owner/repo
VITE_CAPTURE_GISCUS_REPO_ID=
VITE_CAPTURE_GISCUS_CATEGORY=General
VITE_CAPTURE_GISCUS_CATEGORY_ID=
VITE_CAPTURE_GISCUS_MAPPING=specific
VITE_CAPTURE_GISCUS_THEME=nexus
VITE_CAPTURE_GISCUS_LANG=zh-CN
```

設定為空時，靜態留言區會保持隱藏或顯示未設定提示。

## 專案結構

```text
frontend/
  src/                    Web 前端
  android/                Capacitor Android 工程
  react-native/           Expo React Native 客戶端，實驗中
  api/proxy.go            Vercel 同源 API 代理
  scripts/                擷取資料與開發腳本

backend/
  cmd/server/             Go API 入口
  internal/               controller / service / storage / router
  supabase/schema.sql     Supabase schema
  upstash/                Redis 初始化腳本

.github/workflows/
  apply-supabase-schema.yml
  redis-init.yml
  sync-starter.yml
```

## 常用命令

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

## 執行時服務

| 服務 | 用途 |
|---|---|
| Supabase | 使用者、貼文、留言、追蹤、邀請碼、站點設定 |
| Cloudinary | 貼文和留言中的圖片 / 影片資源 |
| Redis | session 狀態、登入限流、OAuth / Email 臨時狀態 |
| Resend | Email 登入和註冊審核郵件 |
| Sentry | 前後端錯誤監控 |

## 授權

目前倉庫未包含 `LICENSE` 檔案。公開使用或分發前，請先補充明確的授權條款。
