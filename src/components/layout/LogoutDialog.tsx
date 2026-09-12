import { toast } from 'sonner'
import { IonAlert } from '@ionic/react'
import { supabase } from '@/lib/supabase'

/** 退出登录确认：Ionic 原生 Alert */
export default function LogoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    onOpenChange(false)
  }

  return (
    <IonAlert
      isOpen={open}
      header="退出登录？"
      message="退出后需要重新输入邮箱和密码才能继续使用。"
      buttons={[
        { text: '取消', role: 'cancel' },
        { text: '退出登录', role: 'destructive', handler: handleLogout },
      ]}
      onDidDismiss={() => onOpenChange(false)}
    />
  )
}
