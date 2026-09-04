-- ============================================================
-- 0004: 家庭邀请可选开关（防止恶意加入）
-- families 新增 invite_enabled（默认开启）；
-- 房主可关闭，关闭后 join_family_by_invite 一律拒绝新成员
-- ============================================================

alter table public.families
  add column invite_enabled boolean not null default true;

-- 凭邀请码加入：校验邀请码 → 校验开关 → 插入成员 → 返回家庭 id
create or replace function public.join_family_by_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid         uuid;
  inv_enabled boolean;
begin
  select id, invite_enabled into fid, inv_enabled
  from public.families
  where invite_code = upper(trim(code));

  if fid is null then
    raise exception '邀请码无效';
  end if;

  if not inv_enabled then
    raise exception '该家庭已关闭邀请，无法加入';
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
