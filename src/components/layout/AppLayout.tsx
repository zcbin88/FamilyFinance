import { NavLink, Outlet } from 'react-router'
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LedgerProvider } from '@/context/LedgerProvider'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import LedgerSwitcher from '@/components/layout/LedgerSwitcher'

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

  async function handleLogout() {
    await supabase.auth.signOut()
  }

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
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="truncate text-xs text-muted-foreground">家庭成员</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
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

        <main className="px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 移动端底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t bg-card px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
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
