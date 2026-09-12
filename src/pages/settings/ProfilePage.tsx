import { useNavigate } from 'react-router'
import { IonButton, IonIcon } from '@ionic/react'
import { arrowBack } from 'ionicons/icons'
import ProfileCard from '@/components/profile/ProfileCard'

export default function ProfilePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <IonButton
          fill="clear"
          size="small"
          aria-label="返回"
          onClick={() => navigate('/settings')}
        >
          <IonIcon slot="icon-only" icon={arrowBack} />
        </IonButton>
        <div>
          <h1 className="text-2xl font-semibold">账号信息</h1>
          <p className="text-sm text-muted-foreground">修改昵称、管理账号</p>
        </div>
      </div>

      <ProfileCard />
    </div>
  )
}
