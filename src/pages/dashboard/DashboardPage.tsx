import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLedgerContext } from '@/context/LedgerProvider'

export default function DashboardPage() {
  const { currentLedger } = useLedgerContext()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        <p className="text-sm text-muted-foreground">
          当前账本：{currentLedger?.name ?? '…'} · 本月收支概览
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">M2 开发中</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          家庭 / 账本数据接入后，这里将展示本月收支、结余、分类占比与最近交易。
        </CardContent>
      </Card>
    </div>
  )
}
