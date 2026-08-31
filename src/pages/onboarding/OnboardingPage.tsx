import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Loader2, LogOut, Users } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateFamily, useCurrentFamily, useJoinFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { data: family, isLoading } = useCurrentFamily()
  const createFamily = useCreateFamily()
  const joinFamily = useJoinFamily()

  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  // 已有家庭 → 直接进应用
  if (!isLoading && family) return <Navigate to="/" replace />

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = familyName.trim()
    if (!name) return
    try {
      await createFamily.mutateAsync(name)
      toast.success('家庭创建成功')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (!code) return
    try {
      await joinFamily.mutateAsync(code)
      toast.success('加入成功')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加入失败')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="size-6" />
          </div>
          <CardTitle className="text-2xl">创建或加入家庭</CardTitle>
          <CardDescription>一个家庭共享一本账本，先建一个家吧</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">创建家庭</TabsTrigger>
              <TabsTrigger value="join">加入家庭</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-name">家庭名称</Label>
                  <Input
                    id="family-name"
                    placeholder="例如：我们的小家"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createFamily.isPending || !familyName.trim()}
                >
                  {createFamily.isPending ? '创建中…' : '创建家庭'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-4">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">邀请码</Label>
                  <Input
                    id="invite-code"
                    placeholder="输入 6 位邀请码，如 ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono uppercase tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    邀请码在家庭成员首页可以找到
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={joinFamily.isPending || inviteCode.trim().length < 6}
                >
                  {joinFamily.isPending ? '加入中…' : '加入家庭'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Button variant="ghost" className="mt-4 text-muted-foreground" onClick={handleLogout}>
        <LogOut className="size-4" />
        退出登录
      </Button>
    </div>
  )
}
