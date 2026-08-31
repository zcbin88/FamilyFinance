import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMonths, format, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Profile, Transaction } from '@/types/database'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (ledgerId: string, month: string) =>
    [...transactionKeys.all, 'list', ledgerId, month] as const,
}

export interface TransactionQueryResult {
  transactions: Transaction[]
  profileMap: Map<string, Pick<Profile, 'id' | 'name' | 'avatar_url'>>
}

/** 某账本某月的交易（occurred_at 在 [月初, 下月初)），附带记账人资料 */
export function useTransactions(ledgerId?: string | null, month?: string) {
  return useQuery({
    queryKey: transactionKeys.list(ledgerId ?? 'none', month ?? 'none'),
    enabled: !!ledgerId && !!month,
    queryFn: async (): Promise<TransactionQueryResult> => {
      const start = startOfMonth(new Date(`${month}-01T00:00:00`))
      const end = addMonths(start, 1)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('ledger_id', ledgerId!)
        .gte('occurred_at', format(start, 'yyyy-MM-dd'))
        .lt('occurred_at', format(end, 'yyyy-MM-dd'))
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error

      const transactions = data as Transaction[]

      // 查询涉及记账人的资料
      const userIds = [...new Set(transactions.map((t) => t.user_id))]
      let profileMap = new Map<string, Pick<Profile, 'id' | 'name' | 'avatar_url'>>()
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds)
        if (pErr) throw pErr
        profileMap = new Map(profiles.map((p) => [p.id, p]))
      }

      return { transactions, profileMap }
    },
  })
}

export type TransactionInput = {
  category_id: string
  type: 'expense' | 'income'
  amount: number // 分
  note?: string
  pay_method?: string | null
  occurred_at: string
}

/** 新增交易（family_id/ledger_id 由 hook 补全，user_id 由服务端触发器写入） */
export function useCreateTransaction(familyId?: string | null, ledgerId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .insert({ family_id: familyId!, ledger_id: ledgerId!, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

/** 更新交易（仅记账人本人可改，RLS 保证） */
export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Omit<TransactionInput, 'ledger_id'>>) => {
      const { error } = await supabase.from('transactions').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

/** 删除交易（家庭成员可删） */
export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}
