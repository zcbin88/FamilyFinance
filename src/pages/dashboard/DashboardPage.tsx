import { useMemo } from 'react'
import { Link } from 'react-router'
import { format } from 'date-fns'
import { ArrowRight, Wallet } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
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
      <div>
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        <p className="text-sm text-muted-foreground">
          {currentLedger?.name ?? '…'} · {month}
        </p>
      </div>

      {/* 本月概览 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本月支出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              -{isLoading ? '…' : formatMoney(monthExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本月收入</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
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
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>最近交易</CardTitle>
              <CardDescription>本月的最近 5 笔</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/transactions">
                全部
                <ArrowRight className="size-4" />
              </Link>
            </Button>
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
                    <li key={tx.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cat?.color ?? '#6b7280'}1f` }}
                      >
                        <CategoryIcon icon={cat?.icon ?? 'ellipsis'} color={cat?.color} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {cat?.name ?? '未知分类'}
                          {tx.note && (
                            <span className="ml-2 font-normal text-muted-foreground">{tx.note}</span>
                          )}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Avatar className="size-3.5">
                            <AvatarFallback className="text-[8px]">
                              {(recorder?.name ?? '?').slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          {recorder?.name ?? '未知'} · {tx.occurred_at.slice(5)}
                        </p>
                      </div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          tx.type === 'expense' ? 'text-destructive' : 'text-emerald-600',
                        )}
                      >
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatMoney(tx.amount)}
                      </p>
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
