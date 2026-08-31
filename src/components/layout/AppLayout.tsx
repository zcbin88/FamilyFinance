import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LedgerProvider } from '@/context/LedgerProvider'
import { useAuth } from '@/context/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'
import LedgerSwitcher from '@/components/layout/LedgerSwitcher'
import LogoutDialog from '@/components/layout/LogoutDialog'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: '明细', icon: ReceiptText, end: false },
  { to: '/statistics', label: '统计', icon: BarChart3, end: false },
  { to: '/settings', label: '设置', icon: Settings, end: false },
]

function NavItems({ className }: { className?: string }) {
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function LayoutInner() {
  const { user } = useAuth()
  const { data: profile } = useProfile(!!user)
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background">
      {/* 桌面端侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card px-4 py-6 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <span className="text-lg font-semibold">家庭账本</span>
        </div>

        <div className="mb-6">
          <LedgerSwitcher />
        </div>

        <NavItems className="flex-1" />

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.name || user?.email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.name ? user?.email : '家庭成员'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogoutOpen(true)}
            title="退出登录"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="md:ml-60">
        {/* 移动端顶部：当前账本切换 */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <LedgerSwitcher compact />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 移动端底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t bg-card px-2 py-2 md:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <LayoutDashboard className="size-5" />
          首页
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <ReceiptText className="size-5" />
          明细
        </NavLink>

        {/* 中间记账大按钮 */}
        <button
          onClick={() => navigate('/transactions/new')}
          className="flex size-14 -translate-y-4 flex-col items-center justify-center gap-0.5 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          title="记一笔"
        >
          <Plus className="size-6" />
          <span className="text-[10px] font-medium">记账</span>
        </button>

        <NavLink
          to="/statistics"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <BarChart3 className="size-5" />
          统计
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <Settings className="size-5" />
          设置
        </NavLink>
      </nav>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  )
}

export default function AppLayout() {
  return (
    <LedgerProvider>
      <LayoutInner />
    </LedgerProvider>
  )
}
