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

[简体中文](../README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md) | 日本語

</div>

---

`monogatari` は、タイムライン型の物語を中心にしたソーシャルアプリです。React / Vite の Web フロントエンド、Capacitor Android シェル、実験中の Expo React Native クライアント、Go / Gin API サービスで構成されています。ユーザーは日時や期間を持つストーリーを投稿し、画像や動画をアップロードし、フィードやアルバムを閲覧し、いいね、コメント、フォローを行い、招待コードと審査フローで登録できます。

このリポジトリには静的ストーリーキャプチャモードもあり、ストーリー内容を読み取り専用サイトとしてビルドし、Giscus コメントを接続できます。

## 機能

- タイムラインフィード、ストーリービュー、アルバムビュー
- Cloudinary による画像 / 動画投稿とメディア保存
- 投稿のいいね、コメント、コメントのいいね、フォロー関係
- GitHub / Google / Email ログイン
- アカウント連携と解除
- 招待コード登録、管理者審査、通知公告
- Supabase PostgreSQL データ保存
- 任意の Redis ログインレート制限、一時 token、session 状態
- 任意の Resend 審査メールと Email ログイン
- 任意の Sentry フロントエンド / バックエンド監視
- Capacitor Android クライアント
- 実験中の Expo React Native クライアント
- 静的ストーリーキャプチャモードと Giscus コメント
- 任意の Vercel 同一オリジン API プロキシ

## クイックスタート

### 1. リポジトリをクローン

```bash
git clone https://github.com/dieWehmut/monogatari.git
cd monogatari
```

### 2. バックエンドを設定

[backend/README.md](../backend/README.md) に従って `backend/.env` を作成し、値を設定します。最小構成には次が必要です。

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

Redis、Resend、GitHub OAuth、Google OAuth、Sentry は必要な機能に応じて設定してください。

### 3. バックエンドを起動

```bash
cd backend
go run ./cmd/server
```

デフォルトのアドレスは `http://localhost:7860` です。

### 4. フロントエンドを起動

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

デフォルトのアドレスは `http://localhost:5173` です。

### 5. Android アプリをビルド

```bash
cd frontend
pnpm build
npx cap sync android
npx cap open android
```

## デプロイ

### バックエンド

バックエンドは通常の Go サービスとして、VPS、Docker ホスト、Coolify、Railway、Fly.io、Kubernetes などにデプロイできます。

```bash
cd backend
docker build -t monogatari-backend .
docker run -p 7860:7860 --env-file .env monogatari-backend
```

バイナリを直接ビルドして実行することもできます。

```bash
cd backend
go build -o server ./cmd/server
./server
```

### 静的フロントエンド

ビルド時に `VITE_API_BASE` を公開バックエンド URL に向けます。

```bash
cd frontend
VITE_API_BASE=https://api.example.com pnpm build
```

出力は `frontend/dist/` に生成され、Vercel、Netlify、Cloudflare Pages などの静的ホスティングへデプロイできます。

### Vercel 同一オリジンプロキシ

`frontend/api/proxy.go` は `/api/*` リクエストをバックエンドへ転送できます。

- Vercel のプロジェクトルートを `frontend` に設定
- `BACKEND_URL=https://api.example.com` を設定
- `VITE_API_BASE` を省略し、ブラウザから同一オリジンの `/api/*` を使うこともできます

### 静的ストーリーモード

読み取り専用の静的ストーリーサイトだけを公開する場合：

```bash
cd frontend
VITE_STATIC_STORY=true VITE_STATIC_AUTH=false pnpm build
```

静的コメントには `VITE_CAPTURE_GISCUS_*` 環境変数が必要です。例は [frontend/.env.example](../frontend/.env.example) を参照してください。

## Giscus コメント

`frontend/.env.example` をローカルの環境ファイルへコピーし、Giscus 設定を入力します。

```env
VITE_CAPTURE_GISCUS_REPO=owner/repo
VITE_CAPTURE_GISCUS_REPO_ID=
VITE_CAPTURE_GISCUS_CATEGORY=General
VITE_CAPTURE_GISCUS_CATEGORY_ID=
VITE_CAPTURE_GISCUS_MAPPING=specific
VITE_CAPTURE_GISCUS_THEME=nexus
VITE_CAPTURE_GISCUS_LANG=zh-CN
```

設定が空の場合、静的コメント欄は非表示のまま、または未設定状態を表示します。

## プロジェクト構成

```text
frontend/
  src/                    Web フロントエンド
  android/                Capacitor Android プロジェクト
  react-native/           実験中の Expo React Native クライアント
  api/proxy.go            Vercel 同一オリジン API プロキシ
  scripts/                キャプチャと開発用スクリプト

backend/
  cmd/server/             Go API エントリーポイント
  internal/               controller / service / storage / router
  supabase/schema.sql     Supabase schema
  upstash/                Redis 初期化スクリプト

.github/workflows/
  apply-supabase-schema.yml
  redis-init.yml
  sync-starter.yml
```

## よく使うコマンド

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

## 実行時サービス

| サービス | 用途 |
|---|---|
| Supabase | ユーザー、投稿、コメント、フォロー、招待コード、サイト設定 |
| Cloudinary | 投稿とコメント内の画像 / 動画アセット |
| Redis | session 状態、ログインレート制限、OAuth / Email 一時状態 |
| Resend | Email ログインと登録審査メール |
| Sentry | フロントエンドとバックエンドのエラー監視 |

## ライセンス

現在、このリポジトリには `LICENSE` ファイルが含まれていません。公開利用や再配布の前に、明確なライセンスを追加してください。
