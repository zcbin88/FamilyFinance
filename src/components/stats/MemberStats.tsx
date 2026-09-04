import { useMemo } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useFamilyMembers } from '@/hooks/useFamily'
import { useTransactions } from '@/hooks/useTransactions'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

interface MemberRow {
  userId: string
  name: string
  /** 分 */
  expense: number
  /** 分 */
  income: number
  /** 笔数 */
  count: number
}

/** 成员统计：某账本某月，按记账人（家庭成员）聚合支出 / 收入 / 笔数 */
export default function MemberStats({
  familyId,
  ledgerId,
  month,
}: {
  familyId?: string | null
  ledgerId?: string | null
  month: string
}) {
  const { data: members, isLoading: membersLoading } = useFamilyMembers(familyId)
  const { data: result, isLoading: txLoading } = useTransactions(ledgerId, month)

  const rows = useMemo<MemberRow[]>(() => {
    if (!members || !result) return []

    const agg = new Map<string, { expense: number; income: number; count: number }>()
    for (const tx of result.transactions) {
      const a = agg.get(tx.user_id) ?? { expense: 0, income: 0, count: 0 }
      if (tx.type === 'expense') a.expense += tx.amount
      else a.income += tx.amount
      a.count += 1
      agg.set(tx.user_id, a)
    }

    // 当前家庭成员 + 已退出但仍留下记录的旧成员，保证合计与月度汇总一致
    const seen = new Set<string>()
    const list: MemberRow[] = []
    const push = (userId: string, name: string) => {
      if (seen.has(userId)) return
      seen.add(userId)
      const a = agg.get(userId) ?? { expense: 0, income: 0, count: 0 }
      list.push({ userId, name, ...a })
    }
    for (const m of members) push(m.user_id, m.profile?.name ?? '未设置昵称')
    for (const tx of result.transactions) {
      push(tx.user_id, result.profileMap.get(tx.user_id)?.name ?? '未知成员')
    }

    return list.sort(
      (x, y) => y.expense - x.expense || y.income - x.income || x.name.localeCompare(y.name),
    )
  }, [members, result])

  const totalExpense = rows.reduce((s, r) => s + r.expense, 0)
  const totalCount = rows.reduce((s, r) => s + r.count, 0)

  if (membersLoading || txLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (totalCount === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {month} 还没有账单，去记一笔吧
      </p>
    )
  }

  return (
    <ul className="divide-y">
      {rows.map((row) => {
        const hasActivity = row.count > 0
        const share = totalExpense > 0 ? Math.round((row.expense / totalExpense) * 100) : 0
        return (
          <li key={row.userId} className="flex items-center gap-3 py-3">
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">
                {row.name.trim().slice(0, 1).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold tabular-nums',
                    hasActivity && row.expense > 0 ? 'text-green-600' : 'text-muted-foreground',
                  )}
                >
                  {hasActivity && row.expense > 0 ? '-' : ''}
                  {formatMoney(row.expense)}
                </p>
              </div>

              {hasActivity ? (
                <>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={share}
                      className={cn('h-1.5', totalExpense > 0 && '[&>div]:bg-green-600')}
                    />
                    {totalExpense > 0 && (
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {share}%
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.count} 笔</span>
                    {row.income > 0 && (
                      <span>
                        收入{' '}
                        <span className="font-medium tabular-nums text-red-600">
                          +{formatMoney(row.income)}
                        </span>
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">本月未记账</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
