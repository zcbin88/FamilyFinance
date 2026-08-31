import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">明细</h1>
        <p className="text-sm text-muted-foreground">交易记录列表</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">M4 开发中</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          记账表单与交易列表将在这里实现。
        </CardContent>
      </Card>
    </div>
  )
}
