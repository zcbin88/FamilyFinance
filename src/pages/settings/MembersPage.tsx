import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentFamily, useFamilyMembers } from '@/hooks/useFamily'

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

export default function MembersPage() {
  const { data: family } = useCurrentFamily()
  const { data: members, isLoading } = useFamilyMembers(family?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>家庭成员</CardTitle>
        <CardDescription>每位成员都能查看和记录家庭账单</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
  )
}
