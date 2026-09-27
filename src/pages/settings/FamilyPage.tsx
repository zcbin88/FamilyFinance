import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Lock, Pencil } from 'lucide-react'
import { IonToggle } from '@ionic/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import RenameFamilyDialog from '@/components/family/RenameFamilyDialog'
import { useAuth } from '@/context/AuthProvider'
import { useCurrentFamily, useFamilyMembers, useToggleFamilyInvites } from '@/hooks/useFamily'

/** 自家庭创建起算的累计天数（首日计 1 天） */
function daysSince(createdAt: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000) + 1)
}

export default function FamilyPage() {
  const { user } = useAuth()
  const { data: family } = useCurrentFamily()
  const { data: members } = useFamilyMembers(family?.id)
  const [copied, setCopied] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const toggleInvites = useToggleFamilyInvites()

  if (!family) return null

  const isOwner = !!user && family.owner_id === user.id

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      toast.success('邀请码已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  const handleToggleInvite = async (enabled: boolean) => {
    try {
      await toggleInvites.mutateAsync({ id: family.id, invite_enabled: enabled })
      toast.success(enabled ? '已开启家庭邀请' : '已关闭家庭邀请，新成员将无法加入')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 家庭信息 */}
      <Card>
        <CardHeader>
          <CardTitle>家庭信息</CardTitle>
          <CardDescription>这个家的名字和成员</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-medium">{family.name}</p>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                title="修改家庭名称"
                onClick={() => setRenameOpen(true)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {members?.length ?? '…'} 位成员 · 财源广进 {daysSince(family.created_at)} 天
          </p>
        </CardContent>
      </Card>

      {/* 家庭邀请 */}
      <Card>
        <CardHeader>
          <CardTitle>家庭邀请</CardTitle>
          <CardDescription>邀请家人加入，一起记账</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwner && (
            <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">允许通过邀请码加入</p>
                <p className="text-xs text-muted-foreground">
                  {family.invite_enabled
                    ? '开启中 · 家人可凭邀请码加入'
                    : '已关闭 · 新成员无法加入'}
                </p>
              </div>
              <IonToggle
                checked={family.invite_enabled}
                onIonChange={(e) => handleToggleInvite(e.detail.checked)}
                disabled={toggleInvites.isPending}
                aria-label="切换家庭邀请"
              />
            </div>
          )}

          {family.invite_enabled ? (
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
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-muted-foreground">
              <div>
                <p className="text-xs">家庭邀请码</p>
                <p className="text-sm">邀请已关闭，新成员暂时无法加入</p>
              </div>
              <Lock className="size-4 shrink-0" />
            </div>
          )}
        </CardContent>
      </Card>

      <RenameFamilyDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        family={family}
      />
    </div>
  )
}
