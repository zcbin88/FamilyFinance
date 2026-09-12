import { useRef } from 'react'
import {
  IonRefresher,
  IonRefresherContent,
  type RefresherCustomEvent,
} from '@ionic/react'
import { useQueryClient } from '@tanstack/react-query'
import { chevronDownCircleOutline } from 'ionicons/icons'

/** 最短转圈时长：接口很快时也确保刷新动画可感知，避免"一闪而过" */
const MIN_SPIN_MS = 450

/**
 * 下拉刷新。必须是 ion-content 的直接子元素（slot="fixed"）。
 *
 * 默认刷新当前页面所有 react-query 缓存：AppLayout 各页面的数据
 * （家庭/账本/分类/交易/统计/资料）都会被重新拉取。
 * 传入 onRefresh 可覆盖为自定义刷新逻辑。
 */
export default function PullToRefresh({
  onRefresh,
}: {
  onRefresh?: () => Promise<unknown>
}) {
  const qc = useQueryClient()
  // 防止刷新未结束时再次触发（快速连拉）
  const refreshing = useRef(false)

  async function handleRefresh(ev: RefresherCustomEvent) {
    if (refreshing.current) return
    refreshing.current = true
    try {
      await Promise.all([
        onRefresh ? onRefresh() : qc.invalidateQueries(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
      ])
    } finally {
      refreshing.current = false
      await ev.detail.complete()
    }
  }

  return (
    <IonRefresher slot="fixed" onIonRefresh={handleRefresh} pullMin={60} pullFactor={0.8}>
      <IonRefresherContent
        pullingIcon={chevronDownCircleOutline}
        pullingText="下拉刷新"
        refreshingSpinner="crescent"
        refreshingText="正在同步…"
      />
    </IonRefresher>
  )
}
