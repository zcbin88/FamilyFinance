-- ============================================================
-- 0005: 账单编辑权从「仅记账人本人」放开为「家庭成员均可」
-- 背景：家庭共享账本中，房主/其他成员经常需要纠正分类、金额等，
-- 原策略「user_id = auth.uid()」会静默拒绝（0 行受影响，不报错），
-- 导致前端显示成功但实际未修改。删除权本就是全员可删，编辑权放开保持一致。
-- 注意：前端不发送 user_id，因此「记账人」字段保持不变。
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行
-- ============================================================

drop policy if exists "transactions_update_recorder" on public.transactions;

create policy "transactions_update_member" on public.transactions
  for update using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));
