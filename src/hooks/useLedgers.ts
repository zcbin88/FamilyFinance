import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Ledger } from '@/types/database'

export const ledgerKeys = {
  all: ['ledgers'] as const,
  list: (familyId: string) => [...ledgerKeys.all, 'list', familyId] as const,
}

/** 当前家庭的账本列表（不含软删除） */
export function useLedgers(familyId?: string | null) {
  return useQuery({
    queryKey: ledgerKeys.list(familyId ?? 'none'),
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledgers')
        .select('*')
        .eq('family_id', familyId!)
        .is('deleted_at', null)
        .order('created_at')
      if (error) throw error
      return data as Ledger[]
    },
  })
}

export type LedgerInput = {
  name: string
  icon: string
  color: string
  is_default?: boolean
}

/** 创建账本 */
export function useCreateLedger(familyId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LedgerInput) => {
      const { data, error } = await supabase
        .from('ledgers')
        .insert({ family_id: familyId!, ...input })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ledgerKeys.all }),
  })
}

/** 更新账本（重命名/改图标颜色/软删除） */
export function useUpdateLedger() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<Ledger, 'name' | 'icon' | 'color' | 'is_default' | 'deleted_at'>>) => {
      const { data, error } = await supabase
        .from('ledgers')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ledgerKeys.all }),
  })
}

/** 设置默认账本（先清空同家庭其他默认，再设目标） */
export function useSetDefaultLedger(familyId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: clearErr } = await supabase
        .from('ledgers')
        .update({ is_default: false })
        .eq('family_id', familyId!)
        .neq('id', id)
      if (clearErr) throw clearErr

      const { error: setErr } = await supabase
        .from('ledgers')
        .update({ is_default: true })
        .eq('id', id)
      if (setErr) throw setErr
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ledgerKeys.all }),
  })
}

/** 软删除账本 */
export function useDeleteLedger() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ledgers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ledgerKeys.all }),
  })
}
