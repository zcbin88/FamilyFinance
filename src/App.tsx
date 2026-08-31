import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { LedgerProvider } from '@/context/LedgerProvider'
import { useAuth } from '@/context/AuthProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ProfilePage from '@/pages/settings/ProfilePage'
import StatisticsPage from '@/pages/statistics/StatisticsPage'
import TransactionsPage from '@/pages/transactions/TransactionsPage'
import TransactionFormPage from '@/pages/transactions/TransactionFormPage'

function FullPageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/auth/login" replace />
  return children
}

/** 业务页面前提：已登录且有家庭；无家庭 → 引导页 */
function FamilyGate({ children }: { children?: ReactNode }) {
  const { data: family, isLoading } = useCurrentFamily()

  if (isLoading) return <FullPageLoading />
  if (!family) return <Navigate to="/onboarding" replace />
  return children ?? <Outlet />
}

export default function App() {
  return (
    <LedgerProvider>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* 记账页：全屏专注（不套 AppLayout），桌面移动端一致 */}
        <Route
          path="/transactions/new"
          element={
            <RequireAuth>
              <FamilyGate>
                <TransactionFormPage />
              </FamilyGate>
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route element={<FamilyGate />}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 账号信息不依赖家庭，可在无家庭时访问 */}
          <Route path="settings/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LedgerProvider>
  )
}
