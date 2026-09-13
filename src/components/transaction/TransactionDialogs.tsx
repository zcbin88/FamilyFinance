import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { formatMoney } from '@/lib/money'
import type { Category, Transaction } from '@/types/database'

interface TransactionEditModalProps {
  /** 非空即打开 */
  transaction: Transaction | null
  familyId?: string
  submitting: boolean
  onSubmit: (values: TransactionFormValues) => Promise<void>
  onClose: () => void
}

/** 编辑账单：Ionic 全屏 Modal，明细页与搜索页共用 */
export function TransactionEditModal({
  transaction,
  familyId,
  submitting,
  onSubmit,
  onClose,
}: TransactionEditModalProps) {
  return (
    <IonModal isOpen={!!transaction} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>编辑账单</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>关闭</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="mx-auto w-full max-w-lg px-4 py-5">
          {transaction && familyId && (
            <TransactionForm
              key={transaction.id}
              familyId={familyId}
              initial={transaction}
              submitting={submitting}
              onSubmit={onSubmit}
              submitLabel="保存修改"
            />
          )}
        </div>
      </IonContent>
    </IonModal>
  )
}

interface TransactionDeleteAlertProps {
  /** 非空即打开 */
  transaction: Transaction | null
  categoryMap: Map<string, Category>
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

/** 删除确认：IonAlert 原生弹窗 */
export function TransactionDeleteAlert({
  transaction,
  categoryMap,
  onCancel,
  onConfirm,
}: TransactionDeleteAlertProps) {
  return (
    <IonAlert
      isOpen={!!transaction}
      header="删除这笔账单？"
      message={
        transaction
          ? `${categoryMap.get(transaction.category_id)?.name ?? '未知分类'} · ${formatMoney(transaction.amount)} 元，删除后不可恢复。`
          : ''
      }
      buttons={[
        { text: '取消', role: 'cancel' },
        { text: '确认删除', role: 'destructive', handler: onConfirm },
      ]}
      onDidDismiss={onCancel}
    />
  )
}
