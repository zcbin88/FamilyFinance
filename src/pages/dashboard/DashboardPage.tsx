import { useMemo } from 'react'
import { Link } from 'react-router'
import { format } from 'date-fns'
import { ArrowRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import CategoryPie from '@/components/stats/CategoryPie'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()
  const month = format(new Date(), 'yyyy-MM')

  const { data: categories } = useCategories(family?.id)
  const { data: result, isLoading } = useTransactions(currentLedger?.id, month)

  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c])),
    [categories],
  )

  const monthExpense = result?.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const monthIncome = result?.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const balance = monthIncome - monthExpense

  const recent = result?.transactions.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      {/* 账本 / 月份：仅一行，不占额外空间 */}
      <p className="text-sm text-muted-foreground">
        {currentLedger?.name ?? '…'} · {month}
      </p>

      {/* 本月概览 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本月支出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              -{isLoading ? '…' : formatMoney(monthExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本月收入</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              +{isLoading ? '…' : formatMoney(monthIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本月结余</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', balance < 0 && 'text-destructive')}>
              {isLoading ? '…' : formatMoney(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 最近交易 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
            <CardDescription>本月的最近 5 笔</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions">
                  全部
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <Wallet className="size-10" />
                <p className="text-sm">本月还没有账单</p>
                <Button size="sm" asChild>
                  <Link to="/transactions/new">记第一笔</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recent.map((tx) => {
                  const cat = categoryMap.get(tx.category_id)
                  const recorder = result?.profileMap.get(tx.user_id)
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-3">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cat?.color ?? '#6b7280'}1f` }}
                      >
                        <CategoryIcon icon={cat?.icon ?? 'ellipsis'} color={cat?.color} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3">
                          <p className="m-0 min-w-0 flex-1 truncate text-sm font-medium">
                            {cat?.name ?? '未知分类'}
                          </p>
                          <span
                            className={cn(
                              'shrink-0 text-sm font-semibold tabular-nums',
                              tx.type === 'expense' ? 'text-green-600' : 'text-red-600',
                            )}
                          >
                            {tx.type === 'expense' ? '-' : '+'}
                            {formatMoney(tx.amount)}
                          </span>
                        </div>
                        <p className="m-0 mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="min-w-0 flex-1 truncate">{tx.note}</span>
                          <span className="shrink-0">
                            {recorder?.name ?? '未知'} · {tx.occurred_at.slice(5)}
                          </span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 分类占比 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>支出构成</CardTitle>
            <CardDescription>本月支出分类占比</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPie familyId={family?.id} ledgerId={currentLedger?.id} month={month} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
