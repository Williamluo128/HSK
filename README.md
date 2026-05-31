# HSK 中文学习平台

HSK (Hànyǔ Shuǐpíng Kǎoshì 汉语水平考试) 中文（普通话）学习平台。

本项目是原 PHP + Bootstrap 3 站点的**现代化重写版本**：保留了原有的核心功能与 MySQL 数据库设计，并用最新技术栈重建了前后端与整个 UI 系统。原始的 40+ 个硬编码 PHP 课程文件已被解析迁移进数据库，实现动态内容管理。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 15 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS 4，自定义主题与组件 |
| 数据库 | MySQL + Prisma ORM |
| 认证 | Auth.js (NextAuth v5)，Credentials Provider + bcrypt |
| 图标 | lucide-react |

## 功能

- 用户**注册 / 登录 / 登出**（基于 JWT 会话）
- 兼容原系统的密码哈希方案（`bcrypt(sha512(明文))`），旧账号可无缝登录
- 登录失败次数**限流**（2 小时内 5 次，沿用原 `login_attempts` 逻辑）
- 按会员等级（`member_level` 1–6）**分级解锁**对应 HSK 等级的课程
- **动态课程页**：课文、对话、生词表、语法注释、练习、谚语、汉字笔顺
- 一键切换显示**拼音 / 英文翻译 / 例句汉字**
- 音频发音播放、四声声调图
- 上一课 / 下一课导航、章节快速跳转
- **学习进度追踪**（新增）：标记完成、完成度统计、"继续学习"入口

## 目录结构

```
prisma/schema.prisma          数据库模型（核心表 + 内容表 + 进度表）
scripts/migrate-content.ts    解析 legacy PHP 课程 → 数据库
scripts/seed-demo.ts          创建演示账号
src/auth.ts                   Auth.js 配置
src/lib/                      db / password / lessons / progress 等
src/components/               UI 组件（Navbar、LessonContent、ToneChart 等）
src/app/(auth)/               登录 / 注册页
src/app/(app)/                受保护区：dashboard / lessons / profile
legacy/                       归档的原始 PHP 源文件（内容迁移数据源）
```

## 数据库

沿用原有表（`members`、`user_account`、`login_attempts`），新增内容与进度表：
`lessons`、`lesson_sections`、`dialogue_lines`、`words`、`user_progress`。

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你的 MySQL 连接串：

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/hsk"
AUTH_SECRET="用 openssl rand -base64 32 生成的随机串"
NEXT_PUBLIC_MEDIA_BASE_URL="/media"
```

### 3. 初始化数据库结构

```bash
npm run db:push          # 将 Prisma schema 同步到数据库
```

### 4. 导入课程内容 + 演示账号

```bash
npm run content:migrate  # 解析 legacy/ 课程文件并写入数据库
npm run db:seed          # 创建演示账号
```

演示账号：`demo@hsk.local` / `Demo1234`（已开通 1–3 级访问权限）。

### 5. 启动

```bash
npm run dev              # 开发模式 → http://localhost:3000
# 或
npm run build && npm run start
```

## 媒体资源

- **音频**：运行 `npm run content:download-audio` 从原站拉取到 `public/media/audio/`，
  将 `NEXT_PUBLIC_MEDIA_BASE_URL` 设为 `/media` 即可本地播放（约 500+ 个 mp3/m4a）。
- **图片**：课文/词卡图在 `public/media/img/`；部分练习配图无公开源，已转为纯文字版。
- **汉字笔顺**：整字笔顺与单字卡片改用 [HanziWriter](https://hanziwriter.org/)
  动态渲染——交互式动画笔顺 + 描红练习，自动覆盖全部汉字，无需逐字图片。
- **基本笔画**：横折提、弯钩等复合笔画以内联 SVG 矢量示意呈现。
- 个别「看图选词」练习的配图属原课程自编、无公开来源，已转为纯文字版（保留词语与拼音）。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run db:push` | 同步 Prisma schema 到数据库 |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run content:migrate` | 迁移 legacy 课程内容（`-- --dry-run` 可仅预览解析结果） |
| `npm run content:download-audio` | 下载课文音频到 `public/media/audio/` |
| `npm run db:seed` | 创建演示账号 |
