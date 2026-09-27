import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * 监听网络状态变化，提示用户当前在线 / 离线。
 * 离线时应用仍可访问（依赖 Service Worker 的预缓存），
 * 这里只是给用户一个明确的状态反馈，避免误以为数据没同步。
 */
export default function PwaManager() {
  useEffect(() => {
    function handleOnline() {
      toast.success('网络已恢复，数据自动同步')
    }
    function handleOffline() {
      toast.error('网络已断开，当前展示的是缓存数据')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
