import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Crown, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import LedgerManager from '@/components/ledger/LedgerManager'
import CategoryManager from '@/components/category/CategoryManager'
import ProfileCard from '@/components/profile/ProfileCard'
import { useCurrentFamily, useFamilyMembers } from '@/hooks/useFamily'

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

export default function SettingsPage() {
  const { data: family, isLoading: familyLoading } = useCurrentFamily()
  const { data: members, isLoading: membersLoading } = useFamilyMembers(family?.id)
  const [copied, setCopied] = useState(false)

  async function copyInviteCode() {
    if (!family) return
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      toast.success('邀请码已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-sm text-muted-foreground">个人信息、家庭、账本、分类管理</p>
      </div>

      {/* 个人信息（不依赖家庭，始终可用） */}
      <ProfileCard />

      {familyLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !family ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Users className="size-10" />
          <p>还没有加入任何家庭</p>
        </div>
      ) : (
        <>
          {/* 家庭信息 */}
      <Card>
        <CardHeader>
          <CardTitle>我的家庭</CardTitle>
          <CardDescription>邀请家人加入，一起记账</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-medium">{family.name}</p>
              <p className="text-sm text-muted-foreground">
                {members?.length ?? '…'} 位成员
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">家庭邀请码</p>
              <p className="font-mono text-xl font-semibold tracking-[0.3em]">
                {family.invite_code}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              <Copy className="size-4" />
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 成员列表 */}
      <Card>
        <CardHeader>
          <CardTitle>家庭成员</CardTitle>
          <CardDescription>每位成员都能查看和记录家庭账单</CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ul className="divide-y">
              {members?.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.profile?.name ? initials(member.profile.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.profile?.name || '未设置昵称'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.profile?.id.slice(0, 8)}
                    </p>
                  </div>
                  {member.role === 'owner' ? (
                    <Badge className="gap-1">
                      <Crown className="size-3" />
                      房主
                    </Badge>
                  ) : (
                    <Badge variant="secondary">成员</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 账本管理 */}
        <LedgerManager />

        {/* 分类管理 */}
        <CategoryManager />
        </>
      )}
    </div>
  )
}
