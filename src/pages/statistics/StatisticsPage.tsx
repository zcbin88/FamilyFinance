import { useState } from 'react'
import { format } from 'date-fns'
import { IonButton, IonIcon } from '@ionic/react'
import { calendarClearOutline, chevronBack, chevronForward } from 'ionicons/icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import MonthPickerSheet from '@/components/common/MonthPickerSheet'
import CategoryPie from '@/components/stats/CategoryPie'
import CategoryStats from '@/components/stats/CategoryStats'
import MemberStats from '@/components/stats/MemberStats'
import TrendChart from '@/components/stats/TrendChart'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useTransactions } from '@/hooks/useTransactions'
import { useMonthlyTrend } from '@/hooks/useStats'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

/** 环比提示：本月 vs 上月，颜色表达「好 / 坏」而非单纯的涨跌 */
function DeltaLabel({
  current,
  prev,
  goodWhenDown = false,
}: {
  current?: number
  prev?: number
  goodWhenDown?: boolean
}) {
  if (current == null || prev == null || prev === 0) return null
  const delta = ((current - prev) / prev) * 100
  if (!Number.isFinite(delta)) return null
  if (delta === 0) {
    return <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">较上月持平</p>
  }
  const up = delta > 0
  const good = goodWhenDown ? !up : up
  const arrow = up ? '↑' : '↓'
  return (
    <p className={cn('mt-0.5 text-xs tabular-nums', good ? 'text-green-600' : 'text-red-600')}>
      较上月 {arrow} {Math.abs(delta).toFixed(1)}%
    </p>
  )
}

export default function StatisticsPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [monthOpen, setMonthOpen] = useState(false)

  const { data: result, isLoading } = useTransactions(currentLedger?.id, month)
  const { data: trend } = useMonthlyTrend(currentLedger?.id, 6)

  const monthExpense = result?.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const monthIncome = result?.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0

  // 环比：趋势序列里最后两个月 = 本月 / 上月（与 TrendChart 共用同一缓存）
  const currentStat = trend?.at(-1)
  const prevStat = trend?.at(-2)

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    setMonth(format(new Date(y, m - 1 + delta, 1), 'yyyy-MM'))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {currentLedger?.name ?? '…'} · 收支分析与趋势
      </p>

      {/* 月份切换：IonDatetime month-year 原生月份选择 */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-1 py-1">
        <IonButton fill="clear" size="small" onClick={() => changeMonth(-1)} aria-label="上月">
          <IonIcon slot="icon-only" icon={chevronBack} />
        </IonButton>

        <IonButton fill="clear" size="small" onClick={() => setMonthOpen(true)}>
          <IonIcon slot="start" icon={calendarClearOutline} />
          {month}
        </IonButton>

        <IonButton fill="clear" size="small" onClick={() => changeMonth(1)} aria-label="下月">
          <IonIcon slot="icon-only" icon={chevronForward} />
        </IonButton>
      </div>

      <MonthPickerSheet
        isOpen={monthOpen}
        month={month}
        onClose={() => setMonthOpen(false)}
        onSelect={setMonth}
      />

      {/* 当月收支对比：
          手机上三列并排时空间极窄，通过「压缩间距 + 缩小内边距 + 长数字换行」
          让金额尽量完整展示，而不是被 truncate 截断 */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        <Card className="gap-1.5 py-3 [--card-spacing:--spacing(2)] sm:gap-4 sm:py-4 sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="pb-0.5">
            <CardDescription className="text-xs leading-tight sm:text-sm">支出</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[clamp(0.8125rem,3.8vw,1.25rem)] leading-tight font-bold break-all tabular-nums text-green-600">
              -{isLoading ? '…' : formatMoney(monthExpense)}
            </p>
            <DeltaLabel current={currentStat?.expense} prev={prevStat?.expense} goodWhenDown />
          </CardContent>
        </Card>
        <Card className="gap-1.5 py-3 [--card-spacing:--spacing(2)] sm:gap-4 sm:py-4 sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="pb-0.5">
            <CardDescription className="text-xs leading-tight sm:text-sm">收入</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[clamp(0.8125rem,3.8vw,1.25rem)] leading-tight font-bold break-all tabular-nums text-red-600">
              +{isLoading ? '…' : formatMoney(monthIncome)}
            </p>
            <DeltaLabel current={currentStat?.income} prev={prevStat?.income} />
          </CardContent>
        </Card>
        <Card className="gap-1.5 py-3 [--card-spacing:--spacing(2)] sm:gap-4 sm:py-4 sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="pb-0.5">
            <CardDescription className="text-xs leading-tight sm:text-sm">结余</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-[clamp(0.8125rem,3.8vw,1.25rem)] leading-tight font-bold break-all tabular-nums',
                monthIncome - monthExpense < 0 && 'text-destructive',
              )}
            >
              {isLoading ? '…' : formatMoney(monthIncome - monthExpense)}
            </p>
            <DeltaLabel
              current={(currentStat?.income ?? 0) - (currentStat?.expense ?? 0)}
              prev={(prevStat?.income ?? 0) - (prevStat?.expense ?? 0)}
            />
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

      {/* 当月分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle>分类统计</CardTitle>
          <CardDescription>{month} 各分类的支出 / 收入</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryStats familyId={family?.id} ledgerId={currentLedger?.id} month={month} />
        </CardContent>
      </Card>
    </div>
  )
}
