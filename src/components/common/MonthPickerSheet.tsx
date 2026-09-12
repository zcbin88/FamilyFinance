import { format } from 'date-fns'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { chevronBack } from 'ionicons/icons'

interface MonthPickerSheetProps {
  isOpen: boolean
  /** 当前选中月份，格式 yyyy-MM */
  month: string
  onClose: () => void
  /** 选择月份后的回调，参数格式 yyyy-MM */
  onSelect: (month: string) => void
}

/**
 * 月份选择半屏弹窗（Ionic sheet modal）
 * - 仅占据屏幕下方约 60% 高度，向下拖动 / 点击遮罩即可关闭
 * - 顶部提供「返回」按钮，避免全屏弹窗进去后出不来
 * - 右上角「本月」一键回到当月
 */
export default function MonthPickerSheet({
  isOpen,
  month,
  onClose,
  onSelect,
}: MonthPickerSheetProps) {
  function pick(value: string) {
    onSelect(value)
    onClose()
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.6}
      breakpoints={[0, 0.6]}
      className="month-sheet"
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose} aria-label="返回">
              <IonIcon slot="start" icon={chevronBack} />
              返回
            </IonButton>
          </IonButtons>
          <IonTitle>选择月份</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => pick(format(new Date(), 'yyyy-MM'))}>本月</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="flex h-full flex-col items-center px-2 pb-4">
          <IonDatetime
            className="month-datetime"
            presentation="month-year"
            locale="zh-CN"
            value={month}
            onIonChange={(e) => {
              const v = e.detail.value
              if (typeof v === 'string' && v) pick(v.slice(0, 7))
            }}
          />
        </div>
      </IonContent>
    </IonModal>
  )
}
