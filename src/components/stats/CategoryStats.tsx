import { useMemo, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types/database'

interface CategoryRow {
  categoryId: string
  name: string
  icon: string
  color: string
  /** 分 */
  expense: number
  /** 分 */
  income: number
  expenseCount: number
  incomeCount: number
}

/** 分类统计：某账本某月，按分类聚合支出 / 收入 / 笔数（样式对齐成员统计） */
export default function CategoryStats({
  familyId,
  ledgerId,
  month,
}: {
  familyId?: string | null
  ledgerId?: string | null
  month: string
}) {
  const { data: categories, isLoading: categoriesLoading } = useCategories(familyId)
  const { data: result, isLoading: txLoading } = useTransactions(ledgerId, month)

  const [type, setType] = useState<TransactionType>('expense')

  const rows = useMemo<CategoryRow[]>(() => {
    if (!categories || !result) return []
    const catMap = new Map(categories.map((c) => [c.id, c]))

    const agg = new Map<
      string,
      { expense: number; income: number; expenseCount: number; incomeCount: number }
    >()
    for (const tx of result.transactions) {
      const a =
        agg.get(tx.category_id) ??
        { expense: 0, income: 0, expenseCount: 0, incomeCount: 0 }
      if (tx.type === 'expense') {
        a.expense += tx.amount
        a.expenseCount += 1
      } else {
        a.income += tx.amount
        a.incomeCount += 1
      }
      agg.set(tx.category_id, a)
    }

    const list: CategoryRow[] = []
    for (const [categoryId, a] of agg) {
      const cat = catMap.get(categoryId)
      if (!cat) continue
      list.push({ categoryId, name: cat.name, icon: cat.icon, color: cat.color, ...a })
    }
    return list
  }, [categories, result])

  const isExpense = type === 'expense'
  const visible = rows
    .filter((r) => (isExpense ? r.expenseCount : r.incomeCount) > 0)
    .sort((x, y) => (isExpense ? y.expense - x.expense : y.income - x.income) || x.name.localeCompare(y.name))

  const total = visible.reduce((s, r) => s + (isExpense ? r.expense : r.income), 0)
  const totalCount = visible.reduce((s, r) => s + (isExpense ? r.expenseCount : r.incomeCount), 0)

  if (categoriesLoading || txLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">支出</TabsTrigger>
          <TabsTrigger value="income">收入</TabsTrigger>
        </TabsList>
      </Tabs>

      {totalCount === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {month} 还没有{isExpense ? '支出' : '收入'}账单，去记一笔吧
        </p>
      ) : (
        <ul className="divide-y">
          {visible.map((row) => {
            const amount = isExpense ? row.expense : row.income
            const count = isExpense ? row.expenseCount : row.incomeCount
            const other = isExpense ? row.income : row.expense
            const share = total > 0 ? Math.round((amount / total) * 100) : 0
            return (
              <li key={row.categoryId} className="flex items-center gap-3 py-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${row.color}1f` }}
                >
                  <CategoryIcon icon={row.icon} color={row.color} className="size-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p
                      className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        isExpense ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {isExpense ? '-' : '+'}
                      {formatMoney(amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress
                      value={share}
                      className={cn(
                        'h-1.5',
                        total > 0 && (isExpense ? '[&>div]:bg-green-600' : '[&>div]:bg-red-600'),
                      )}
                    />
                    {total > 0 && (
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {share}%
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{count} 笔</span>
                    {other > 0 && (
                      <span>
                        {isExpense ? '收入' : '支出'}{' '}
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            isExpense ? 'text-red-600' : 'text-green-600',
                          )}
                        >
                          {isExpense ? '+' : '-'}
                          {formatMoney(other)}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
