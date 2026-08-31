-- ============================================================
-- 0002: 修复 RLS 无限递归 + 增加家庭加入/创建 RPC
-- 问题：0001 的策略在子查询中直接引用 family_members 自身，
-- 触发无限递归（infinite recursion detected in policy）
-- 方案：使用 security definer 辅助函数封装成员校验，绕过 RLS 递归
-- ============================================================

-- ---------- 1. 辅助函数（security definer，内部查询不触发 RLS） ----------
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_owner(fid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ---------- 2. 重写所有受影响策略 ----------

-- profiles
drop policy if exists "profiles_select_self_or_family" on public.profiles;
create policy "profiles_select_self_or_family" on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.family_members fm
      where fm.user_id = profiles.id and public.is_family_member(fm.family_id)
    )
  );

-- families：创建/加入统一走 RPC（见下方），移除直接插入策略
drop policy if exists "families_insert_authenticated" on public.families;
drop policy if exists "families_select_member" on public.families;
create policy "families_select_member" on public.families
  for select using (public.is_family_member(id));
drop policy if exists "families_update_owner" on public.families;
create policy "families_update_owner" on public.families
  for update using (auth.uid() = owner_id and public.is_family_member(id));

-- family_members：移除直接插入（加入走 RPC）
drop policy if exists "family_members_select" on public.family_members;
create policy "family_members_select" on public.family_members
  for select using (public.is_family_member(family_id));
drop policy if exists "family_members_insert_join" on public.family_members;
drop policy if exists "family_members_update_owner" on public.family_members;
create policy "family_members_update_owner" on public.family_members
  for update using (public.is_family_owner(family_id));
drop policy if exists "family_members_delete" on public.family_members;
create policy "family_members_delete" on public.family_members
  for delete using (
    auth.uid() = user_id
    or public.is_family_owner(family_id)
  );

-- ledgers
drop policy if exists "ledgers_all_member" on public.ledgers;
create policy "ledgers_all_member" on public.ledgers
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

-- categories
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (
    categories.family_id is null or public.is_family_member(categories.family_id)
  );
drop policy if exists "categories_all_member" on public.categories;
create policy "categories_all_member" on public.categories
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

-- transactions
drop policy if exists "transactions_select_member" on public.transactions;
create policy "transactions_select_member" on public.transactions
  for select using (public.is_family_member(family_id));
drop policy if exists "transactions_insert_member" on public.transactions;
create policy "transactions_insert_member" on public.transactions
  for insert with check (
    user_id = auth.uid() and public.is_family_member(family_id)
  );
drop policy if exists "transactions_update_recorder" on public.transactions;
create policy "transactions_update_recorder" on public.transactions
  for update using (
    user_id = auth.uid() and public.is_family_member(family_id)
  )
  with check (
    user_id = auth.uid() and public.is_family_member(family_id)
  );
drop policy if exists "transactions_delete_member" on public.transactions;
create policy "transactions_delete_member" on public.transactions
  for delete using (public.is_family_member(family_id));

-- ---------- 3. 家庭创建 / 邀请码加入 RPC（security definer 原子操作） ----------

-- 创建家庭：建家庭 + 房主成员关系（families 的 seed 触发器会自动建默认账本和分类）
create or replace function public.create_family(family_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  insert into public.families (name, owner_id)
  values (family_name, auth.uid())
  returning id into fid;

  insert into public.family_members (family_id, user_id, role)
  values (fid, auth.uid(), 'owner');

  return fid;
end;
$$;

-- 凭邀请码加入家庭：校验邀请码 → 插入成员 → 返回家庭 id
create or replace function public.join_family_by_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  select id into fid
  from public.families
  where invite_code = upper(trim(code));

  if fid is null then
    raise exception '邀请码无效';
  end if;

  if not exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  ) then
    insert into public.family_members (family_id, user_id, role)
    values (fid, auth.uid(), 'member');
  end if;

  return fid;
end;
$$;

-- 默认公开执行权限（安全起见显式声明）
revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.is_family_owner(uuid) from public;
revoke all on function public.create_family(text) from public;
revoke all on function public.join_family_by_invite(text) from public;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family_by_invite(text) to authenticated;
