# 家庭账本 · 上线部署指南

## 一、项目概览

- **前端**：Vite + React 19 + TypeScript + shadcn/ui（Tailwind v4）
- **后端**：Supabase（Auth + Postgres + RLS）
- **数据请求**：@tanstack/react-query
- **PWA**：vite-plugin-pwa（可安装到手机主屏幕）

## 二、本地开发

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase URL 和 anon key
pnpm dev                     # http://localhost:5173
```

## 三、上线前必做：Supabase 安全设置

> ⚠️ **重要**：默认状态下任何人都可以注册账号。上线前请完成以下设置。

### 1. 关闭公开注册（推荐，家庭邀请制）

Dashboard → **Authentication → Sign In / Up**：

- 关闭 **Allow new users to sign up**（新用户无法自助注册）
- 需要添加家人时：**Authentication → Users → Add user** 手动创建账号，再把邀请码发给对方即可

### 2. 开启邮箱验证（备选，更稳妥）

若希望用户自助注册但需验证邮箱：

- **Authentication → Sign In / Up → Email**：开启 **Confirm email**
- 配好邮件服务（推荐 Resend，免费额度够用）
- 注意免费版确认邮件限流（30 封/小时）

### 3. 安全检查清单

| 项 | 状态 |
|---|---|
| RLS 已启用（所有业务表） | ✅ 已在 migration 中配置 |
| 家庭成员隔离（跨家庭/匿名不可见） | ✅ 已验证 |
| 记账人服务端强制（防冒充） | ✅ 触发器保证 |
| 仅记账人本人可改账 | ✅ RLS 策略 |
| 密码策略 | 建议开 8 位以上 |

### 4. 数据库迁移

如需在任何环境重建数据库，按顺序执行 `supabase/migrations/` 下的 0001 → 0002 → 0003。

## 四、部署到 Vercel

### 方式 A：Vercel 控制台（推荐）

1. 推送代码到 GitHub
2. [vercel.com](https://vercel.com) → **Add New Project** → 导入仓库
3. Framework Preset 选 **Vite**（会自动识别）
4. 添加环境变量（见下）
5. **Deploy**

### 方式 B：Vercel CLI

```bash
npm i -g vercel
vercel login
pnpm build
vercel --prod
```

### 环境变量（Vercel → Project → Settings → Environment Variables）

| 变量 | 值 |
|---|---|
| `VITE_SUPABASE_URL` | 你的 Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key（注意不是 service_role key！） |

> ⚠️ `VITE_` 前缀变量会打包进前端代码，**绝不能**使用 `service_role` 密钥。

### 自定义域名

Vercel → Project → **Settings → Domains** → 添加域名 → 按提示配置 DNS。

## 五、PWA 使用说明

部署后（HTTPS 环境）自动生效：

- **Android/Chrome**：访问网站 → 地址栏"安装应用"→ 添加到主屏幕
- **iOS/Safari**：分享按钮 → **添加到主屏幕**（自动使用金色账本图标）
- 安装后全屏运行、有独立图标，体验接近原生 App
- Service Worker 自动缓存静态资源，弱网下可离线打开

## 六、上线后检查

- [ ] 注册入口已关闭/开启邮箱验证
- [ ] 两人以上家庭协作：邀请码加入、共同记账、统计同步
- [ ] 手机访问：底部导航、记账全屏页、PWA 安装
- [ ] 域名 HTTPS 生效
- [ ] 数据隔离：退出登录后无法访问任何数据

## 七、常见问题

| 问题 | 解决 |
|---|---|
| 登录后跳回引导页 | 确认关闭了"允许注册"后，检查该邮箱是否已被手动创建 |
| 邮件发送失败 | 免费版限流 30 封/小时；或配置 Resend 邮件服务 |
| PWA 无法安装 | 必须是 HTTPS；清除浏览器缓存后重试 |
| 更新不生效 | Service Worker 自动更新，刷新页面即可 |

---

## 项目结构速览

```
src/
  lib/          supabase 客户端、金额/分类工具
  hooks/        家庭/账本/交易/分类/统计/资料 hooks
  context/      AuthProvider、LedgerProvider
  components/   ui(shadcn) + 布局 + 业务组件
  pages/        auth/onboarding/dashboard/transactions/statistics/settings
supabase/migrations/   数据库迁移（0001-0003）
```
