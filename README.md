# HSK 中文学习平台

HSK (Hànyǔ Shuǐpíng Kǎoshì 汉语水平考试) 中文（普通话）学习平台。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 15 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| **用户认证** | **Supabase Auth**（注册 / 登录 / 会话） |
| **课程内容** | MySQL + Prisma（Aiven 等） |
| 图标 | lucide-react |

## 功能

- Supabase **注册 / 登录 / 登出**
- 按 `member_level`（1–6）分级解锁 HSK 课程
- 动态课程页、拼音切换、音频、汉字笔顺（HanziWriter）
- MySQL 记录**学习进度**（按 Supabase 用户 UUID）

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目  
2. **SQL Editor** 中执行 `supabase/migrations/001_profiles.sql`  
3. **Authentication → Providers → Email**：开发阶段建议关闭 **Confirm email**（否则注册后需邮件确认才能登录）  
4. 复制 **Project URL**、**anon key**、**service_role key** 到 `.env`

### 3. 环境变量

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."   # 仅服务端，勿提交 Git

DATABASE_URL="mysql://..."          # 课程内容库
NEXT_PUBLIC_MEDIA_BASE_URL="/media"
```

### 4. 初始化 MySQL（课程 + 进度表）

```bash
npm run db:push
npm run content:migrate   # 若库中尚无课程
npm run db:seed           # 在 Supabase 创建 demo@hsk.local / Demo1234
```

### 5. 启动

```bash
npm run dev
```

## 部署到 Vercel

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role（注册时查用户名） |
| `DATABASE_URL` | Aiven MySQL，Prisma 用 `?sslaccept=strict` |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | `/media` |

**可删除**旧变量：`AUTH_SECRET`、`NEXTAUTH_SECRET`（已不再使用 NextAuth）。

MySQL 上执行 `npm run db:push`（或本地 push 到云库）更新 `user_progress.user_id` 为 UUID 字符串。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run db:push` | 同步 Prisma schema 到 MySQL |
| `npm run content:migrate` | legacy PHP → MySQL 课程 |
| `npm run db:seed` | Supabase 演示账号 |
