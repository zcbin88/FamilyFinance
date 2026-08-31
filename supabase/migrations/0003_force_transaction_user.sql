-- ============================================================
-- 0003: 交易记账人服务端强制写入
-- 前端 insert 时不传 user_id（类型上已排除），由触发器自动
-- 写为当前登录用户，防止冒充他人记账。
-- 配合 0002 的 insert 策略 with check (user_id = auth.uid()) 双重保障。
-- ============================================================

create or replace function public.set_transaction_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create trigger transactions_set_user
  before insert on public.transactions
  for each row execute function public.set_transaction_user();
