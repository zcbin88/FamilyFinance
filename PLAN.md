# 家庭账本（FamilyFinance）产品与技术方案

> 状态：V1 规划 · 更新时间：2025-02
> 技术栈：Supabase + React + TypeScript + shadcn/ui

---

## 一、产品定位

**家庭账本**：一个家庭共享的多账本记账应用。家庭成员共同记账、实时同步、统一看报表。

核心卖点：
1. **家庭协作** — 邀请家人加入，共同维护家庭账目，每笔账可追溯记账人
2. **多账本** — 一个家庭下可建多个账本（日常 / 旅行 / 装修 / 育儿…），互不干扰
3. **一目了然** — 收支统计、分类占比、趋势变化随时可查

---

## 二、功能规划

### V1 核心闭环（MVP）

| 模块 | 功能点 | 说明 |
|---|---|---|
| 账号 | 邮箱密码注册 / 登录 / 退出 | Supabase Auth，登录后必须有家庭才能使用 |
| 家庭 | 创建家庭（成为房主）、邀请码邀请成员、成员列表、退出家庭 | 一人可加入多个家庭？→ V1 仅支持单家庭（简化），退出后可加入其他家庭 |
| 多账本 | 创建账本（名称 + 图标 + 颜色）、切换当前账本、默认账本、重命名、删除 | 记账、明细、统计都基于"当前账本"作用域 |
| 记账 | 金额、类型（支出/收入）、分类、日期、备注、付款方式 | 记账人自动记录为当前用户，不可篡改 |
| 分类 | 系统内置默认分类 + 家庭自定义分类 | 分类属于家庭，所有账本共享；支持增删改、排序 |
| 明细 | 当前账本的交易列表（按日期分组）、按月份/分类/类型筛选、编辑、删除 | |
| 统计 | 当前账本：本月收支总额、结余、分类占比（饼图）、近 6 个月收支趋势（柱状图）、最近交易 | |
| 归属展示 | 每笔交易显示记账人头像 + 姓名 | 数据上即 transactions.user_id |

### V2（暂不做）
- 预算管理：按月按分类设预算、超支提醒
- 报表导出 Excel / PDF
- 周期性账单：房租 / 房贷自动生成记账
- 语音 / AI 自动记账
- 家庭储蓄目标（进度条）
- 一人多家庭支持

---

## 三、页面结构

```
/auth                    登录 / 注册（未登录进入；已登录无家庭 → 引导创建/加入）
/dashboard               仪表盘：当前账本本月收支卡片、结余、分类占比、最近交易
/transactions            明细页：列表 + 筛选（月份/分类/类型）+ 编辑 + 删除
/transactions/new        记账页：快速记账表单（默认今天，快捷金额）
/statistics              统计页：趋势图 + 分类占比 + 收支对比
/settings                设置：家庭管理（成员/邀请码）、账本管理（增删改）、分类管理、个人信息
```

**导航设计**：
- 桌面端：左侧边栏（账本切换器 + 菜单 + 用户信息）
- 移动端：底部 Tab（首页 / 明细 / 记账 / 统计 / 我的），账本切换放顶部
- 记账按钮全局常驻（桌面侧边栏、移动端底部 Tab 中间大按钮）

---

## 四、数据库设计（Supabase / PostgreSQL）

### 表结构

```sql
profiles           -- 用户资料（与 auth.users 一对一）
  id            uuid PK = auth.users.id
  name          text
  avatar_url    text
  created_at    timestamptz

families           -- 家庭
  id            uuid PK
  name          text
  owner_id      uuid → profiles.id
  invite_code   text UNIQUE  -- 6位邀请码，加入时校验
  created_at    timestamptz

family_members     -- 家庭成员
  id            uuid PK
  family_id     uuid → families.id
  user_id       uuid → profiles.id
  role          text  -- owner / member
  created_at    timestamptz
  UNIQUE(family_id, user_id)

ledgers            -- 账本（属于家庭）
  id            uuid PK
  family_id     uuid → families.id
  name          text
  icon          text
  color         text
  is_default    boolean
  created_at    timestamptz
  deleted_at    timestamptz NULL  -- 软删除（有交易数据的账本禁止硬删）

categories         -- 分类（属于家庭，所有账本共享）
  id            uuid PK
  family_id     uuid → families.id  -- NULL = 系统内置
  name          text
  type          text  -- expense / income
  icon          text
  color         text
  sort_order    int
  created_at    timestamptz

transactions       -- 交易记录（核心表）
  id            uuid PK
  family_id     uuid → families.id
  ledger_id     uuid → ledgers.id
  user_id       uuid → profiles.id   -- 记账人
  category_id   uuid → categories.id
  type          text  -- expense / income
  amount        integer              -- 单位：分（避免浮点精度问题）
  note          text
  pay_method    text                 -- 现金/银行卡/微信/支付宝/信用卡…
  occurred_at   date                 -- 交易发生日期
  created_at    timestamptz
  updated_at    timestamptz
```

### 关键设计决策

1. **金额用 integer 存"分"**，前端展示时转换，杜绝浮点误差
2. **RLS 策略**：所有表（除 profiles）的读写规则统一为「当前用户是该家庭的成员」，通过 `family_members` 校验；这是家庭数据安全的基石
3. **邀请码**：`invite_code` 唯一索引；加入家庭 = 往 `family_members` 插一行
4. **家庭初始化**：创建家庭时事务性 seed：创建默认账本（"日常账本"）+ 系统默认分类
5. **分类归属家庭而非账本**：保持简单，账本只筛选交易，不复制分类
6. **记账人 user_id 由服务端写入**（取当前登录用户），前端不可传，防止冒充
7. **账本软删除**：有交易数据的账本不能硬删，避免孤儿数据

### 索引建议

```sql
CREATE INDEX idx_transactions_ledger_date ON transactions (ledger_id, occurred_at DESC);
CREATE INDEX idx_transactions_family      ON transactions (family_id);
CREATE INDEX idx_categories_family_type   ON categories (family_id, type);
```

---

## 五、技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 构建 | Vite + React 18 + TypeScript | |
| 样式 | Tailwind CSS v4 + shadcn/ui | 官方新项目模板 |
| 路由 | React Router v7 | |
| 数据请求 | **@tanstack/react-query** | 缓存 + 失效刷新 + 乐观更新 |
| 服务端 | Supabase | Auth + Postgres + RLS |
| 图表 | Recharts | 饼图 / 柱状图 |
| 日期 | date-fns | |
| 表单 | react-hook-form + zod | 校验 |
| 全局状态 | React Context（当前家庭 / 当前账本） | 账本切换只做轻量状态，不引重型状态库 |
| 提示 | sonner | toast |

**需要的 shadcn 组件**：button、input、card、dialog、select、dropdown-menu、tabs、badge、table、calendar、popover、sheet、avatar、skeleton、progress、sonner、form、label、separator、tooltip

### 项目结构

```
src/
  lib/            supabase客户端、utils（金额/日期格式化）、常量（默认分类、付款方式）
  types/          TS 类型与 Supabase 表类型
  hooks/          useFamily、useLedgers、useTransactions、useCategories、useStats…
  context/        AuthProvider、FamilyProvider（当前家庭+当前账本）
  components/
    ui/           shadcn 组件
    layout/       侧边栏、底部Tab、账本切换器
    transaction/  记账表单、交易列表项、筛选栏
    stats/        图表卡片
  pages/          auth / dashboard / transactions / statistics / settings
  queries/        React Query 的 queryKey 与 query/mutation 封装（可选，或并入 hooks）
```

---

## 六、开发里程碑

| 里程碑 | 内容 | 验收标准 |
|---|---|---|
| M1 脚手架 | Vite + Tailwind + shadcn 初始化、Supabase 项目与表结构/RLS、Auth 注册登录、路由骨架 | 能注册登录并进入空应用 |
| M2 家庭 | 创建家庭、邀请码加入、成员列表、profiles 资料 | 两人可加入同一家庭 |
| M3 多账本 | 账本 CRUD、切换、默认账本、家庭初始化 seed | 可建多个账本并切换，记账数据按账本隔离 |
| M4 记账核心 | 分类管理、记账表单、交易列表、编辑删除、归属人展示 | 完成"记一笔 → 列表可见 → 可改可删"闭环 |
| M5 统计 | 仪表盘、统计页图表（占比/趋势/收支对比） | 数据正确反映 |
| M6 打磨 | 设置页完善、移动端适配、空态/加载态、部署（Vercel + Supabase） | 可上线使用 |

---

## 七、验收标准（V1 完成 = 可上线）

1. 两个人（夫妻）注册 → 加入同一家庭 → 各自记账 → 都能看到全部账单和统计
2. 一个家庭可建多个账本，切换后明细/统计互不串数据
3. 每笔账能看到是谁记的
4. 数据安全：非家庭成员无法通过 URL/API 访问家庭数据（RLS 生效）
5. 移动端可正常完成记账主流程
