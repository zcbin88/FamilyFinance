import { useQuery } from '@tanstack/react-query'
import { addMonths, format, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'

export interface MonthStat {
  /** yyyy-MM */
  month: string
  expense: number // 分
  income: number // 分
}

export const statsKeys = {
  trend: (ledgerId: string, months: number) => ['stats', 'trend', ledgerId, months] as const,
}

/**
 * 某账本最近 N 个月的收支趋势。
 * 一次查询 [N 个月前月初, 今天] 的所有交易，前端按月份聚合。
 */
export function useMonthlyTrend(ledgerId?: string | null, months = 6) {
  return useQuery({
    queryKey: statsKeys.trend(ledgerId ?? 'none', months),
    enabled: !!ledgerId,
    queryFn: async (): Promise<MonthStat[]> => {
      const start = startOfMonth(addMonths(new Date(), -(months - 1)))

      const { data, error } = await supabase
        .from('transactions')
        .select('occurred_at, type, amount')
        .eq('ledger_id', ledgerId!)
        .gte('occurred_at', format(start, 'yyyy-MM-dd'))
      if (error) throw error

      const byMonth = new Map<string, { expense: number; income: number }>()
      for (const tx of data ?? []) {
        const key = tx.occurred_at.slice(0, 7)
        const entry = byMonth.get(key) ?? { expense: 0, income: 0 }
        if (tx.type === 'expense') entry.expense += tx.amount
        else entry.income += tx.amount
        byMonth.set(key, entry)
      }

      // 补全空月份，保持序列连续
      const result: MonthStat[] = []
      for (let i = 0; i < months; i++) {
        const d = addMonths(start, i)
        const key = format(d, 'yyyy-MM')
        const entry = byMonth.get(key)
        result.push({ month: key, expense: entry?.expense ?? 0, income: entry?.income ?? 0 })
      }
      return result
    },
  })
}
