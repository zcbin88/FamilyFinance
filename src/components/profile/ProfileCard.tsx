import { useState } from 'react'
import { toast } from 'sonner'
import { IonButton, IonIcon, IonInput } from '@ionic/react'
import { logOutOutline } from 'ionicons/icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  const [lastProfileName, setLastProfileName] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  // 资料异步加载后同步到输入框（render 期间调整状态模式）
  if (profile && profile.name !== lastProfileName) {
    setLastProfileName(profile.name)
    setName(profile.name)
  }

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
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-medium">
            {profile?.name ? initials(profile.name) : '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{profile?.name || '未设置昵称'}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <IonInput
            className="form-field"
            label="昵称"
            labelPlacement="stacked"
            value={name}
            onIonInput={(e) => setName(e.detail.value ?? '')}
            placeholder="你的昵称"
            maxlength={20}
          />
          <IonButton
            type="submit"
            expand="block"
            disabled={updateProfile.isPending || !name.trim() || unchanged}
          >
            {updateProfile.isPending ? '保存中…' : '保存'}
          </IonButton>
        </form>

        <div className="h-px bg-border" />

        <IonButton
          expand="block"
          fill="outline"
          color="danger"
          onClick={() => setLogoutOpen(true)}
        >
          <IonIcon slot="start" icon={logOutOutline} />
          退出登录
        </IonButton>
      </CardContent>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </Card>
  )
}
