import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">统计</h1>
        <p className="text-sm text-muted-foreground">收支趋势与分类占比</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">M5 开发中</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          趋势图、分类占比图、收支对比将在这里展示。
        </CardContent>
      </Card>
    </div>
  )
}
