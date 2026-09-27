import { Outlet, useLocation, useNavigate } from 'react-router'
import {
  IonButton,
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
  arrowBack,
  barChartOutline,
  gridOutline,
  listOutline,
  searchOutline,
  settingsOutline,
} from 'ionicons/icons'
import LedgerSwitcher from '@/components/layout/LedgerSwitcher'
import PullToRefresh from '@/components/common/PullToRefresh'

const TABS = [
  { path: '/', label: '首页', icon: gridOutline, end: true },
  { path: '/transactions', label: '明细', icon: listOutline, end: false },
  { path: '/statistics', label: '统计', icon: barChartOutline, end: false },
  { path: '/settings', label: '设置', icon: settingsOutline, end: false },
]

/** 顶部栏标题：页面标题放这里，省下正文区的垂直空间 */
const PAGE_TITLES: Record<string, string> = {
  '/': '仪表盘',
  '/transactions': '明细',
  '/transactions/search': '搜索',
  '/statistics': '统计',
  '/settings': '设置',
  '/settings/profile': '账号信息',
}

/** 子页面：顶部栏出现返回按钮，并隐藏账本切换 */
const SUB_PAGES: Record<string, string> = {
  '/settings/profile': '/settings',
  '/transactions/search': '/transactions',
}

function isActive(pathname: string, path: string, end: boolean) {
  return end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const backTo = SUB_PAGES[pathname]

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {backTo ? (
            <IonButtons slot="start">
              <IonButton onClick={() => navigate(backTo)} aria-label="返回">
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
          ) : (
            <IonButtons slot="start">
              <LedgerSwitcher />
            </IonButtons>
          )}
          <IonTitle className="text-base font-semibold">
            {PAGE_TITLES[pathname] ?? '家庭银行'}
          </IonTitle>
          {!backTo && (
            <IonButtons slot="end">
              <IonButton onClick={() => navigate('/transactions/search')} aria-label="搜索">
                <IonIcon slot="icon-only" icon={searchOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* 下拉刷新：首页 / 明细 / 统计 / 设置 / 账号信息 共用此 IonContent */}
        <PullToRefresh />

        <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
          <Outlet />
        </div>
      </IonContent>

      {/* 底部导航：IonTabBar 有 contain:strict 会裁剪溢出，
          所以凸起按钮必须放在 TabBar 外层的相对容器里做绝对定位 */}
      <div className="relative">
        <IonTabBar>
          {TABS.map((tab, index) => (
            <IonTabButton
              key={tab.path}
              tab={tab.path}
              selected={isActive(pathname, tab.path, tab.end)}
              onClick={() => navigate(tab.path)}
              // IonTabBar 只接受 ion-tab-button，普通 div 占位会被丢弃，
              // 因此用相邻两个 Tab 的 margin 撑出中间凸起按钮的空档
              style={{
                ...(index === 1 ? { marginInlineEnd: '2.5rem' } : {}),
                ...(index === 2 ? { marginInlineStart: '2.5rem' } : {}),
              }}
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
          className="absolute left-1/2 top-0 z-20 flex size-14 -translate-x-1/2 -translate-y-4 flex-col items-center justify-center gap-0.5 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <IonIcon icon={add} className="text-2xl" />
          <span className="text-[10px] font-medium leading-none">记账</span>
        </button>
      </div>
    </IonPage>
  )
}
