# 西米老师的宠物空间

班级电子宠物积分激励平台。当前最小可运行版本包含：手机号注册/登录、老师默认待开通、管理员开通/暂停/续期/重置密码、Prisma + PostgreSQL 数据模型、教师账号状态与使用期限拦截。

## 本地启动

1. 安装依赖：

```bash
pnpm install
```

2. 复制环境变量：

```bash
cp .env.example .env
```

3. 修改 `.env`：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ximi_pet_space?schema=public"
AUTH_SECRET="至少32位随机字符串"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INITIAL_ADMIN_PHONE="13800000000"
INITIAL_ADMIN_PASSWORD="至少8位强密码"
```

4. 准备 PostgreSQL 数据库。可以使用本机 PostgreSQL，也可以用 Docker：

```bash
docker run --name ximi-pet-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ximi_pet_space -p 5432:5432 -d postgres:16
```

5. 生成 Prisma client 并执行迁移：

```bash
pnpm prisma:generate
pnpm prisma migrate dev --name init
```

6. 初始化平台管理员：

```bash
pnpm admin:init
```

7. 启动开发服务：

```bash
pnpm dev
```

访问 `http://localhost:3000`。

## 关键页面

- `/register`：老师手机号注册，注册后状态为待开通。
- `/login`：老师和管理员登录。
- `/teacher`：教师工作台；待开通、暂停、到期账号会被拦截。
- `/admin`：管理员后台；管理老师开通、暂停、续期和重置密码。

## 数据模型

Prisma schema 位于 `prisma/schema.prisma`，包含：

- `User`
- `Subscription`
- `Class`
- `Student`
- `BehaviorRule`
- `PointLog`
- `PetEvolution`
- `PetInteraction`
- `AuditLog`
- `SystemSetting`

## 部署到 Vercel + Supabase

1. 在 Supabase 创建项目，进入 Project Settings 获取 PostgreSQL 连接串。
2. 在 Vercel 导入本仓库。
3. 在 Vercel Project Settings 配置环境变量：

```bash
DATABASE_URL="Supabase pooled PostgreSQL connection string"
AUTH_SECRET="至少32位随机字符串"
NEXT_PUBLIC_APP_URL="https://你的域名"
INITIAL_ADMIN_PHONE="管理员手机号"
INITIAL_ADMIN_PASSWORD="管理员初始密码"
```

4. 在部署前或部署后执行数据库迁移。可在本机使用 Supabase 的 `DATABASE_URL` 执行：

```bash
pnpm prisma:generate
pnpm prisma migrate dev --name init
pnpm admin:init
```

5. 部署完成后，用管理员手机号登录 `/admin`。

## 部署到云服务器

1. 安装 Node.js 20.19+、pnpm、PostgreSQL。
2. 上传项目并配置 `.env`。
3. 执行：

```bash
pnpm install
pnpm prisma:generate
pnpm prisma migrate dev --name init
pnpm admin:init
pnpm build
pnpm start
```

4. 使用 Nginx/Caddy 将域名反向代理到 Next.js 服务端口。

## 验证命令

```bash
pnpm test
pnpm tsc --noEmit
pnpm lint
pnpm build
```

`pnpm build` 和实际访问数据库前必须配置有效的 `DATABASE_URL` 和 `AUTH_SECRET`。

---
> 🚀 公网部署: https://ximi-pet-space.vercel.app | 部署时间: 2026-06-06 16:46
