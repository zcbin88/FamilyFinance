import { useState } from 'react'
import { format } from 'date-fns'
import { IonButton, IonDatetime, IonIcon, IonModal } from '@ionic/react'
import { calendarClearOutline, chevronBack, chevronForward } from 'ionicons/icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  const [monthOpen, setMonthOpen] = useState(false)

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
      <div>
        <h1 className="text-2xl font-semibold">统计</h1>
        <p className="text-sm text-muted-foreground">
          {currentLedger?.name ?? '…'} · 收支分析与趋势
        </p>
      </div>

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

      <IonModal isOpen={monthOpen} onDidDismiss={() => setMonthOpen(false)}>
        <IonDatetime
          presentation="month-year"
          locale="zh-CN"
          value={month}
          onIonChange={(e) => {
            const v = e.detail.value
            if (typeof v === 'string' && v) {
              setMonth(v.slice(0, 7))
              setMonthOpen(false)
            }
          }}
        />
      </IonModal>

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
