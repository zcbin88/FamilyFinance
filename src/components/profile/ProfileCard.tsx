import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import LogoutDialog from '@/components/layout/LogoutDialog'
import { useAuth } from '@/context/AuthProvider'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

export default function ProfileCard() {
  const { user } = useAuth()
  const { data: profile } = useProfile(!!user)
  const updateProfile = useUpdateProfile()

  const [name, setName] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    if (profile) setName(profile.name)
  }, [profile])

  const unchanged = name.trim() === (profile?.name ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || unchanged) return
    try {
      await updateProfile.mutateAsync({ name: trimmed })
      toast.success('昵称已更新')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人信息</CardTitle>
        <CardDescription>修改昵称、管理账号</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">
              {profile?.name ? initials(profile.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{profile?.name || '未设置昵称'}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
              maxLength={20}
            />
          </div>
          <Button
            type="submit"
            disabled={updateProfile.isPending || !name.trim() || unchanged}
          >
            {updateProfile.isPending ? '保存中…' : '保存'}
          </Button>
        </form>

        <Separator />

        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="size-4" />
          退出登录
        </Button>
      </CardContent>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </Card>
  )
}
