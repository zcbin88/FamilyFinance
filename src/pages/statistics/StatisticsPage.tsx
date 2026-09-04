import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import CategoryPie from '@/components/stats/CategoryPie'
import MemberStats from '@/components/stats/MemberStats'
import TrendChart from '@/components/stats/TrendChart'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useTransactions } from '@/hooks/useTransactions'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

export default function StatisticsPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  const { data: result, isLoading } = useTransactions(currentLedger?.id, month)

  const monthExpense = result?.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const monthIncome = result?.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    setMonth(format(new Date(y, m - 1 + delta, 1), 'yyyy-MM'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">统计</h1>
          <p className="text-sm text-muted-foreground">
            {currentLedger?.name ?? '…'} · 收支分析与趋势
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
            上月
          </Button>
          <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-24">
                <CalendarIcon className="size-4" />
                {month}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={new Date(`${month}-01T00:00:00`)}
                onSelect={(d) => {
                  if (d) {
                    setMonth(format(d, 'yyyy-MM'))
                    setMonthPickerOpen(false)
                  }
                }}
                locale={zhCN}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
            下月
          </Button>
        </div>
      </div>

      {/* 当月收支对比 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>支出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-bold text-green-600 sm:text-xl">
              -{isLoading ? '…' : formatMoney(monthExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>收入</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-bold text-red-600 sm:text-xl">
              +{isLoading ? '…' : formatMoney(monthIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>结余</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'truncate text-lg font-bold sm:text-xl',
                monthIncome - monthExpense < 0 && 'text-destructive',
              )}
            >
              {isLoading ? '…' : formatMoney(monthIncome - monthExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 近 6 个月趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>收支趋势</CardTitle>
          <CardDescription>近 6 个月支出 / 收入对比</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart ledgerId={currentLedger?.id} />
        </CardContent>
      </Card>

      {/* 分类占比 + 成员统计 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>支出构成</CardTitle>
            <CardDescription>{month} 支出分类占比</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPie familyId={family?.id} ledgerId={currentLedger?.id} month={month} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>成员统计</CardTitle>
            <CardDescription>{month} 各成员记录的支出 / 收入</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberStats familyId={family?.id} ledgerId={currentLedger?.id} month={month} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
