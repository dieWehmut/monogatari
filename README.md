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

简体中文 | [繁體中文](docs/README.zh-TW.md) | [English](docs/README.en.md) | [日本語](docs/README.ja.md)

</div>

---

`monogatari` 是一个围绕时间线叙事展开的社交应用。它包含 React / Vite Web 前端、Capacitor Android 壳、实验中的 Expo React Native 客户端，以及 Go / Gin API 服务。用户可以发布带时间点或时间段的故事，上传图片和视频，浏览动态与相册，点赞、评论、关注他人，并通过邀请码和审核流程完成注册。

这个仓库也保留了静态故事捕获模式，可把故事内容构建成只读站点，并通过 Giscus 接入评论。

## 功能

- 时间线动态、故事视图和相册视图
- 图片 / 视频发布与 Cloudinary 媒体存储
- 帖子点赞、评论、评论点赞、关注关系
- GitHub / Google / Email 登录
- 账号绑定与解绑
- 邀请码注册、管理员审核、通知公告
- Supabase PostgreSQL 数据存储
- Redis 登录限流、临时 token 和 session 状态，可选
- Resend 审核邮件和 Email 登录，可选
- Sentry 前后端监控，可选
- Capacitor Android 客户端
- 实验中的 Expo React Native 客户端
- 静态故事捕获模式和 Giscus 评论

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/dieWehmut/monogatari.git
cd monogatari
```

### 2. 配置后端

按 [backend/README.md](backend/README.md) 创建并填写 `backend/.env`。最小可用配置需要：

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

Redis、Resend、GitHub OAuth、Google OAuth 和 Sentry 可以按功能需要再配置。

### 3. 启动后端

```bash
cd backend
go run ./cmd/server
```

默认地址是 `http://localhost:7860`。

### 4. 启动前端

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

默认地址是 `http://localhost:5173`。

### 5. 构建 Android 应用

```bash
cd frontend
pnpm build
npx cap sync android
npx cap open android
```

## 部署

### 后端

后端是普通 Go 服务，可部署到 VPS、Docker 主机、Coolify、Railway、Fly.io 或 Kubernetes。

```bash
cd backend
docker build -t monogatari-backend .
docker run -p 7860:7860 --env-file .env monogatari-backend
```

也可以直接编译运行：

```bash
cd backend
go build -o server ./cmd/server
./server
```

### 前端静态站点

构建时把 `VITE_API_BASE` 指向后端公网地址：

```bash
cd frontend
VITE_API_BASE=https://api.monogatari.diesw.tech pnpm build
```

产物位于 `frontend/dist/`，可以发布到 Vercel、Netlify、Cloudflare Pages 或其他静态托管服务。
前端应直接通过 `VITE_API_BASE` 访问后端公网地址，不再依赖 Vercel 同源 API 代理。

Cloudflare Pages 生产环境至少需要设置：

```env
VITE_API_BASE=https://api.monogatari.diesw.tech
VITE_STATIC_AUTH=true
VITE_AUTH_ENABLE_GITHUB=true
VITE_AUTH_ENABLE_GOOGLE=true
VITE_AUTH_ENABLE_EMAIL=true
VITE_AUTH_ENABLE_REGISTER=true
```

### 静态故事模式

只发布静态故事站点时：

```bash
cd frontend
VITE_STATIC_STORY=true VITE_STATIC_AUTH=false pnpm build
```

静态评论需要配置 `VITE_CAPTURE_GISCUS_*` 环境变量，示例见 [frontend/.env.example](frontend/.env.example)。

## Giscus 评论

复制 `frontend/.env.example` 到本地环境文件，并填入 Giscus 配置：

```env
VITE_CAPTURE_GISCUS_REPO=owner/repo
VITE_CAPTURE_GISCUS_REPO_ID=
VITE_CAPTURE_GISCUS_CATEGORY=General
VITE_CAPTURE_GISCUS_CATEGORY_ID=
VITE_CAPTURE_GISCUS_MAPPING=specific
VITE_CAPTURE_GISCUS_THEME=nexus
VITE_CAPTURE_GISCUS_LANG=zh-CN
```

配置为空时，静态评论区会保持隐藏或显示未配置提示。

## 项目结构

```text
frontend/
  src/                    Web 前端
  android/                Capacitor Android 工程
  react-native/           Expo React Native 客户端，实验中
  scripts/                捕获数据与开发脚本

backend/
  cmd/server/             Go API 入口
  internal/               controller / service / storage / router
  supabase/schema.sql     Supabase schema
  upstash/                Redis 初始化脚本

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

## 运行时服务

| 服务 | 用途 |
|---|---|
| Supabase | 用户、帖子、评论、关注、邀请码、站点设置 |
| Cloudinary | 帖子和评论中的图片 / 视频资源 |
| Redis | session 状态、登录限流、OAuth / Email 临时状态 |
| Resend | Email 登录和注册审核邮件 |
| Sentry | 前后端错误监控 |

## 许可

当前仓库未包含 `LICENSE` 文件。公开使用或分发前，请先补充明确的许可证。
