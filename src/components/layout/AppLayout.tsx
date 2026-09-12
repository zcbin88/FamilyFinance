import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  IonButtons,
  IonContent,
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
      </IonContent>

      {/* 底部导航：IonTabBar 有 contain:strict 会裁剪溢出，
          所以凸起按钮必须放在 TabBar 外层的相对容器里做绝对定位 */}
      <div className="relative">
        <IonTabBar>
          {TABS.slice(0, 2).map((tab) => (
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

          {/* 给中间凸起按钮留位 */}
          <div className="w-16 shrink-0" aria-hidden="true" />

          {TABS.slice(2).map((tab) => (
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

        {/* 居中凸起「记一笔」 */}
        <button
          type="button"
          onClick={() => navigate('/transactions/new')}
          aria-label="记一笔"
          className="absolute left-1/2 top-0 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <IonIcon icon={add} className="text-2xl" />
          <span className="text-[10px] font-medium leading-none">记账</span>
        </button>
      </div>
    </IonPage>
  )
}
