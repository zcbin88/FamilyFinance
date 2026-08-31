import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCreateTransaction } from '@/hooks/useTransactions'

export default function TransactionFormPage() {
  const navigate = useNavigate()
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()
  const createTx = useCreateTransaction(family?.id, currentLedger?.id)

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">记一笔</h1>
          <p className="text-sm text-muted-foreground">
            账本：{currentLedger?.name ?? '…'}
          </p>
        </div>
      </div>

      {family && currentLedger ? (
        <div className="mx-auto max-w-lg">
          <TransactionForm
            familyId={family.id}
            submitting={createTx.isPending}
            onSubmit={handleSubmit}
            submitLabel="保存这笔账"
          />
        </div>
      ) : (
        <p className="py-10 text-center text-muted-foreground">账本加载中…</p>
      )}
    </div>
  )
}
