import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { arrowBack } from 'ionicons/icons'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCreateTransaction } from '@/hooks/useTransactions'

/** 记账页：全屏专注模式（不套 AppLayout，无底部导航干扰） */
export default function TransactionFormPage() {
  const navigate = useNavigate()
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()
  const createTx = useCreateTransaction(family?.id, currentLedger?.id)

  function goBack() {
    // 有历史则返回来源页，否则回明细
    if (window.history.length > 1) navigate(-1)
    else navigate('/transactions', { replace: true })
  }

  async function handleSubmit(values: TransactionFormValues) {
    try {
      await createTx.mutateAsync(values)
      toast.success('记账成功')
      navigate('/transactions', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '记账失败')
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={goBack} aria-label="返回">
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>记一笔</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="mx-auto w-full max-w-lg px-4 py-5">
          <IonNote className="mb-4 block px-1 text-xs">
            当前账本：{currentLedger?.name ?? '加载中…'}
          </IonNote>

          {family && currentLedger ? (
            <TransactionForm
              familyId={family.id}
              submitting={createTx.isPending}
              onSubmit={handleSubmit}
              submitLabel="保存这笔账"
            />
          ) : (
            <p className="py-10 text-center text-muted-foreground">账本加载中…</p>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
