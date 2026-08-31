import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-sm text-muted-foreground">家庭、账本、分类管理</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">M2/M3 开发中</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          家庭管理（成员 / 邀请码）、账本管理、分类管理将在这里实现。
        </CardContent>
      </Card>
    </div>
  )
}
