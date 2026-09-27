// 旧版 Safari 补丁：必须是第一个 import，确保先于其他所有模块执行
import '@/lib/polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IonApp, setupIonicReact } from '@ionic/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster, toast } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/context/AuthProvider'
import PwaManager from '@/components/layout/PwaManager'
import { registerSW } from 'virtual:pwa-register'

// 注册 Service Worker（PWA：离线缓存 + 更新提示）
const updateSW = registerSW({
  // 新版本已就绪但尚未激活时，提示用户刷新（比静默 autoUpdate 更可控）
  onNeedRefresh() {
    toast('有新版本可用', {
      description: '更新内容已就绪，刷新即可生效',
      action: { label: '刷新', onClick: () => updateSW(true) },
      duration: Infinity,
    })
  },
  // 首次安装成功、可离线访问时告知用户
  onOfflineReady() {
    toast.success('应用已缓存，可离线使用')
  },
})

// 初始化 Ionic（iOS/Android 各自的原生观感）
setupIonicReact()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IonApp>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <App />
              <PwaManager />
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </IonApp>
  </StrictMode>,
)
