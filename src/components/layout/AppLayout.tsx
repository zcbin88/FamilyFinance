import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import {
  add,
  barChartOutline,
  gridOutline,
  listOutline,
  settingsOutline,
} from 'ionicons/icons'
import LedgerSwitcher from '@/components/layout/LedgerSwitcher'
import { useCurrentFamily } from '@/hooks/useFamily'

const TABS = [
  { path: '/', label: '首页', icon: gridOutline, end: true },
  { path: '/transactions', label: '明细', icon: listOutline, end: false },
  { path: '/statistics', label: '统计', icon: barChartOutline, end: false },
  { path: '/settings', label: '设置', icon: settingsOutline, end: false },
]

function isActive(pathname: string, path: string, end: boolean) {
  return end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data: family } = useCurrentFamily()

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="text-base font-semibold">
            {family?.name || '家庭账本'}
          </IonTitle>
          <IonButtons slot="end">
            <LedgerSwitcher />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
          <Outlet />
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="center">
          <IonFabButton onClick={() => navigate('/transactions/new')} aria-label="记一笔">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonTabBar>
        {TABS.map((tab) => (
          <IonTabButton
            key={tab.path}
            tab={tab.path}
            selected={isActive(pathname, tab.path, tab.end)}
            onClick={() => navigate(tab.path)}
          >
            <IonIcon icon={tab.icon} />
            <IonLabel className="text-xs">{tab.label}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonPage>
  )
}
