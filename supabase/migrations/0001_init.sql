-- ============================================================
-- 家庭账本 · 初始化 Schema（V1）
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行，
-- 或本地 CLI: supabase db push
-- ============================================================

-- ---------- 扩展 ----------
create extension if not exists pgcrypto;

-- ---------- 1. profiles（用户资料，与 auth.users 一对一） ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- 注册时自动创建资料行
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. families（家庭） ----------
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

-- 自动生成 6 位邀请码
create or replace function public.generate_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    loop
      new.invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (select 1 from public.families where invite_code = new.invite_code);
    end loop;
  end if;
  return new;
end;
$$;

create trigger families_generate_invite_code
  before insert on public.families
  for each row execute function public.generate_invite_code();

-- ---------- 3. family_members（家庭成员） ----------
create table public.family_members (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

-- ---------- 4. ledgers（账本，属于家庭） ----------
create table public.ledgers (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  name       text not null,
  icon       text not null default 'book',
  color      text not null default '#3b82f6',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz -- 软删除
);

-- ---------- 5. categories（分类，属于家庭；family_id 为 NULL 表示系统内置） ----------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid references public.families (id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('expense', 'income')),
  icon       text not null default 'tag',
  color      text not null default '#6b7280',
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  unique (family_id, name, type)
);

-- ---------- 6. transactions（交易记录，核心表） ----------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  ledger_id   uuid not null references public.ledgers (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type        text not null check (type in ('expense', 'income')),
  amount      integer not null check (amount > 0), -- 单位：分
  note        text not null default '',
  pay_method  text,
  occurred_at date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- 7. 索引 ----------
create index idx_transactions_ledger_date on public.transactions (ledger_id, occurred_at desc);
create index idx_transactions_family      on public.transactions (family_id);
create index idx_categories_family_type   on public.categories (family_id, type);
create index idx_family_members_user      on public.family_members (user_id);
create index idx_ledgers_family           on public.ledgers (family_id) where deleted_at is null;

-- ---------- 8. 新家庭初始化：默认账本 + 默认分类 ----------
create or replace function public.seed_family_data()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 默认账本
  insert into public.ledgers (family_id, name, icon, color, is_default)
  values (new.id, '日常账本', 'book', '#3b82f6', true);

  -- 默认支出分类
  insert into public.categories (family_id, name, type, icon, color, sort_order) values
    (new.id, '餐饮',   'expense', 'utensils',  '#f97316', 10),
    (new.id, '交通',   'expense', 'car',       '#0ea5e9', 20),
    (new.id, '购物',   'expense', 'shopping-bag', '#ec4899', 30),
    (new.id, '住房',   'expense', 'home',      '#8b5cf6', 40),
    (new.id, '水电燃气','expense', 'zap',      '#eab308', 50),
    (new.id, '通讯',   'expense', 'smartphone','#14b8a6', 60),
    (new.id, '医疗',   'expense', 'heart-pulse','#ef4444', 70),
    (new.id, '娱乐',   'expense', 'clapperboard','#a855f7', 80),
    (new.id, '教育',   'expense', 'graduation-cap','#6366f1', 90),
    (new.id, '人情',   'expense', 'gift',      '#f43f5e', 100),
    (new.id, '旅行',   'expense', 'plane',     '#06b6d4', 110),
    (new.id, '其他',   'expense', 'ellipsis',  '#6b7280', 120);

  -- 默认收入分类
  insert into public.categories (family_id, name, type, icon, color, sort_order) values
    (new.id, '工资',   'income', 'banknote',   '#22c55e', 10),
    (new.id, '奖金',   'income', 'trophy',     '#f59e0b', 20),
    (new.id, '理财',   'income', 'trending-up','#10b981', 30),
    (new.id, '兼职',   'income', 'briefcase',  '#84cc16', 40),
    (new.id, '其他',   'income', 'ellipsis',   '#6b7280', 50);

  return new;
end;
$$;

create trigger families_seed_data
  after insert on public.families
  for each row execute function public.seed_family_data();

-- ============================================================
-- 9. RLS：所有业务表仅家庭成员可读写
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.ledgers        enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;

-- profiles：自己可读写；家庭成员可读（展示记账人）
create policy "profiles_select_self_or_family" on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.family_members fm
      join public.family_members mine on mine.family_id = fm.family_id
      where mine.user_id = auth.uid() and fm.user_id = profiles.id
    )
  );
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- families：成员可读，创建者可写
create policy "families_select_member" on public.families
  for select using (
    exists (select 1 from public.family_members fm where fm.family_id = families.id and fm.user_id = auth.uid())
  );
create policy "families_insert_authenticated" on public.families
  for insert with check (auth.uid() = owner_id);
create policy "families_update_owner" on public.families
  for update using (
    auth.uid() = owner_id
    and exists (select 1 from public.family_members fm where fm.family_id = families.id and fm.user_id = auth.uid())
  );

-- family_members：成员可读；任何登录用户可加入（凭邀请码）；owner 可管理；本人可退出
create policy "family_members_select" on public.family_members
  for select using (
    exists (select 1 from public.family_members mine where mine.family_id = family_members.family_id and mine.user_id = auth.uid())
  );
create policy "family_members_insert_join" on public.family_members
  for insert with check (auth.uid() = user_id);
create policy "family_members_update_owner" on public.family_members
  for update using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.role = 'owner'
    )
  );
create policy "family_members_delete" on public.family_members
  for delete using (
    auth.uid() = user_id  -- 本人退出
    or exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.role = 'owner'
    )
  );

-- ledgers：家庭成员可读写
create policy "ledgers_all_member" on public.ledgers
  for all using (
    exists (select 1 from public.family_members fm where fm.family_id = ledgers.family_id and fm.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.family_members fm where fm.family_id = ledgers.family_id and fm.user_id = auth.uid())
  );

-- categories：家庭成员可读写；系统内置分类（family_id 为 NULL）所有登录用户可读
create policy "categories_select" on public.categories
  for select using (
    categories.family_id is null
    or exists (select 1 from public.family_members fm where fm.family_id = categories.family_id and fm.user_id = auth.uid())
  );
create policy "categories_all_member" on public.categories
  for all using (
    exists (select 1 from public.family_members fm where fm.family_id = categories.family_id and fm.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.family_members fm where fm.family_id = categories.family_id and fm.user_id = auth.uid())
  );

-- transactions：家庭成员可读；记账人强制为当前用户（不可冒充/篡改）；
-- 记账人本人可修改，任何成员可删除错账
create policy "transactions_select_member" on public.transactions
  for select using (
    exists (select 1 from public.family_members fm where fm.family_id = transactions.family_id and fm.user_id = auth.uid())
  );
create policy "transactions_insert_member" on public.transactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.family_members fm where fm.family_id = transactions.family_id and fm.user_id = auth.uid())
  );
create policy "transactions_update_recorder" on public.transactions
  for update using (
    user_id = auth.uid()
    and exists (select 1 from public.family_members fm where fm.family_id = transactions.family_id and fm.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.family_members fm where fm.family_id = transactions.family_id and fm.user_id = auth.uid())
  );
create policy "transactions_delete_member" on public.transactions
  for delete using (
    exists (select 1 from public.family_members fm where fm.family_id = transactions.family_id and fm.user_id = auth.uid())
  );
